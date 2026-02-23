from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import Date, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.enums import TransactionType
from app.models.transaction import Transaction
from app.schemas.report import (
    ReportByCategoryItem,
    ReportByCategoryResponse,
    ReportMonthlyItem,
    ReportMonthlyResponse,
    ReportSummaryResponse,
)

ZERO = Decimal("0")


async def get_summary_report(
    db: AsyncSession,
    user_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ReportSummaryResponse:
    _validate_date_range(start_date, end_date)
    filters = _build_filters(user_id, start_date, end_date)

    income_expr = case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=ZERO)
    expense_expr = case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=ZERO)

    stmt = select(
        func.coalesce(func.sum(income_expr), ZERO),
        func.coalesce(func.sum(expense_expr), ZERO),
    ).where(*filters)

    result = await db.execute(stmt)
    income, expenses = result.one()
    net = income - expenses
    return ReportSummaryResponse(income=income, expenses=expenses, net=net)


async def get_by_category_report(
    db: AsyncSession,
    user_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
    type_filter: TransactionType | None = None,
) -> ReportByCategoryResponse:
    _validate_date_range(start_date, end_date)
    filters = _build_filters(user_id, start_date, end_date)
    if type_filter is not None:
        filters.append(Transaction.type == type_filter)

    stmt = (
        select(
            Category.id,
            Category.name,
            Category.color,
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), ZERO).label("total"),
        )
        .join(Category, Category.id == Transaction.category_id)
        .where(*filters)
        .group_by(Category.id, Category.name, Category.color, Transaction.type)
        .order_by(func.sum(Transaction.amount).desc())
    )

    rows = (await db.execute(stmt)).all()
    grand_total = sum((row.total for row in rows), ZERO)

    items: list[ReportByCategoryItem] = []
    for row in rows:
        percentage = (row.total / grand_total * Decimal("100")) if grand_total > 0 else ZERO
        items.append(
            ReportByCategoryItem(
                category_id=row.id,
                category_name=row.name,
                category_color=row.color,
                type=row.type,
                total=row.total,
                percentage=percentage.quantize(Decimal("0.01")),
            )
        )

    return ReportByCategoryResponse(items=items, total=grand_total)


async def get_monthly_report(
    db: AsyncSession,
    user_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ReportMonthlyResponse:
    _validate_date_range(start_date, end_date)
    filters = _build_filters(user_id, start_date, end_date)

    month_col = cast(func.date_trunc("month", Transaction.date), Date)
    income_expr = case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=ZERO)
    expense_expr = case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=ZERO)

    stmt = (
        select(
            month_col.label("month"),
            func.coalesce(func.sum(income_expr), ZERO).label("income"),
            func.coalesce(func.sum(expense_expr), ZERO).label("expenses"),
        )
        .where(*filters)
        .group_by(month_col)
        .order_by(month_col.asc())
    )

    rows = (await db.execute(stmt)).all()
    items = [
        ReportMonthlyItem(month=row.month, income=row.income, expenses=row.expenses, net=row.income - row.expenses)
        for row in rows
    ]
    return ReportMonthlyResponse(items=items)


def _build_filters(user_id: int, start_date: date | None, end_date: date | None) -> list:
    filters: list = [Transaction.user_id == user_id]
    if start_date is not None:
        filters.append(Transaction.date >= start_date)
    if end_date is not None:
        filters.append(Transaction.date <= end_date)
    return filters


def _validate_date_range(start_date: date | None, end_date: date | None) -> None:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date must be before or equal to end_date")