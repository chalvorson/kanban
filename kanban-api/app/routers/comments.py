from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import comment as crud
from app.database import get_db
from app.schemas.comment import Comment, CommentCreate, CommentUpdate

router = APIRouter()


@router.get("/task/{task_id}", response_model=list[Comment])
def read_comments_by_task(task_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all comments for a specific task"""
    comments = crud.get_comments_by_task(db, task_id=task_id, skip=skip, limit=limit)
    return comments


@router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED)
def create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    """Create a new comment"""
    return crud.create_comment(db=db, comment=comment)


@router.put("/{comment_id}", response_model=Comment)
def update_comment(comment_id: int, comment: CommentUpdate, db: Session = Depends(get_db)):
    """Update a comment"""
    db_comment = crud.update_comment(db=db, comment_id=comment_id, comment=comment)
    if db_comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return db_comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    """Delete a comment"""
    success = crud.delete_comment(db=db, comment_id=comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return None
