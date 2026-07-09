"""AI recommendations endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Recommendation
from schemas import RecommendationResponse
from auth import get_current_user

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/", response_model=List[RecommendationResponse])
async def list_recommendations(
    recommendation_type: str = Query(None),
    priority: str = Query(None),
    status: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List recommendations for the current organization."""
    query = db.query(Recommendation).filter(
        Recommendation.organization_id == current_user.organization_id
    )

    if recommendation_type:
        query = query.filter(Recommendation.recommendation_type == recommendation_type)
    if priority:
        query = query.filter(Recommendation.priority == priority)
    if status:
        query = query.filter(Recommendation.status == status)

    return query.order_by(Recommendation.created_at.desc()).all()


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recommendation details."""
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.organization_id == current_user.organization_id,
    ).first()

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )

    return recommendation
