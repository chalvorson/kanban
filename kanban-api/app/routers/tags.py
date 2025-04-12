from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import tag as crud
from app.database import get_db
from app.schemas.tag import Tag, TagCreate, TagUpdate

router = APIRouter()

# Create a dependency that doesn't use Depends in the default argument
db_dependency = Depends(get_db)


@router.get("/", response_model=List[Tag])
def read_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tags"""
    tags = crud.get_tags(db, skip=skip, limit=limit)
    return tags


@router.get("/{tag_id}", response_model=Tag)
def read_tag(tag_id: int, db: Session = Depends(get_db)):
    """Get a specific tag by ID"""
    db_tag = crud.get_tag(db, tag_id=tag_id)
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return db_tag


@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    """Create a new tag"""
    return crud.create_tag(db=db, tag=tag)


@router.put("/{tag_id}", response_model=Tag)
def update_tag(tag_id: int, tag: TagUpdate, db: Session = Depends(get_db)):
    """Update a tag"""
    db_tag = crud.update_tag(db=db, tag_id=tag_id, tag=tag)
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return db_tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    """Delete a tag"""
    success = crud.delete_tag(db=db, tag_id=tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return None
