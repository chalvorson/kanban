from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.models import Task, Tag
from app.schemas.task import TaskCreate, TaskUpdate, TaskTimeTrackingUpdate

def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()

def get_tasks(db: Session, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    return query.offset(skip).limit(limit).all()

def create_task(db: Session, task: TaskCreate) -> Task:
    db_task = Task(
        title=task.title,
        description=task.description,
        start_date=task.start_date,
        end_date=task.end_date,
        status=task.status,
        priority=task.priority,
        assignee_id=task.assignee_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task: TaskUpdate) -> Optional[Task]:
    db_task = get_task(db, task_id)
    if db_task is None:
        return None
    
    update_data = task.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if db_task is None:
        return False
    
    db.delete(db_task)
    db.commit()
    return True

def update_task_time_tracking(db: Session, task_id: int, time_tracking: TaskTimeTrackingUpdate) -> Optional[Task]:
    db_task = get_task(db, task_id)
    if db_task is None:
        return None
    
    # If stopping time tracking, calculate time spent
    if db_task.is_tracking and not time_tracking.is_tracking:
        if db_task.tracking_start_time:
            time_diff = datetime.utcnow() - db_task.tracking_start_time
            db_task.time_spent += time_diff.total_seconds()
    
    db_task.is_tracking = time_tracking.is_tracking
    db_task.tracking_start_time = time_tracking.tracking_start_time
    db_task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_task)
    return db_task

def add_tag_to_task(db: Session, task_id: int, tag_id: int) -> Optional[Task]:
    db_task = get_task(db, task_id)
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if db_task is None or db_tag is None:
        return None
    
    db_task.tags.append(db_tag)
    db_task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_task)
    return db_task

def remove_tag_from_task(db: Session, task_id: int, tag_id: int) -> Optional[Task]:
    db_task = get_task(db, task_id)
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    
    if db_task is None or db_tag is None:
        return None
    
    if db_tag in db_task.tags:
        db_task.tags.remove(db_tag)
        db_task.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_task)
    
    return db_task
