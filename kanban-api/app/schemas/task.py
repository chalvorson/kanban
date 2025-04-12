from pydantic import BaseModel
from typing import List, Optional, Union
from datetime import datetime

from app.schemas.comment import Comment
from app.schemas.tag import Tag

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    priority: str = "medium"
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[Union[datetime, None]] = None
    end_date: Optional[Union[datetime, None]] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[Union[int, None]] = None
    time_spent: Optional[float] = None
    is_tracking: Optional[bool] = None
    tracking_start_time: Optional[Union[datetime, None]] = None

class TaskTimeTrackingUpdate(BaseModel):
    is_tracking: bool
    tracking_start_time: Optional[datetime] = None

class Task(TaskBase):
    id: int
    time_spent: float = 0
    is_tracking: bool = False
    tracking_start_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comments: List[Comment] = []
    tags: List[Tag] = []

    class Config:
        from_attributes = True
