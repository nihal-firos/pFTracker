from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TransactionType
from app.schemas.common import PaginationMeta


class TransactionCreate(BaseModel):
    category_id: int
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    type: TransactionType
    note: str | None = Field(default=None, max_length=1000)
    date: date


class TransactionUpdate(BaseModel):
    category_id: int
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    type: TransactionType
    note: str | None = Field(default=None, max_length=1000)
    date: date


class TransactionCategory(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: TransactionType
    color: str


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    amount: Decimal
    type: TransactionType
    note: str | None
    date: date
    created_at: datetime
    category: TransactionCategory


class TransactionListResponse(BaseModel):
    items: list[TransactionRead]
    pagination: PaginationMeta