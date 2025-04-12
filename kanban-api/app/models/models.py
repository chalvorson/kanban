from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy import Column as SQLAColumn
from sqlalchemy.orm import relationship

from app.database import Base

# Association table for task tags
task_tag = Table(
    "task_tag",
    Base.metadata,
    SQLAColumn("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    SQLAColumn("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class KanbanColumn(Base):
    __tablename__ = "columns"

    id = SQLAColumn(String, primary_key=True, index=True)
    title = SQLAColumn(String, index=True)
    position = SQLAColumn(Integer, default=0)

    # Relationships
    tasks = relationship("Task", back_populates="column")


class Task(Base):
    __tablename__ = "tasks"

    id = SQLAColumn(Integer, primary_key=True, index=True)
    title = SQLAColumn(String, index=True)
    description = SQLAColumn(Text, nullable=True)
    start_date = SQLAColumn(DateTime, nullable=True)
    end_date = SQLAColumn(DateTime, nullable=True)
    status = SQLAColumn(String, ForeignKey("columns.id"))
    priority = SQLAColumn(String, default="medium")
    time_spent = SQLAColumn(Float, default=0)
    is_tracking = SQLAColumn(Boolean, default=False)
    tracking_start_time = SQLAColumn(DateTime, nullable=True)
    created_at = SQLAColumn(DateTime, default=datetime.utcnow)
    updated_at = SQLAColumn(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign keys
    assignee_id = SQLAColumn(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    column = relationship("KanbanColumn", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=task_tag, back_populates="tasks")


class User(Base):
    __tablename__ = "users"

    id = SQLAColumn(Integer, primary_key=True, index=True)
    name = SQLAColumn(String, index=True)
    avatar = SQLAColumn(String, nullable=True)

    # Relationships
    assigned_tasks = relationship("Task", back_populates="assignee")
    comments = relationship("Comment", back_populates="author")


class Comment(Base):
    __tablename__ = "comments"

    id = SQLAColumn(Integer, primary_key=True, index=True)
    text = SQLAColumn(Text)
    timestamp = SQLAColumn(DateTime, default=datetime.utcnow)

    # Foreign keys
    task_id = SQLAColumn(Integer, ForeignKey("tasks.id"))
    author_id = SQLAColumn(Integer, ForeignKey("users.id"))

    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")


class Tag(Base):
    __tablename__ = "tags"

    id = SQLAColumn(Integer, primary_key=True, index=True)
    name = SQLAColumn(String, unique=True, index=True)

    # Relationships
    tasks = relationship("Task", secondary=task_tag, back_populates="tags")
