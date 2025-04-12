from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CommentBase(BaseModel):
    text: str
    task_id: int
    author_id: int

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    text: Optional[str] = None

class Comment(CommentBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
