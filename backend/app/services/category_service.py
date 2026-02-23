from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category import CategoryCreate, CategoryWithCount


async def create_category(db: AsyncSession, user_id: int, payload: CategoryCreate) -> Category:
    category = Category(
        user_id=user_id,
        name=payload.name.strip(),
        type=payload.type,
        color=payload.color.strip(),
    )
    db.add(category)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists") from exc

    await db.refresh(category)
    return category


async def list_categories(db: AsyncSession, user_id: int) -> list[CategoryWithCount]:
    stmt = (
        select(Category, func.count(Transaction.id).label("transaction_count"))
        .outerjoin(Transaction, and_(Transaction.category_id == Category.id, Transaction.user_id == user_id))
        .where(Category.user_id == user_id)
        .group_by(Category.id)
        .order_by(Category.type.asc(), Category.name.asc())
    )
    result = await db.execute(stmt)

    categories: list[CategoryWithCount] = []
    for category, transaction_count in result.all():
        categories.append(
            CategoryWithCount(
                id=category.id,
                name=category.name,
                type=category.type,
                color=category.color,
                transaction_count=transaction_count,
            )
        )
    return categories


async def delete_category(db: AsyncSession, user_id: int, category_id: int) -> None:
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    await db.delete(category)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete category with existing transactions",
        ) from exc
