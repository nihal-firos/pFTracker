from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.schemas.auth import AuthResponse, AuthTokens, LoginRequest, RefreshTokenRequest, RegisterRequest
from app.services.auth_service import demo_login_user, login_user, refresh_tokens, register_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db_session)) -> AuthResponse:
    return await register_user(db, payload)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db_session)) -> AuthResponse:
    return await login_user(db, payload)


@router.post("/refresh", response_model=AuthTokens)
async def refresh(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db_session)) -> AuthTokens:
    return await refresh_tokens(db, payload)


@router.post("/demo", response_model=AuthResponse)
async def demo_login(db: AsyncSession = Depends(get_db_session)) -> AuthResponse:
    return await demo_login_user(db)
