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


def seed_mock_resources_to_db(db: Session, organization_id: int):
    from models import Resource
    from datetime import datetime

    mock_resources = [
        {
            "resource_id": "i-0abcd1234efgh5678",
            "resource_type": "ec2",
            "name": "cloudpulse-web-server-01",
            "region": "ap-south-1",
            "state": "running",
            "monthly_cost": 7.6,
            "cpu_utilization": 12.4,
            "tags": '{"Name": "cloudpulse-web-server-01"}'
        },
        {
            "resource_id": "i-09876fedcba543210",
            "resource_type": "ec2",
            "name": "cloudpulse-worker-node-02",
            "region": "ap-south-1",
            "state": "running",
            "monthly_cost": 15.2,
            "cpu_utilization": 65.1,
            "tags": '{"Name": "cloudpulse-worker-node-02"}'
        },
        {
            "resource_id": "i-044111222333444aa",
            "resource_type": "ec2",
            "name": "cloudpulse-staging-node",
            "region": "ap-south-1",
            "state": "stopped",
            "monthly_cost": 7.6,
            "cpu_utilization": 0.0,
            "tags": '{"Name": "cloudpulse-staging-node"}'
        },
        {
            "resource_id": "cloudpulse-static-assets-prod",
            "resource_type": "s3",
            "name": "cloudpulse-static-assets-prod",
            "region": "ap-south-1",
            "state": "active",
            "monthly_cost": 32.99,
            "tags": '{}'
        },
        {
            "resource_id": "cloudpulse-db-backups-archive",
            "resource_type": "s3",
            "name": "cloudpulse-db-backups-archive",
            "region": "ap-south-1",
            "state": "active",
            "monthly_cost": 285.50,
            "tags": '{}'
        },
        {
            "resource_id": "db-rds-master-01",
            "resource_type": "rds",
            "name": "rds-master-01",
            "region": "ap-south-1",
            "state": "available",
            "monthly_cost": 48.0,
            "cpu_utilization": 8.5,
            "tags": '{}'
        },
        {
            "resource_id": "vpc-0c83a54b67fd",
            "resource_type": "vpc",
            "name": "cloudpulse-primary-vpc",
            "region": "ap-south-1",
            "state": "available",
            "monthly_cost": 0.0,
            "tags": '{"Name": "cloudpulse-primary-vpc"}'
        }
    ]

    for item in mock_resources:
        resource = db.query(Resource).filter(
            Resource.organization_id == organization_id,
            Resource.resource_id == item["resource_id"]
        ).first()

        if resource:
            resource.state = item["state"]
            if "cpu_utilization" in item:
                resource.cpu_utilization = item["cpu_utilization"]
            resource.last_scanned_at = datetime.utcnow()
        else:
            resource = Resource(
                organization_id=organization_id,
                resource_id=item["resource_id"],
                resource_type=item["resource_type"],
                name=item["name"],
                region=item["region"],
                state=item["state"],
                monthly_cost=item["monthly_cost"],
                cpu_utilization=item.get("cpu_utilization"),
                tags=item["tags"],
                last_scanned_at=datetime.utcnow()
            )
            db.add(resource)
    db.commit()


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

    # Fallback to Mock Seeding if credentials are not configured or set to placeholder/default values
    if not access_key or access_key == "your-aws-key":
        try:
            seed_mock_resources_to_db(db, current_user.organization_id)
            generate_recommendations_for_org(db, current_user.organization_id)
            return {"status": "success", "message": "No AWS credentials found. Seeding mock resources and recommendations."}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to seed mock resources: {str(e)}"
            )

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
