from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.models import Tag
from app.schemas.tag import TagCreate, TagUpdate

def get_tag(db: Session, tag_id: int) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.id == tag_id).first()

def get_tag_by_name(db: Session, name: str) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.name == name).first()

def get_tags(db: Session, skip: int = 0, limit: int = 100) -> List[Tag]:
    return db.query(Tag).offset(skip).limit(limit).all()

def create_tag(db: Session, tag: TagCreate) -> Tag:
    # Check if tag already exists
    existing_tag = get_tag_by_name(db, tag.name)
    if existing_tag:
        return existing_tag
    
    # Create new tag
    db_tag = Tag(name=tag.name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def update_tag(db: Session, tag_id: int, tag: TagUpdate) -> Optional[Tag]:
    db_tag = get_tag(db, tag_id)
    if db_tag is None:
        return None
    
    update_data = tag.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tag, key, value)
    
    db.commit()
    db.refresh(db_tag)
    return db_tag

def delete_tag(db: Session, tag_id: int) -> bool:
    db_tag = get_tag(db, tag_id)
    if db_tag is None:
        return False
    
    db.delete(db_tag)
    db.commit()
    return True
