from abc import ABC, abstractmethod
from datetime import datetime, timezone
from loguru import logger
from services.llm_service import run_agent_task


class BaseAgent(ABC):
    agent_type: str = "general"
    agent_name: str = "General Agent"
    emoji: str = "🤖"

    async def run(self, task_title: str, subtask: dict, knowledge_context: str = "") -> dict:
        """Execute this agent's subtask and return a result dict."""
        started_at = datetime.now(timezone.utc)
        logger.info(f"{self.emoji} [{self.agent_name}] Starting: {subtask['title']}")

        try:
            result = await self.execute(task_title, subtask, knowledge_context)
            completed_at = datetime.now(timezone.utc)
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)

            logger.success(f"✅ [{self.agent_name}] Completed in {duration_ms}ms")
            return {
                "title": subtask["title"],
                "description": subtask["description"],
                "agent_type": self.agent_type,
                "agent_name": self.agent_name,
                "status": "completed",
                "result": result,
                "order": subtask.get("order", 0),
                "started_at": started_at.isoformat(),
                "completed_at": completed_at.isoformat(),
                "duration_ms": duration_ms,
            }
        except Exception as exc:
            completed_at = datetime.now(timezone.utc)
            logger.error(f"❌ [{self.agent_name}] Failed: {exc}")
            return {
                "title": subtask["title"],
                "description": subtask["description"],
                "agent_type": self.agent_type,
                "agent_name": self.agent_name,
                "status": "failed",
                "result": "",
                "error": str(exc),
                "order": subtask.get("order", 0),
                "started_at": started_at.isoformat(),
                "completed_at": completed_at.isoformat(),
                "duration_ms": int((completed_at - started_at).total_seconds() * 1000),
            }

    async def execute(self, task_title: str, subtask: dict, knowledge_context: str = "") -> str:
        """Default execution delegates to the LLM service."""
        return await run_agent_task(
            agent_type=self.agent_type,
            agent_name=self.agent_name,
            task_title=task_title,
            subtask_title=subtask["title"],
            subtask_description=subtask["description"],
            knowledge_context=knowledge_context,
        )
