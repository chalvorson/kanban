from sqlalchemy.orm import Session

from app.models.models import KanbanColumn
from app.schemas.column import ColumnCreate, ColumnUpdate


def get_column(db: Session, column_id: str) -> KanbanColumn | None:
    return db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()

def get_columns(db: Session, skip: int = 0, limit: int = 100) -> list[KanbanColumn]:
    return db.query(KanbanColumn).order_by(KanbanColumn.position).offset(skip).limit(limit).all()

def create_column(db: Session, column: ColumnCreate) -> KanbanColumn:
    db_column = KanbanColumn(id=column.id, title=column.title, position=column.position)
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column

def update_column(db: Session, column_id: str, column: ColumnUpdate) -> KanbanColumn | None:
    db_column = get_column(db, column_id)
    if db_column is None:
        return None
    
    update_data = column.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_column, key, value)
    
    db.commit()
    db.refresh(db_column)
    return db_column

def delete_column(db: Session, column_id: str) -> bool:
    db_column = get_column(db, column_id)
    if db_column is None:
        return False
    
    db.delete(db_column)
    db.commit()
    return True
