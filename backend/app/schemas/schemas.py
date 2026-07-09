from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- AWS Account Schemas ---
class AWSAccountCreate(BaseModel):
    account_name: str
    aws_account_id: Optional[str] = None
    role_arn: Optional[str] = None
    external_id: Optional[str] = None


class AWSAccountOut(BaseModel):
    id: int
    account_name: str
    aws_account_id: Optional[str]
    role_arn: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Resource Schemas ---
class ResourceInventoryOut(BaseModel):
    id: int
    account_id: int
    resource_id: str
    resource_name: Optional[str]
    resource_type: str
    region: str
    state: str
    health_score: float
    efficiency_score: float
    last_scanned: datetime
    configuration: dict

    class Config:
        from_attributes = True


# --- Metric Schemas ---
class MetricHistoryOut(BaseModel):
    id: int
    resource_id: int
    metric_name: str
    value: float
    timestamp: datetime

    class Config:
        from_attributes = True


class MetricHistoryCreate(BaseModel):
    resource_id: int
    metric_name: str
    value: float
    timestamp: datetime


class MetricDataPoint(BaseModel):
    timestamp: datetime
    value: float


class ResourceMetricsOut(BaseModel):
    resource_id: str
    metric_name: str
    data: List[MetricDataPoint]


# --- Alert Schemas ---
class AlertOut(BaseModel):
    id: int
    account_id: int
    resource_id_str: Optional[str]
    severity: str
    message: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Chat Schemas ---
class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    title: str


class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageOut] = []

    class Config:
        from_attributes = True


# --- Dashboard / Analytics Scores ---
class DashboardOverviewOut(BaseModel):
    global_health_score: float
    global_cost_efficiency_score: float
    active_resource_count: int
    active_critical_alerts: int
    potential_monthly_savings: float
    monthly_cost_trend: List[dict]
