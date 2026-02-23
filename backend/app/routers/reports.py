from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.models.enums import TransactionType
from app.models.user import User
from app.schemas.report import ReportByCategoryResponse, ReportMonthlyResponse, ReportSummaryResponse
from app.services.report_service import get_by_category_report, get_monthly_report, get_summary_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary", response_model=ReportSummaryResponse)
async def summary_report_endpoint(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ReportSummaryResponse:
    return await get_summary_report(db, current_user.id, start_date=start_date, end_date=end_date)


@router.get("/by-category", response_model=ReportByCategoryResponse)
async def by_category_report_endpoint(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    type: TransactionType | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ReportByCategoryResponse:
    return await get_by_category_report(
        db,
        current_user.id,
        start_date=start_date,
        end_date=end_date,
        type_filter=type,
    )


@router.get("/monthly", response_model=ReportMonthlyResponse)
async def monthly_report_endpoint(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ReportMonthlyResponse:
    return await get_monthly_report(db, current_user.id, start_date=start_date, end_date=end_date)