"""AWS resources management endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Resource
from schemas import ResourceResponse
from auth import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/", response_model=List[ResourceResponse])
async def list_resources(
    resource_type: str = Query(None),
    state: str = Query(None),
    region: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List resources for the current organization."""
    query = db.query(Resource).filter(
        Resource.organization_id == current_user.organization_id
    )

    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    if state:
        query = query.filter(Resource.state == state)
    if region:
        query = query.filter(Resource.region == region)

    return query.all()


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get resource details."""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.organization_id == current_user.organization_id,
    ).first()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return resource
