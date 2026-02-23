from datetime import date
from decimal import Decimal

import pytest


def to_decimal(value: str | float | int) -> Decimal:
    return Decimal(str(value))


@pytest.mark.asyncio
async def test_auth_register_login_refresh_and_duplicate(client):
    payload = {"name": "Alice", "email": "alice@example.com", "password": "StrongPass123"}

    register_response = await client.post("/auth/register", json=payload)
    assert register_response.status_code == 201
    register_data = register_response.json()
    assert register_data["user"]["email"] == payload["email"]
    assert "hashed_password" not in register_data["user"]

    duplicate_response = await client.post("/auth/register", json=payload)
    assert duplicate_response.status_code == 409

    login_response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["tokens"]["access_token"]
    assert login_data["tokens"]["refresh_token"]

    wrong_password_response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": "WrongPass123"},
    )
    assert wrong_password_response.status_code == 401

    refresh_response = await client.post(
        "/auth/refresh",
        json={"refresh_token": login_data["tokens"]["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]


@pytest.mark.asyncio
async def test_protected_route_requires_auth(client):
    response = await client.get("/categories")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_categories_crud_user_isolation_and_transaction_count(client, register_user, create_category, create_transaction):
    user_a = await register_user(name="A", email="a@example.com", password="Password123")
    user_b = await register_user(name="B", email="b@example.com", password="Password123")

    token_a = user_a["tokens"]["access_token"]
    token_b = user_b["tokens"]["access_token"]

    groceries = await create_category(token_a, name="Groceries", kind="expense", color="#f31260")
    salary = await create_category(token_a, name="Salary", kind="income", color="#17c964")

    _ = await create_transaction(
        token_a,
        category_id=groceries["id"],
        amount="45.25",
        kind="expense",
        tx_date=date(2026, 1, 10),
        note="Weekly groceries",
    )

    list_a = await client.get("/categories", headers={"Authorization": f"Bearer {token_a}"})
    assert list_a.status_code == 200
    categories_a = list_a.json()
    assert len(categories_a) == 2
    groceries_item = next(item for item in categories_a if item["id"] == groceries["id"])
    assert groceries_item["transaction_count"] == 1

    list_b = await client.get("/categories", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    assert list_b.json() == []

    forbidden_delete = await client.delete(
        f"/categories/{salary['id']}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert forbidden_delete.status_code == 404

    conflict_delete = await client.delete(
        f"/categories/{groceries['id']}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert conflict_delete.status_code == 409


@pytest.mark.asyncio
async def test_transactions_crud_filters_validation_and_isolation(client, register_user, create_category, create_transaction):
    user = await register_user(name="T", email="tx@example.com", password="Password123")
    other = await register_user(name="O", email="other@example.com", password="Password123")

    token = user["tokens"]["access_token"]
    other_token = other["tokens"]["access_token"]

    expense_category = await create_category(token, name="Food", kind="expense", color="#f31260")
    income_category = await create_category(token, name="Paycheck", kind="income", color="#17c964")

    mismatch = await client.post(
        "/transactions",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "category_id": expense_category["id"],
            "amount": "120.00",
            "type": "income",
            "date": "2026-01-12",
            "note": "Invalid",
        },
    )
    assert mismatch.status_code == 400

    tx_a = await create_transaction(
        token,
        category_id=expense_category["id"],
        amount="12.50",
        kind="expense",
        tx_date=date(2026, 1, 15),
    )
    tx_b = await create_transaction(
        token,
        category_id=income_category["id"],
        amount="500.00",
        kind="income",
        tx_date=date(2026, 2, 1),
    )

    list_expense = await client.get(
        "/transactions?type=expense&page=1&page_size=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_expense.status_code == 200
    data_expense = list_expense.json()
    assert data_expense["pagination"]["total"] == 1
    assert data_expense["items"][0]["id"] == tx_a["id"]

    invalid_date_range = await client.get(
        "/transactions?start_date=2026-03-01&end_date=2026-01-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid_date_range.status_code == 400

    detail = await client.get(f"/transactions/{tx_a['id']}", headers={"Authorization": f"Bearer {token}"})
    assert detail.status_code == 200
    assert detail.json()["category"]["name"] == "Food"

    other_user_detail = await client.get(
        f"/transactions/{tx_a['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert other_user_detail.status_code == 404

    update_response = await client.put(
        f"/transactions/{tx_a['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "category_id": expense_category["id"],
            "amount": "19.99",
            "type": "expense",
            "date": "2026-01-16",
            "note": "Updated",
        },
    )
    assert update_response.status_code == 200
    assert to_decimal(update_response.json()["amount"]) == Decimal("19.99")

    delete_response = await client.delete(f"/transactions/{tx_b['id']}", headers={"Authorization": f"Bearer {token}"})
    assert delete_response.status_code == 204

    deleted_lookup = await client.get(f"/transactions/{tx_b['id']}", headers={"Authorization": f"Bearer {token}"})
    assert deleted_lookup.status_code == 404


@pytest.mark.asyncio
async def test_reports_summary_by_category_and_monthly(client, register_user, create_category, create_transaction):
    auth = await register_user(name="R", email="report@example.com", password="Password123")
    token = auth["tokens"]["access_token"]

    salary = await create_category(token, name="Salary", kind="income", color="#17c964")
    rent = await create_category(token, name="Rent", kind="expense", color="#f31260")

    await create_transaction(
        token,
        category_id=salary["id"],
        amount="2000.00",
        kind="income",
        tx_date=date(2026, 1, 5),
    )
    await create_transaction(
        token,
        category_id=rent["id"],
        amount="800.00",
        kind="expense",
        tx_date=date(2026, 1, 7),
    )
    await create_transaction(
        token,
        category_id=rent["id"],
        amount="850.00",
        kind="expense",
        tx_date=date(2026, 2, 7),
    )

    summary_response = await client.get("/reports/summary", headers={"Authorization": f"Bearer {token}"})
    assert summary_response.status_code == 200
    summary = summary_response.json()
    assert to_decimal(summary["income"]) == Decimal("2000.00")
    assert to_decimal(summary["expenses"]) == Decimal("1650.00")
    assert to_decimal(summary["net"]) == Decimal("350.00")

    by_category_response = await client.get(
        "/reports/by-category?type=expense",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert by_category_response.status_code == 200
    by_category = by_category_response.json()
    assert len(by_category["items"]) == 1
    assert by_category["items"][0]["category_name"] == "Rent"
    assert to_decimal(by_category["items"][0]["total"]) == Decimal("1650.00")

    monthly_response = await client.get("/reports/monthly", headers={"Authorization": f"Bearer {token}"})
    assert monthly_response.status_code == 200
    monthly_items = monthly_response.json()["items"]
    assert len(monthly_items) == 2
    assert monthly_items[0]["month"].startswith("2026-01")
    assert monthly_items[1]["month"].startswith("2026-02")

    invalid_range_response = await client.get(
        "/reports/summary?start_date=2026-12-01&end_date=2026-01-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid_range_response.status_code == 400
