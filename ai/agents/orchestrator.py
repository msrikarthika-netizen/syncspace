import asyncio
import re
from datetime import datetime, timezone
from typing import TypedDict, List, Optional
from loguru import logger
from services.llm_service import break_task_into_subtasks, generate_direct_answer, generate_report_summary
from agents import get_agent
import httpx
from config.settings import settings
from config.database import get_checkpointer

try:
    from langgraph.graph import END, START, StateGraph
except ImportError:
    END = START = StateGraph = None

class OrchestratorState(TypedDict):
    task_id: str
    task_title: str
    task_description: str
    user_id: Optional[str]
    priority: str
    tags: List[str]
    route: str
    direct_answer: str
    retrieved_sources: List[dict]
    knowledge_context: str
    
    subtask_plans: List[dict]
    completed_results: List[dict]
    current_index: int
    
    summary: str
    report_data: dict
    final_status: str
    report_id: Optional[str]


_COMPLEX_REQUEST_TERMS = (
    "analyze", "architecture", "audit", "build", "code", "compare", "create", "debug",
    "design", "develop", "estimate", "implement", "integrate", "investigate", "migrate",
    "multi-step", "plan", "refactor", "research", "roadmap", "rollout", "strategy", "test",
    "troubleshoot", "workflow",
)
_SIMPLE_QUESTION_PATTERN = re.compile(
    r"^(what is|what's|who is|where is|when is|when did|define|meaning of|explain)\b",
    re.IGNORECASE,
)
_GREETING_PATTERN = re.compile(r"^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$", re.IGNORECASE)
_DEFINITION_COMPLEXITY_TERMS = (
    "architecture", "audit", "build", "create", "debug", "design", "develop", "estimate",
    "implement", "integrate", "migrate", "plan", "roadmap", "rollout", "strategy", "workflow",
)
_FOCUSED_CODING_PATTERN = re.compile(
    r"\b(python|javascript|typescript|java|c\+\+|c#|sql|function|method|class|script|regex|algorithm)\b",
    re.IGNORECASE,
)
_FOCUSED_CODING_ACTION_PATTERN = re.compile(
    r"^(write|create|implement|fix|refactor|add|generate)\b",
    re.IGNORECASE,
)


def _request_text(state: OrchestratorState) -> str:
    """Create one prompt from the title and description without duplicating text."""
    title = state.get("task_title", "").strip()
    description = state.get("task_description", "").strip()
    return title if not description or description == title else f"{title}\n{description}"


def classify_request(prompt: str) -> str:
    """Classify clear low-complexity prompts locally; route uncertain work to experts.

    Defaulting to complex avoids returning shallow answers to ambiguous requests.
    """
    normalized = " ".join(prompt.lower().split())
    if not normalized:
        return "complex"
    if _GREETING_PATTERN.fullmatch(normalized):
        return "simple"
    word_count = len(re.findall(r"\b\w+\b", normalized))
    # Small self-contained programming requests need one Coding Agent, not the
    # full research/analysis/coding/writing workflow.
    if (
        word_count <= 30
        and _FOCUSED_CODING_ACTION_PATTERN.match(normalized)
        and _FOCUSED_CODING_PATTERN.search(normalized)
        and not any(re.search(rf"\b{re.escape(term)}\b", normalized) for term in _DEFINITION_COMPLEXITY_TERMS)
    ):
        return "coding"
    # A short definition remains simple even if it contains a domain word such
    # as "code", "testing", or "research". Action-oriented definitions do not.
    if (
        word_count <= 18
        and _SIMPLE_QUESTION_PATTERN.match(normalized)
        and not any(re.search(rf"\b{re.escape(term)}\b", normalized) for term in _DEFINITION_COMPLEXITY_TERMS)
    ):
        return "simple"
    if any(re.search(rf"\b{re.escape(term)}\b", normalized) for term in _COMPLEX_REQUEST_TERMS):
        return "complex"
    if word_count <= 18 and _SIMPLE_QUESTION_PATTERN.match(normalized):
        return "simple"
    return "complex"


async def router_node(state: OrchestratorState) -> dict:
    """First graph node: choose direct response or the full RAG/agent workflow."""
    route = classify_request(_request_text(state))
    logger.info(f"Router selected '{route}' route for task {state.get('task_id', 'unknown')}")
    return {"route": route}


