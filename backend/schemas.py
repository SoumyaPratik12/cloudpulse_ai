"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    organization_id: int


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    organization_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Organization Schemas
class OrganizationBase(BaseModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    default_aws_region: str = "us-east-1"


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: int
    subscription_tier: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# AWS Credential Schemas
class AWSCredentialBase(BaseModel):
    access_key_id: str
    secret_access_key: str
    regions: str = "us-east-1,us-west-2"


class AWSCredentialCreate(AWSCredentialBase):
    pass


class AWSCredentialResponse(BaseModel):
    id: int
    organization_id: int
    regions: str
    is_active: bool
    last_verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Resource Schemas
class ResourceBase(BaseModel):
    resource_id: str
    resource_type: str
    name: Optional[str] = None
    region: str
    state: str


class ResourceResponse(ResourceBase):
    id: int
    organization_id: int
    monthly_cost: float
    cpu_utilization: Optional[float] = None
    memory_utilization: Optional[float] = None
    last_scanned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Recommendation Schemas
class RecommendationBase(BaseModel):
    title: str
    description: str
    recommendation_type: str  # cost, performance, security
    priority: str  # critical, high, medium, low
    estimated_savings: Optional[float] = None


class RecommendationResponse(RecommendationBase):
    id: int
    organization_id: int
    resource_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Authentication Schemas
class TokenRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    organization_id: Optional[int] = None


# Dashboard Schemas
class DashboardCreate(BaseModel):
    name: str
    dashboard_type: str  # executive, devops, finance, custom
    layout: Optional[str] = None
    filters: Optional[str] = None


class DashboardResponse(DashboardCreate):
    id: int
    user_id: int
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Health/Status Schemas
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    redis: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
