from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead, CategoryWithCount
from app.services.category_service import create_category, delete_category, list_categories

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category_endpoint(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> CategoryRead:
    category = await create_category(db, current_user.id, payload)
    return CategoryRead.model_validate(category)


@router.get("", response_model=list[CategoryWithCount])
async def list_categories_endpoint(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[CategoryWithCount]:
    return await list_categories(db, current_user.id)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_category_endpoint(
    category_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    await delete_category(db, current_user.id, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)