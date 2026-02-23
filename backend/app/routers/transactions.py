from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.models.enums import TransactionType
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionListResponse, TransactionRead, TransactionUpdate
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    get_transaction_or_404,
    list_transactions,
    update_transaction,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction_endpoint(
    payload: TransactionCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = await create_transaction(db, current_user.id, payload)
    return TransactionRead.model_validate(transaction)


@router.get("", response_model=TransactionListResponse)
async def list_transactions_endpoint(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    type: TransactionType | None = Query(default=None),
    category_id: int | None = Query(default=None, ge=1),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> TransactionListResponse:
    return await list_transactions(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        type_filter=type,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/{transaction_id}", response_model=TransactionRead)
async def get_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = await get_transaction_or_404(db, current_user.id, transaction_id)
    return TransactionRead.model_validate(transaction)


@router.put("/{transaction_id}", response_model=TransactionRead)
async def update_transaction_endpoint(
    transaction_id: int,
    payload: TransactionUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = await update_transaction(db, current_user.id, transaction_id, payload)
    return TransactionRead.model_validate(transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    await delete_transaction(db, current_user.id, transaction_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)