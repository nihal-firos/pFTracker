from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TransactionType


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: TransactionType
    color: str = Field(min_length=4, max_length=20)


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: TransactionType
    color: str


class CategoryWithCount(CategoryRead):
    transaction_count: int