def route_by_complexity(state: OrchestratorState) -> str:
    return state.get("route", "complex")


async def answer_simple_node(state: OrchestratorState) -> dict:
    """Respond to a greeting or factual question without retrieval or specialist agents."""
    prompt = _request_text(state)
    if _GREETING_PATTERN.fullmatch(" ".join(prompt.lower().split())):
        answer = "Hello! How can I help you?"
    else:
        answer = await generate_direct_answer(prompt)
    return {
        "direct_answer": answer,
        "summary": answer,
        "completed_results": [],
        "retrieved_sources": [],
        "knowledge_context": "",
    }


async def execute_focused_coding_node(state: OrchestratorState) -> dict:
    """Run one self-contained coding request through only the Coding Agent."""
    task_id = state["task_id"]
    prompt = _request_text(state)
    subtask = {
        "title": "Implement requested code",
        "description": prompt,
        "agent_type": "coding",
        "order": 1,
    }
    agent = get_agent("coding")
    started_at = datetime.now(timezone.utc).isoformat()
    await _notify_backend(
        f"/api/v1/tasks/{task_id}/subtask-update",
        {
            "task_id": task_id,
            "title": subtask["title"],
            "description": subtask["description"],
            "agent_type": agent.agent_type,
            "agent_name": agent.agent_name,
            "status": "running",
            "result": "",
            "order": 1,
            "started_at": started_at,
            "progress": 30,
        },
    )
    result = await agent.run(state["task_title"], subtask)
    await _notify_backend(
        f"/api/v1/tasks/{task_id}/subtask-update",
        {**result, "task_id": task_id, "progress": 90},
    )
    summary = result["result"] if result["status"] == "completed" else result.get("error", "Coding failed")
    return {
        "subtask_plans": [subtask],
        "completed_results": [result],
        "current_index": 1,
        "summary": summary,
        "retrieved_sources": [],
        "knowledge_context": "",
    }


async def validate_task_node(state: OrchestratorState) -> dict:
    """Fail early for malformed background jobs before making provider calls."""
    if not state.get("task_id"):
        raise ValueError("task_id is required")
    if not state.get("task_title", "").strip():
        raise ValueError("task_title is required")
    if not state.get("task_description", "").strip():
        raise ValueError("task_description is required")
    return {}


async def retrieve_knowledge_node(state: OrchestratorState) -> dict:
    """Retrieve curated, immutable engineering guidance for this task."""
    if not settings.rag_enabled:
        return {"retrieved_sources": [], "knowledge_context": ""}
    # Import only for the complex route. Simple and focused-coding requests do
    # not need the embedding model or its dependencies.
    from rag.retriever import format_context, retrieve_context

    query = "\n".join(
        part for part in [
            state.get("task_title", ""),
            state.get("task_description", ""),
            " ".join(state.get("tags", [])),
        ] if part
    )
    try:
        sources = await retrieve_context(query)
        logger.info(f"RAG retrieved {len(sources)} curated chunk(s) for task {state['task_id']}")
        return {"retrieved_sources": sources, "knowledge_context": format_context(sources)}
    except Exception as exc:
        # Generation remains available when the corpus is empty or retrieval has a
        # transient issue; the report records that no source was used.
        logger.warning(f"RAG retrieval unavailable for task {state['task_id']}: {exc}")
        return {"retrieved_sources": [], "knowledge_context": ""}

async def _notify_backend(endpoint: str, payload: dict, attempts: int = 3) -> dict:
    """Deliver a required workflow update and return the backend response.

    Orchestration cannot claim success until the backend has persisted the update.
    """
    url = f"{settings.backend_base_url}{endpoint}"
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
            if isinstance(exc, httpx.HTTPStatusError):
                try:
                    response_data = exc.response.json()
                    backend_message = (
                        response_data.get("message")
                        or response_data.get("detail")
                        or exc.response.text
                    )
                except ValueError:
                    backend_message = exc.response.text
                last_error = RuntimeError(f"{exc} — {backend_message}")
            else:
                last_error = exc
            if attempt < attempts:
                delay_seconds = 0.5 * attempt
                logger.warning(
                    f"Backend notification failed [{url}] (attempt {attempt}/{attempts}): {last_error}. "
                    f"Retrying in {delay_seconds}s."
                )
                await asyncio.sleep(delay_seconds)

    raise RuntimeError(
        f"Backend notification failed after {attempts} attempts [{url}]: {last_error}"
    )


