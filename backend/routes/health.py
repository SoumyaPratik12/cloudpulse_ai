"""Health check endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Check database
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        database_status = "healthy"
    except Exception as e:
        database_status = f"unhealthy: {str(e)}"

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        database=database_status,
        redis="pending",  # TODO: Add Redis health check
    )
