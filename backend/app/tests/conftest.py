import os
from collections.abc import AsyncGenerator
from datetime import date

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import get_db_session
from app.main import app
from app.models.base import Base
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_pftracker.db"


@pytest_asyncio.fixture(scope="session")
async def engine():
    if os.path.exists("test_pftracker.db"):
        os.remove("test_pftracker.db")

    test_engine = create_async_engine(TEST_DATABASE_URL, future=True)

    @event.listens_for(test_engine.sync_engine, "connect")
    def register_date_trunc(dbapi_connection, _):
        def date_trunc(unit: str, value: str | None) -> str | None:
            if value is None:
                return None
            if unit != "month":
                return value
            parsed = str(value)
            return f"{parsed[:7]}-01"

        dbapi_connection.create_function("date_trunc", 2, date_trunc)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield test_engine

    await test_engine.dispose()
    if os.path.exists("test_pftracker.db"):
        os.remove("test_pftracker.db")


@pytest_asyncio.fixture(scope="session")
async def session_maker(engine):
    return async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture(autouse=True)
async def clean_db(session_maker) -> AsyncGenerator[None, None]:
    async with session_maker() as session:
        await session.execute(delete(Transaction))
        await session.execute(delete(Category))
        await session.execute(delete(User))
        await session.commit()
    yield


@pytest_asyncio.fixture
async def client(session_maker) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
def register_user(client: AsyncClient):
    async def _register_user(*, name: str, email: str, password: str) -> dict:
        response = await client.post(
            "/auth/register",
            json={"name": name, "email": email, "password": password},
        )
        assert response.status_code == 201
        return response.json()

    return _register_user


@pytest_asyncio.fixture
def create_category(client: AsyncClient):
    async def _create_category(
        token: str,
        *,
        name: str,
        kind: str,
        color: str,
    ) -> dict:
        response = await client.post(
            "/categories",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": name, "type": kind, "color": color},
        )
        assert response.status_code == 201
        return response.json()

    return _create_category


@pytest_asyncio.fixture
def create_transaction(client: AsyncClient):
    async def _create_transaction(
        token: str,
        *,
        category_id: int,
        amount: str,
        kind: str,
        tx_date: date,
        note: str | None = None,
    ) -> dict:
        response = await client.post(
            "/transactions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "category_id": category_id,
                "amount": amount,
                "type": kind,
                "date": tx_date.isoformat(),
                "note": note,
            },
        )
        assert response.status_code == 201
        return response.json()

    return _create_transaction
