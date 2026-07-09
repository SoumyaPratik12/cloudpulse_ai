"""Dashboard endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Resource, Recommendation
from auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/executive")
async def executive_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get executive dashboard data."""
    org_id = current_user.organization_id

    # Get health score (placeholder)
    health_score = 85  # TODO: Calculate from metrics

    # Get total monthly cost
    total_cost = db.query(func.sum(Resource.monthly_cost)).filter(
        Resource.organization_id == org_id
    ).scalar() or 0.0

    # Get active incidents
    active_incidents = db.query(func.count(Recommendation.id)).filter(
        Recommendation.organization_id == org_id,
        Recommendation.status == "open",
        Recommendation.priority.in_(["critical", "high"]),
    ).scalar() or 0

    # Get top recommendations
    top_recommendations = (
        db.query(Recommendation)
        .filter(
            Recommendation.organization_id == org_id,
            Recommendation.status == "open",
        )
        .order_by(Recommendation.priority, Recommendation.estimated_savings.desc())
        .limit(5)
        .all()
    )

    # Get resource count by type
    resources_by_type = (
        db.query(Resource.resource_type, func.count(Resource.id))
        .filter(Resource.organization_id == org_id)
        .group_by(Resource.resource_type)
        .all()
    )

    return {
        "health_score": health_score,
        "monthly_cost": float(total_cost),
        "active_incidents": active_incidents,
        "recommendations": [
            {
                "id": r.id,
                "title": r.title,
                "estimated_savings": r.estimated_savings,
                "priority": r.priority,
            }
            for r in top_recommendations
        ],
        "resources_by_type": {rt: count for rt, count in resources_by_type},
    }


@router.get("/devops")
async def devops_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get DevOps dashboard data."""
    org_id = current_user.organization_id

    # Get resources by state
    resources_by_state = (
        db.query(Resource.state, func.count(Resource.id))
        .filter(Resource.organization_id == org_id)
        .group_by(Resource.state)
        .all()
    )

    # Get high utilization resources
    high_utilization = db.query(Resource).filter(
        Resource.organization_id == org_id,
        Resource.cpu_utilization.isnot(None),
    ).all()

    return {
        "resources_by_state": {state: count for state, count in resources_by_state},
        "high_utilization_count": len(
            [r for r in high_utilization if r.cpu_utilization and r.cpu_utilization > 80]
        ),
    }


@router.get("/finance")
async def finance_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get Finance dashboard data."""
    org_id = current_user.organization_id

    # Get total cost and breakdown
    total_cost = db.query(func.sum(Resource.monthly_cost)).filter(
        Resource.organization_id == org_id
    ).scalar() or 0.0

    # Cost by service
    cost_by_service = (
        db.query(Resource.resource_type, func.sum(Resource.monthly_cost))
        .filter(Resource.organization_id == org_id)
        .group_by(Resource.resource_type)
        .all()
    )

    # Potential savings
    potential_savings = (
        db.query(func.sum(Recommendation.estimated_savings))
        .filter(
            Recommendation.organization_id == org_id,
            Recommendation.status == "open",
            Recommendation.recommendation_type == "cost",
        )
        .scalar()
        or 0.0
    )

    return {
        "total_monthly_cost": float(total_cost),
        "cost_by_service": {
            service: float(cost) for service, cost in cost_by_service
        },
        "potential_savings": float(potential_savings),
    }
