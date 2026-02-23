from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.reports import router as reports_router
from app.routers.transactions import router as transactions_router
from app.services.demo_seed_service import ensure_demo_data

settings = get_settings()
app = FastAPI(title=settings.app_name)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(reports_router)


@app.on_event("startup")
async def seed_demo_data_on_startup() -> None:
    if not settings.demo_mode:
        return
    async with AsyncSessionLocal() as session:
        await ensure_demo_data(session)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
