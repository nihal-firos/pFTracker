from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


class TokenError(Exception):
    pass


def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except ValueError as exc:
        raise ValueError("Password must be 72 bytes or fewer.") from exc


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    return _create_token(subject=subject, expires_delta=expires_delta, token_type="access")


def create_refresh_token(subject: str) -> str:
    expires_delta = timedelta(days=settings.jwt_refresh_token_expire_days)
    return _create_token(subject=subject, expires_delta=expires_delta, token_type="refresh")


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        payload: dict[str, Any] = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise TokenError("Invalid token") from exc

    if expected_type is not None and payload.get("type") != expected_type:
        raise TokenError("Invalid token type")

    if payload.get("sub") is None:
        raise TokenError("Token subject missing")

    return payload


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(UTC)
    expire = now + expires_delta
    payload = {"sub": subject, "type": token_type, "iat": now, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
