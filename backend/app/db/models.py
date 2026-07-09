from datetime import datetime
from typing import List, Optional
from sqlalchemy import ForeignKey, String, Boolean, Float, DateTime, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    accounts: Mapped[List["AWSAccount"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_sessions: Mapped[List["ChatSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class AWSAccount(Base):
    __tablename__ = "aws_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_name: Mapped[str] = mapped_column(String(100), nullable=False)
    aws_account_id: Mapped[Optional[str]] = mapped_column(String(12), index=True, nullable=True)
    role_arn: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, scanning, error
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="accounts")
    resources: Mapped[List["ResourceInventory"]] = relationship(back_populates="account", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="account", cascade="all, delete-orphan")


class ResourceInventory(Base):
    __tablename__ = "resource_inventory"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("aws_accounts.id", ondelete="CASCADE"), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    resource_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    resource_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)  # ec2, rds, ebs, s3
    region: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)  # running, stopped, available, detached
    configuration: Mapped[dict] = mapped_column(JSON, default=dict)
    health_score: Mapped[float] = mapped_column(Float, default=100.0)
    efficiency_score: Mapped[float] = mapped_column(Float, default=100.0)
    last_scanned: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    account: Mapped["AWSAccount"] = relationship(back_populates="resources")
    metrics: Mapped[List["MetricHistory"]] = relationship(back_populates="resource", cascade="all, delete-orphan")


class MetricHistory(Base):
    __tablename__ = "metric_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey("resource_inventory.id", ondelete="CASCADE"), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)  # CPUUtilization, Cost, etc.
    value: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    # Relationships
    resource: Mapped["ResourceInventory"] = relationship(back_populates="metrics")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("aws_accounts.id", ondelete="CASCADE"), nullable=False)
    resource_id_str: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # critical, warning, info
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, resolved, acknowledged
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    account: Mapped["AWSAccount"] = relationship(back_populates="alerts")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session: Mapped["ChatSession"] = relationship(back_populates="messages")
