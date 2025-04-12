from pydantic import BaseModel


class ColumnBase(BaseModel):
    title: str
    position: int | None = 0


class ColumnCreate(ColumnBase):
    id: str


class ColumnUpdate(BaseModel):
    title: str | None = None
    position: int | None = None


class Column(ColumnBase):
    id: str
    task_ids: list[int] = []

    class Config:
        orm_mode = True
        from_attributes = True
