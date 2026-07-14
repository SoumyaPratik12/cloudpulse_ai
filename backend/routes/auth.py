"""Authentication endpoints."""
from typing import Optional, List
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from models import User, Organization
from schemas import TokenRequest, TokenResponse, UserCreate, UserResponse
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if organization exists
    org = db.query(Organization).filter(
        Organization.id == user_data.organization_id
    ).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Create user
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        organization_id=user_data.organization_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: TokenRequest, db: Session = Depends(get_db)):
    """Login and get access token."""
    print(f"Login Attempt: email={repr(credentials.email)}, password_len={len(credentials.password)}")
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        print(f"Login Failure: User with email {repr(credentials.email)} not found in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Verify password
    is_valid = verify_password(credentials.password, user.hashed_password)
    print(f"Login Verification: is_valid={is_valid}")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    # Create tokens
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "organization_id": user.organization_id,
        },
        expires_delta=access_token_expires,
    )
    refresh_token = create_refresh_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "organization_id": user.organization_id,
        }
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str):
    """Refresh access token using refresh token."""
    # TODO: Implement refresh token logic
    pass
