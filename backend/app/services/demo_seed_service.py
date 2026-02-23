from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.category import Category
from app.models.enums import TransactionType
from app.models.transaction import Transaction
from app.models.user import User

settings = get_settings()


async def ensure_demo_data(db: AsyncSession) -> None:
    if not settings.demo_mode:
        return

    demo_user = await _get_demo_user(db)
    if demo_user is None:
        demo_user = User(
            name=settings.demo_user_name,
            email=settings.demo_user_email.lower(),
            hashed_password=hash_password(settings.demo_user_password),
        )
        db.add(demo_user)
        await db.flush()

    category_map = await _ensure_demo_categories(db, demo_user.id)
    await _ensure_demo_transactions(db, demo_user.id, category_map)
    await db.commit()


async def _get_demo_user(db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.email == settings.demo_user_email.lower()))
    return result.scalar_one_or_none()


async def _ensure_demo_categories(db: AsyncSession, user_id: int) -> dict[str, Category]:
    category_specs = [
        ("Salary", TransactionType.INCOME, "#17c964"),
        ("Freelance", TransactionType.INCOME, "#06b6d4"),
        ("Rent", TransactionType.EXPENSE, "#f31260"),
        ("Groceries", TransactionType.EXPENSE, "#f59e0b"),
        ("Transport", TransactionType.EXPENSE, "#8b5cf6"),
        ("Utilities", TransactionType.EXPENSE, "#3b82f6"),
    ]

    result = await db.execute(select(Category).where(Category.user_id == user_id))
    existing = {(c.name, c.type): c for c in result.scalars().all()}

    category_map: dict[str, Category] = {}
    for name, kind, color in category_specs:
        category = existing.get((name, kind))
        if category is None:
            category = Category(user_id=user_id, name=name, type=kind, color=color)
            db.add(category)
            await db.flush()
        category_map[name] = category

    return category_map


async def _ensure_demo_transactions(db: AsyncSession, user_id: int, category_map: dict[str, Category]) -> None:
    tx_count = await db.execute(select(func.count()).select_from(Transaction).where(Transaction.user_id == user_id))
    if int(tx_count.scalar_one()) > 0:
        return

    today = date.today()
    base_month = date(today.year, today.month, 1)

    seeded_rows = [
        ("Salary", TransactionType.INCOME, Decimal("4200.00"), "Monthly salary", base_month + timedelta(days=1)),
        ("Freelance", TransactionType.INCOME, Decimal("850.00"), "Landing page project", base_month + timedelta(days=9)),
        ("Rent", TransactionType.EXPENSE, Decimal("1450.00"), "Apartment rent", base_month + timedelta(days=2)),
        ("Groceries", TransactionType.EXPENSE, Decimal("220.40"), "Weekly groceries", base_month + timedelta(days=6)),
        ("Transport", TransactionType.EXPENSE, Decimal("95.30"), "Metro and rides", base_month + timedelta(days=10)),
        ("Utilities", TransactionType.EXPENSE, Decimal("130.00"), "Electricity and internet", base_month + timedelta(days=12)),
        ("Groceries", TransactionType.EXPENSE, Decimal("198.25"), "Supermarket refill", base_month + timedelta(days=16)),
        ("Freelance", TransactionType.INCOME, Decimal("420.00"), "Design revisions", base_month + timedelta(days=19)),
    ]

    created_at = datetime.utcnow()
    for category_name, kind, amount, note, tx_date in seeded_rows:
        category = category_map[category_name]
        db.add(
            Transaction(
                user_id=user_id,
                category_id=category.id,
                amount=amount,
                type=kind,
                note=note,
                date=tx_date,
                created_at=created_at,
            )
        )
