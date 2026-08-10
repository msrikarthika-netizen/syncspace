import asyncio
from datetime import datetime, timezone
from typing import TypedDict, List, Optional
from loguru import logger
from services.llm_service import break_task_into_subtasks, generate_report_summary
from agents import get_agent
import httpx
from config.settings import settings

class OrchestratorState(TypedDict):
    task_id: str
    task_title: str
    task_description: str
    user_id: Optional[str]
    priority: str
    
    subtask_plans: List[dict]
    completed_results: List[dict]
    current_index: int
    
    summary: str
    report_data: dict
    final_status: str
    report_id: Optional[str]

async def _notify_backend(endpoint: str, payload: dict, attempts: int = 3) -> dict:
    """Deliver a required workflow update and return the backend response.

    Orchestration cannot claim success until the backend has persisted the update.
    """
    url = f"{settings.backend_url}{endpoint}"
    headers = {}
    if settings.webhook_secret:
        headers["x-internal-secret"] = settings.webhook_secret

    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            if not data.get("success"):
                raise RuntimeError(data.get("message", "Backend rejected the workflow update"))
            return data
        except (httpx.HTTPError, ValueError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                delay_seconds = 0.5 * attempt
                logger.warning(
                    f"Backend notification failed [{url}] (attempt {attempt}/{attempts}): {exc}. "
                    f"Retrying in {delay_seconds}s."
                )
                await asyncio.sleep(delay_seconds)

    raise RuntimeError(
        f"Backend notification failed after {attempts} attempts [{url}]: {last_error}"
    )


async def decompose_task_node(state: OrchestratorState) -> dict:
    logger.info(f"🎯 Orchestrator: Starting task [{state['task_id']}] — '{state['task_title']}'")
    subtask_plans = await break_task_into_subtasks(state["task_title"], state["task_description"])
    logger.info(f"📋 Decomposed into {len(subtask_plans)} subtasks: "
                f"{[s['agent_type'] for s in subtask_plans]}")
    return {"subtask_plans": subtask_plans, "current_index": 0, "completed_results": []}


async def execute_subtasks_node(state: OrchestratorState) -> dict:
    subtask_plans = state.get("subtask_plans", [])
    if not subtask_plans:
        return {"completed_results": [], "current_index": 0}

    task_id = state["task_id"]
    total = len(subtask_plans)
    started_at = datetime.now(timezone.utc).isoformat()

    assignment_notifications = []
    for subtask_plan in subtask_plans:
        agent = get_agent(subtask_plan["agent_type"])
        assignment_notifications.append(
            _notify_backend(
                f"/api/v1/tasks/{task_id}/subtask-update",
                {
                    "task_id": task_id,
                    "title": subtask_plan["title"],
                    "description": subtask_plan["description"],
                    "agent_type": agent.agent_type,
                    "agent_name": agent.agent_name,
                    "status": "running",
                    "result": "",
                    "order": subtask_plan.get("order", 0),
                    "started_at": started_at,
                    "progress": 15,
                },
            )
        )
    await asyncio.gather(*assignment_notifications)

    logger.info(f"🚀 Assigned {total} subtasks; all specialist agents are running in parallel")

    async def run_one(subtask_plan: dict) -> dict:
        agent = get_agent(subtask_plan["agent_type"])
        return await agent.run(state["task_title"], subtask_plan)

    tasks = [asyncio.create_task(run_one(plan)) for plan in subtask_plans]
    completed_results = []

    try:
        for finished in asyncio.as_completed(tasks):
            result = await finished
            completed_results.append(result)
            progress = int(15 + (len(completed_results) / total) * 70)
            await _notify_backend(
                f"/api/v1/tasks/{task_id}/subtask-update",
                {**result, "task_id": task_id, "progress": progress},
            )
            logger.info(f"   Progress: {progress}%")
    except Exception:
        for task in tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        raise

    completed_results.sort(key=lambda item: item.get("order", 0))
    return {"completed_results": completed_results, "current_index": total}


async def generate_summary_node(state: OrchestratorState) -> dict:
    logger.info("📝 Generating executive summary...")
    completed_results = state.get("completed_results", [])
    summary = await generate_report_summary(state["task_title"], completed_results)
    return {"summary": summary}


async def build_report_node(state: OrchestratorState) -> dict:
    completed_results = state.get("completed_results", [])
    task_title = state.get("task_title", "")
    summary = state.get("summary", "")
    task_id = state.get("task_id", "")
    user_id = state.get("user_id")

    sections = []
    for i, res in enumerate(completed_results):
        sections.append({
            "agent_type": res["agent_type"],
            "agent_name": res["agent_name"],
            "heading": res["title"],
            "content": res["result"] if res["status"] == "completed"
                       else f"⚠️ This section failed: {res.get('error', 'Unknown error')}",
            "order": i + 1,
        })

    full_content = f"# {task_title}\n\n**Executive Summary**\n{summary}\n\n"
    for sec in sections:
        full_content += f"## {sec['heading']} ({sec['agent_name']})\n{sec['content']}\n\n"

    completed = [r for r in completed_results if r["status"] == "completed"]
    failed = [r for r in completed_results if r["status"] == "failed"]
    agents_used = list({r["agent_name"] for r in completed_results})
    total_duration = sum(r.get("duration_ms", 0) for r in completed_results)

    final_status = "failed" if failed else "completed"
    report_data = {
        "title": f"AI Report: {task_title}",
        "summary": summary,
        "sections": sections,
        "full_content": full_content,
        "user_id": user_id,
        "stats": {
            "totalSubtasks": len(completed_results),
            "completedSubtasks": len(completed),
            "failedSubtasks": len(failed),
            "totalDurationMs": total_duration,
            "agentsUsed": agents_used,
        },
        "task_status": final_status,
    }

    save_response = await _notify_backend(f"/api/v1/reports/task/{task_id}/save", report_data)
    report_id = save_response.get("data", {}).get("_id")
    if final_status == "completed":
        logger.success(f"🏁 Orchestrator: Task [{task_id}] fully completed!")
    else:
        logger.warning(f"🏁 Orchestrator: Task [{task_id}] finished with {len(failed)} failed agent(s)")

    return {
        "report_data": report_data,
        "final_status": final_status,
        "report_id": report_id,
    }


async def orchestrate(task_id: str, task_title: str, task_description: str,
                      user_id: str = None, priority: str = "medium") -> dict:
    """
    Main entry point for decomposition, parallel agent execution, and reporting.
    """
    state = {
        "task_id": task_id,
        "task_title": task_title,
        "task_description": task_description,
        "user_id": user_id,
        "priority": priority,
        "subtask_plans": [],
        "completed_results": [],
        "current_index": 0,
        "summary": "",
        "report_data": {},
        "final_status": "pending",
        "report_id": None,
    }

    state.update(await decompose_task_node(state))
    state.update(await execute_subtasks_node(state))
    state.update(await generate_summary_node(state))
    state.update(await build_report_node(state))
    
    return {
        "status": state.get("final_status", "failed"),
        "task_id": task_id,
        "subtasks": len(state.get("completed_results", [])),
        "report_saved": bool(state.get("report_id")),
        "report_id": state.get("report_id"),
    }
