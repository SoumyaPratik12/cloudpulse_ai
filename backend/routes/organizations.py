"""Organization management endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Organization, AWSCredential
from schemas import OrganizationResponse, OrganizationCreate, AWSCredentialResponse, AWSCredentialCreate, OrganizationBase
from auth import get_current_user

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationResponse)
async def get_current_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    # Get current user's organization.
):
    """Get current user's organization."""
    org = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


@router.post("/", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
):
    """Create a new organization."""
    # Check if organization name already exists
    existing = db.query(Organization).filter(
        Organization.name == org_data.name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name already exists",
        )

    db_org = Organization(**org_data.dict())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get organization by ID."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    if org.id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this organization",
        )

    return org


@router.get("/credentials", response_model=Optional[AWSCredentialResponse])
async def get_organization_credentials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get active AWS credentials for the current organization."""
    creds = db.query(AWSCredential).filter(
        AWSCredential.organization_id == current_user.organization_id
    ).first()
    return creds


@router.post("/credentials", response_model=AWSCredentialResponse)
async def update_organization_credentials(
    cred_data: AWSCredentialCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update AWS credentials for the organization."""
    from models import AWSCredential
    creds = db.query(AWSCredential).filter(
        AWSCredential.organization_id == current_user.organization_id
    ).first()

    if creds:
        creds.access_key_id = cred_data.access_key_id
        creds.secret_access_key = cred_data.secret_access_key
        creds.regions = cred_data.regions
        creds.last_verified_at = None
    else:
        creds = AWSCredential(
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            access_key_id=cred_data.access_key_id,
            secret_access_key=cred_data.secret_access_key,
            regions=cred_data.regions,
        )
        db.add(creds)

    db.commit()
    db.refresh(creds)
    return creds


@router.put("/me", response_model=OrganizationResponse)
async def update_current_organization(
    org_data: OrganizationBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's organization."""
    org = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    org.name = org_data.name
    org.industry = org_data.industry
    org.website = org_data.website
    org.default_aws_region = org_data.default_aws_region

    db.commit()
    db.refresh(org)
    return org
