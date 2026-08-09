from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskRequest(BaseModel):
    task_id: str
    user_id: Optional[str] = None
    title: str
    description: str
    priority: str = "medium"
    tags: list[str] = []


class SubTaskResult(BaseModel):
    title: str
    description: str
    agent_type: str
    agent_name: str
    status: str
    result: str
    order: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ReportSection(BaseModel):
    agent_type: str
    agent_name: str
    heading: str
    content: str
    order: int


class ReportData(BaseModel):
    title: str
    summary: str
    sections: list[ReportSection]
    full_content: str
    user_id: Optional[str] = None
    stats: dict = {}


class ProcessingStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    message: str
    subtasks: list[dict] = []
