from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.task_models import TaskRequest, ProcessingStatus
from agents.orchestrator import orchestrate, _notify_backend
from config.settings import settings
from loguru import logger

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# In-memory status tracker (use Redis in production)
_task_status: dict[str, dict] = {}


async def _save_failure_report(request: TaskRequest, error: Exception) -> None:
    """Give the manager a durable explanation when orchestration cannot finish."""
    error_message = str(error)
    report_data = {
        "title": f"AI Report: {request.title}",
        "summary": "The AI workflow could not complete. Review the failure details before assigning the task again.",
        "sections": [],
        "full_content": f"# {request.title}\n\n## Workflow failure\n{error_message}\n",
        "user_id": request.user_id,
        "task_status": "failed",
        "stats": {
            "totalSubtasks": 0,
            "completedSubtasks": 0,
            "failedSubtasks": 1,
            "totalDurationMs": 0,
            "agentsUsed": [],
        },
    }
    await _notify_backend(f"/api/v1/reports/task/{request.task_id}/save", report_data)


@router.post("/process")
async def process_task(request: TaskRequest, background_tasks: BackgroundTasks):
    """
    Receive a task from the Node.js backend and kick off AI orchestration.
    Returns immediately; processing runs in the background.
    """
    if not settings.internal_webhook_secret:
        raise HTTPException(
            status_code=503,
            detail="INTERNAL_WEBHOOK_SECRET must be configured before AI tasks can be processed",
        )

    task_id = request.task_id
    _task_status[task_id] = {
        "task_id": task_id,
        "status": "queued",
        "progress": 5,
        "message": "Task received and queued",
    }

    async def _run():
        _task_status[task_id].update({"status": "processing", "progress": 10,
                                       "message": "AI orchestrator running..."})
        try:
            result = await orchestrate(
                task_id=task_id,
                task_title=request.title,
                task_description=request.description,
                user_id=request.user_id,
                priority=request.priority,
            )
            succeeded = result["status"] == "completed" and result["report_saved"]
            _task_status[task_id].update({
                "status": "completed" if succeeded else "failed",
                "progress": 100 if succeeded else 0,
                "message": "All agents completed — report ready" if succeeded
                           else "Report ready with failed agent work",
            })
            return result
        except Exception as exc:
            logger.error(f"Orchestration failed for {task_id}: {exc}")
            _task_status[task_id].update({
                "status": "failed",
                "progress": 0,
                "message": str(exc),
            })
            try:
                await _save_failure_report(request, exc)
            except Exception as report_exc:
                logger.error(f"Failure report could not be saved for {task_id}: {report_exc}")
                try:
                    await _notify_backend(f"/api/v1/tasks/{task_id}/fail", {"error": str(exc)})
                except Exception as notify_exc:
                    logger.error(f"Backend failure notification could not be delivered for {task_id}: {notify_exc}")

    background_tasks.add_task(_run)
    return {"status": "queued", "task_id": task_id, "message": "AI processing started"}


@router.get("/{task_id}/status", response_model=ProcessingStatus)
async def get_task_status(task_id: str):
    """Poll the AI service for processing status of a task."""
    status = _task_status.get(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="Task not found in AI service")
    return ProcessingStatus(**{**status, "subtasks": []})
