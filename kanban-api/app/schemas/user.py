from pydantic import BaseModel
from typing import List, Optional

class UserBase(BaseModel):
    name: str
    avatar: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True