async def decompose_task_node(state: OrchestratorState) -> dict:
    logger.info(f"🎯 Orchestrator: Starting task [{state['task_id']}] — '{state['task_title']}'")
    subtask_plans = await break_task_into_subtasks(
        state["task_title"], state["task_description"], state.get("knowledge_context", "")
    )
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
        return await agent.run(
            state["task_title"], subtask_plan, state.get("knowledge_context", "")
        )

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
    summary = await generate_report_summary(
        state["task_title"], completed_results, state.get("knowledge_context", "")
    )
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

    retrieved_sources = state.get("retrieved_sources", [])
    if retrieved_sources:
        full_content += "## Curated Knowledge Sources\n"
        for source in retrieved_sources:
            full_content += (
                f"- {source['title']} — chunk {source['chunk_index'] + 1} "
                f"(similarity {source['similarity']})\n"
            )
        full_content += "\n"

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
            "workflowRoute": state.get("route", "complex"),
            "ragSources": [
                {
                    "sourceKey": source["source_key"],
                    "title": source["title"],
                    "category": source["category"],
                    "chunkIndex": source["chunk_index"],
                    "similarity": source["similarity"],
                }
                for source in retrieved_sources
            ],
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


def build_rag_graph(checkpointer=None):
    """Build the durable RAG workflow; a checkpointer is supplied at runtime."""
    if StateGraph is None:
        raise RuntimeError("LangGraph is missing. Run pip install -r ai/requirements.txt.")
    graph = StateGraph(OrchestratorState)
    graph.add_node("router", router_node)
    graph.add_node("answer_simple", answer_simple_node)
    graph.add_node("execute_focused_coding", execute_focused_coding_node)
    graph.add_node("validate_task", validate_task_node)
    graph.add_node("retrieve_knowledge", retrieve_knowledge_node)
    graph.add_node("decompose_task", decompose_task_node)
    graph.add_node("execute_subtasks", execute_subtasks_node)
    graph.add_node("generate_summary", generate_summary_node)
    graph.add_node("build_report", build_report_node)
    graph.add_edge(START, "router")
    graph.add_conditional_edges(
        "router",
        route_by_complexity,
        {
            "simple": "answer_simple",
            "coding": "execute_focused_coding",
            "complex": "validate_task",
        },
    )
    # A simple answer still passes through report persistence so the task is
    # marked complete in the existing backend integration, but it invokes no agents.
    graph.add_edge("answer_simple", "build_report")
    graph.add_edge("execute_focused_coding", "build_report")
    graph.add_edge("validate_task", "retrieve_knowledge")
    graph.add_edge("retrieve_knowledge", "decompose_task")
    graph.add_edge("decompose_task", "execute_subtasks")
    graph.add_edge("execute_subtasks", "generate_summary")
    graph.add_edge("generate_summary", "build_report")
    graph.add_edge("build_report", END)
    return graph.compile(checkpointer=checkpointer)


async def orchestrate(task_id: str, task_title: str, task_description: str,
                      user_id: str = None, priority: str = "medium", tags: list[str] | None = None) -> dict:
    """Run the task through the checkpointed LangGraph RAG pipeline."""
    initial_state = {
        "task_id": task_id,
        "task_title": task_title,
        "task_description": task_description,
        "user_id": user_id,
        "priority": priority,
        "tags": tags or [],
        "route": "complex",
        "direct_answer": "",
        "retrieved_sources": [],
        "knowledge_context": "",
        "subtask_plans": [],
        "completed_results": [],
        "current_index": 0,
        "summary": "",
        "report_data": {},
        "final_status": "pending",
        "report_id": None,
    }
    checkpointer = await get_checkpointer()
    graph = build_rag_graph(checkpointer=checkpointer)
    state = await graph.ainvoke(
        initial_state,
        {"configurable": {"thread_id": f"task:{task_id}"}},
    )
    
    return {
        "status": state.get("final_status", "failed"),
        "task_id": task_id,
        "subtasks": len(state.get("completed_results", [])),
        "report_saved": bool(state.get("report_id")),
        "report_id": state.get("report_id"),
    }
