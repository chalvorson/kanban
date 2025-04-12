from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.models import Comment
from app.schemas.comment import CommentCreate, CommentUpdate

def get_comment(db: Session, comment_id: int) -> Optional[Comment]:
    return db.query(Comment).filter(Comment.id == comment_id).first()

def get_comments_by_task(db: Session, task_id: int, skip: int = 0, limit: int = 100) -> List[Comment]:
    return db.query(Comment).filter(Comment.task_id == task_id).offset(skip).limit(limit).all()

def create_comment(db: Session, comment: CommentCreate) -> Comment:
    db_comment = Comment(
        text=comment.text,
        task_id=comment.task_id,
        author_id=comment.author_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def update_comment(db: Session, comment_id: int, comment: CommentUpdate) -> Optional[Comment]:
    db_comment = get_comment(db, comment_id)
    if db_comment is None:
        return None
    
    update_data = comment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_comment, key, value)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

def delete_comment(db: Session, comment_id: int) -> bool:
    db_comment = get_comment(db, comment_id)
    if db_comment is None:
        return False
    
    db.delete(db_comment)
    db.commit()
    return True
