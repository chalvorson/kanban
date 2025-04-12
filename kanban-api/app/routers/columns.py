from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import column as crud
from app.database import get_db
from app.schemas.column import Column, ColumnCreate, ColumnUpdate

router = APIRouter()


@router.get("/", response_model=list[Column])
def read_columns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all columns"""
    columns = crud.get_columns(db, skip=skip, limit=limit)

    # Convert to response model with task_ids
    response_columns = []
    for col in columns:
        task_ids = [task.id for task in col.tasks]
        response_columns.append(Column(id=col.id, title=col.title, position=col.position, task_ids=task_ids))

    return response_columns


@router.get("/{column_id}", response_model=Column)
def read_column(column_id: str, db: Session = Depends(get_db)):
    """Get a specific column by ID"""
    db_column = crud.get_column(db, column_id=column_id)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    # Convert to response model with task_ids
    task_ids = [task.id for task in db_column.tasks]
    return Column(id=db_column.id, title=db_column.title, position=db_column.position, task_ids=task_ids)


@router.post("/", response_model=Column, status_code=status.HTTP_201_CREATED)
def create_column(column: ColumnCreate, db: Session = Depends(get_db)):
    """Create a new column"""
    # Check if column with this ID already exists
    db_column = crud.get_column(db, column_id=column.id)
    if db_column:
        raise HTTPException(status_code=400, detail="Column with this ID already exists")

    db_column = crud.create_column(db=db, column=column)
    return Column(id=db_column.id, title=db_column.title, position=db_column.position, task_ids=[])


@router.put("/{column_id}", response_model=Column)
def update_column(column_id: str, column: ColumnUpdate, db: Session = Depends(get_db)):
    """Update a column"""
    db_column = crud.update_column(db=db, column_id=column_id, column=column)
    if db_column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    # Convert to response model with task_ids
    task_ids = [task.id for task in db_column.tasks]
    return Column(id=db_column.id, title=db_column.title, position=db_column.position, task_ids=task_ids)


@router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(column_id: str, db: Session = Depends(get_db)):
    """Delete a column"""
    success = crud.delete_column(db=db, column_id=column_id)
    if not success:
        raise HTTPException(status_code=404, detail="Column not found")
    return None
