from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.task import Task, TaskCreate, TaskUpdate, TaskTimeTrackingUpdate
from app.crud import task as crud

router = APIRouter()

@router.get("/", response_model=List[Task])
def read_tasks(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tasks, optionally filtered by status"""
    tasks = crud.get_tasks(db, status=status, skip=skip, limit=limit)
    return tasks

@router.get("/{task_id}", response_model=Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    return crud.create_task(db=db, task=task)

@router.put("/{task_id}", response_model=Task)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    db_task = crud.update_task(db=db, task_id=task_id, task=task)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    success = crud.delete_task(db=db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@router.put("/{task_id}/time-tracking", response_model=Task)
def update_task_time_tracking(task_id: int, time_tracking: TaskTimeTrackingUpdate, db: Session = Depends(get_db)):
    """Update task time tracking status"""
    db_task = crud.update_task_time_tracking(db=db, task_id=task_id, time_tracking=time_tracking)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.post("/{task_id}/tags/{tag_id}", response_model=Task)
def add_tag_to_task(task_id: int, tag_id: int, db: Session = Depends(get_db)):
    """Add a tag to a task"""
    db_task = crud.add_tag_to_task(db=db, task_id=task_id, tag_id=tag_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task or tag not found")
    return db_task

@router.delete("/{task_id}/tags/{tag_id}", response_model=Task)
def remove_tag_from_task(task_id: int, tag_id: int, db: Session = Depends(get_db)):
    """Remove a tag from a task"""
    db_task = crud.remove_tag_from_task(db=db, task_id=task_id, tag_id=tag_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task or tag not found")
    return db_task
