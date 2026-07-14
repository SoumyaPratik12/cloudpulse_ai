"""AI recommendations endpoints."""
from typing import List, Optional
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


@router.post("/{recommendation_id}/apply")
async def apply_recommendation_endpoint(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply the cost-optimization recommendation in AWS."""
    from aws_integration import get_aws_client, apply_recommendation_action
    from models import AWSCredential

    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.organization_id == current_user.organization_id,
    ).first()

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )

    creds = db.query(AWSCredential).filter(
        AWSCredential.organization_id == current_user.organization_id,
        AWSCredential.is_active == True
    ).first()

    access_key = creds.access_key_id if creds else None
    secret_key = creds.secret_access_key if creds else None

    try:
        client = get_aws_client(access_key_id=access_key, secret_access_key=secret_key)
        action_msg = apply_recommendation_action(db, recommendation_id, client)
        return {"status": "success", "message": action_msg}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute remediation: {str(e)}"
        )
