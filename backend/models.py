"""SQLAlchemy models for database entities."""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="users")
    aws_credentials = relationship("AWSCredential", back_populates="user", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="user", cascade="all, delete-orphan")


class Organization(Base):
    """Organization model."""

    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)
    default_aws_region = Column(String(50), default="us-east-1")
    subscription_tier = Column(String(50), default="starter")
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    aws_credentials = relationship("AWSCredential", back_populates="organization", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="organization", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="organization", cascade="all, delete-orphan")


class AWSCredential(Base):
    """AWS credentials storage."""

    __tablename__ = "aws_credentials"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_key_id = Column(String(255), nullable=False)
    secret_access_key = Column(String(255), nullable=False)  # Should be encrypted
    regions = Column(String(1000), default="us-east-1,us-west-2")  # Comma-separated
    is_active = Column(Boolean, default=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="aws_credentials")
    user = relationship("User", back_populates="aws_credentials")


class Resource(Base):
    """AWS Resource model."""

    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    resource_id = Column(String(255), nullable=False)  # AWS resource ID
    resource_type = Column(String(50), nullable=False, index=True)  # ec2, rds, s3, lambda, etc.
    name = Column(String(500), nullable=True)
    region = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False, index=True)  # running, stopped, terminated
    tags = Column(Text, nullable=True)  # JSON string
    metadata = Column(Text, nullable=True)  # JSON string with resource details
    monthly_cost = Column(Float, default=0.0)
    cpu_utilization = Column(Float, nullable=True)
    memory_utilization = Column(Float, nullable=True)
    last_scanned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_org_resource_type", "organization_id", "resource_type"),)

    organization = relationship("Organization", back_populates="resources")
    recommendations = relationship("Recommendation", back_populates="resource", cascade="all, delete-orphan")


class Recommendation(Base):
    """AI-generated recommendations."""

    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    recommendation_type = Column(String(50), nullable=False, index=True)  # cost, performance, security
    priority = Column(String(20), nullable=False, index=True)  # critical, high, medium, low
    estimated_savings = Column(Float, nullable=True)
    estimated_savings_currency = Column(String(10), default="USD")
    status = Column(String(50), default="open", index=True)  # open, accepted, rejected, completed
    implementation_steps = Column(Text, nullable=True)  # JSON array
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_org_status", "organization_id", "status"),)

    organization = relationship("Organization", back_populates="recommendations")
    resource = relationship("Resource", back_populates="recommendations")


class Dashboard(Base):
    """User custom dashboards."""

    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    dashboard_type = Column(String(50), nullable=False)  # executive, devops, finance, custom
    layout = Column(Text, nullable=True)  # JSON layout configuration
    filters = Column(Text, nullable=True)  # JSON filters
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="dashboards")


class AlertRule(Base):
    """Alert rules for notifications."""

    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    condition = Column(Text, nullable=False)  # JSON condition
    threshold = Column(Float, nullable=True)
    alert_type = Column(String(50), nullable=False)  # email, slack, webhook
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
