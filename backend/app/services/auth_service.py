from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.core.security import TokenError
from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthTokens, LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.user import UserPublic

settings = get_settings()


async def register_user(db: AsyncSession, payload: RegisterRequest) -> AuthResponse:
    email_normalized = payload.email.lower()
    existing_user = await db.execute(select(User).where(User.email == email_normalized))
    if existing_user.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name.strip(),
        email=email_normalized,
        hashed_password="",
    )
    try:
        user.hashed_password = hash_password(payload.password)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be 72 bytes or fewer")
    db.add(user)
    await db.commit()
    await db.refresh(user)

    tokens = AuthTokens(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
    return AuthResponse(user=UserPublic.model_validate(user), tokens=tokens)


async def login_user(db: AsyncSession, payload: LoginRequest) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    tokens = AuthTokens(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
    return AuthResponse(user=UserPublic.model_validate(user), tokens=tokens)


async def refresh_tokens(db: AsyncSession, payload: RefreshTokenRequest) -> AuthTokens:
    try:
        decoded = decode_token(payload.refresh_token, expected_type="refresh")
        user_id = int(decoded["sub"])
    except (TokenError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    return AuthTokens(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def demo_login_user(db: AsyncSession) -> AuthResponse:
    if not settings.demo_mode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo mode is disabled")

    result = await db.execute(select(User).where(User.email == settings.demo_user_email.lower()))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Demo user is not initialized")

    tokens = AuthTokens(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
    return AuthResponse(user=UserPublic.model_validate(user), tokens=tokens)
