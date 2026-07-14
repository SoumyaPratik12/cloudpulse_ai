"""AWS resources management endpoints."""
from typing import List, Optional
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


@router.post("/sync")
async def sync_aws_resources_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger sync with AWS and generate recommendations."""
    from aws_integration import get_aws_client, sync_resources_to_db, generate_recommendations_for_org
    from models import AWSCredential

    creds = db.query(AWSCredential).filter(
        AWSCredential.organization_id == current_user.organization_id,
        AWSCredential.is_active == True
    ).first()

    access_key = creds.access_key_id if creds else None
    secret_key = creds.secret_access_key if creds else None

    try:
        client = get_aws_client(access_key_id=access_key, secret_access_key=secret_key)
        sync_resources_to_db(db, current_user.organization_id, client)
        generate_recommendations_for_org(db, current_user.organization_id)
        return {"status": "success", "message": "Resources synced and recommendations updated."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync with AWS: {str(e)}"
        )
