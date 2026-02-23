from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import TransactionType


class ReportSummaryResponse(BaseModel):
    income: Decimal
    expenses: Decimal
    net: Decimal


class ReportByCategoryItem(BaseModel):
    category_id: int
    category_name: str
    category_color: str
    type: TransactionType
    total: Decimal
    percentage: Decimal


class ReportByCategoryResponse(BaseModel):
    items: list[ReportByCategoryItem]
    total: Decimal


class ReportMonthlyItem(BaseModel):
    month: date
    income: Decimal
    expenses: Decimal
    net: Decimal


class ReportMonthlyResponse(BaseModel):
    items: list[ReportMonthlyItem]