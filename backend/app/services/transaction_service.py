import math
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.enums import TransactionType
from app.models.transaction import Transaction
from app.schemas.common import PaginationMeta
from app.schemas.transaction import TransactionCreate, TransactionListResponse, TransactionRead, TransactionUpdate


async def create_transaction(db: AsyncSession, user_id: int, payload: TransactionCreate) -> Transaction:
    category = await _get_user_category(db, user_id, payload.category_id)
    _validate_transaction_type(category.type, payload.type)

    transaction = Transaction(
        user_id=user_id,
        category_id=payload.category_id,
        amount=payload.amount,
        type=payload.type,
        note=payload.note.strip() if payload.note else None,
        date=payload.date,
    )

    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return await get_transaction_or_404(db, user_id, transaction.id)


async def list_transactions(
    db: AsyncSession,
    user_id: int,
    page: int,
    page_size: int,
    type_filter: TransactionType | None = None,
    category_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> TransactionListResponse:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date must be before or equal to end_date")

    filters = _build_filters(
        user_id=user_id,
        type_filter=type_filter,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
    )

    total_stmt = select(func.count()).select_from(Transaction).where(*filters)
    total = int((await db.execute(total_stmt)).scalar_one())

    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(*filters)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    transactions = (await db.execute(stmt)).scalars().all()

    items = [TransactionRead.model_validate(tx) for tx in transactions]
    pagination = PaginationMeta(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=math.ceil(total / page_size) if total else 0,
    )
    return TransactionListResponse(items=items, pagination=pagination)


async def get_transaction_or_404(db: AsyncSession, user_id: int, transaction_id: int) -> Transaction:
    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    )
    result = await db.execute(stmt)
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


async def update_transaction(
    db: AsyncSession,
    user_id: int,
    transaction_id: int,
    payload: TransactionUpdate,
) -> Transaction:
    transaction = await get_transaction_or_404(db, user_id, transaction_id)
    category = await _get_user_category(db, user_id, payload.category_id)
    _validate_transaction_type(category.type, payload.type)

    transaction.category_id = payload.category_id
    transaction.amount = payload.amount
    transaction.type = payload.type
    transaction.note = payload.note.strip() if payload.note else None
    transaction.date = payload.date

    await db.commit()
    await db.refresh(transaction)
    return await get_transaction_or_404(db, user_id, transaction.id)


async def delete_transaction(db: AsyncSession, user_id: int, transaction_id: int) -> None:
    transaction = await get_transaction_or_404(db, user_id, transaction_id)
    await db.delete(transaction)
    await db.commit()


async def _get_user_category(db: AsyncSession, user_id: int, category_id: int) -> Category:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def _validate_transaction_type(category_type: TransactionType, transaction_type: TransactionType) -> None:
    if category_type != transaction_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction type must match the selected category type",
        )


def _build_filters(
    user_id: int,
    type_filter: TransactionType | None,
    category_id: int | None,
    start_date: date | None,
    end_date: date | None,
) -> list:
    filters: list = [Transaction.user_id == user_id]
    if type_filter is not None:
        filters.append(Transaction.type == type_filter)
    if category_id is not None:
        filters.append(Transaction.category_id == category_id)
    if start_date is not None:
        filters.append(Transaction.date >= start_date)
    if end_date is not None:
        filters.append(Transaction.date <= end_date)
    return filters
