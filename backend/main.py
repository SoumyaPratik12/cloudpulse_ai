"""FastAPI application entry point."""
import builtins
import typing
from typing import Optional, List
builtins.Optional = Optional
builtins.List = List
builtins._SessionBind = typing.Any
builtins._SessionBindKey = typing.Any

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from routes import auth, users, organizations, resources, recommendations, dashboard, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    init_db()
    yield
    # Shutdown
    logger.info("Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered AWS Infrastructure Health Intelligence Platform",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(organizations.router, prefix="/api/v1", tags=["organizations"])
app.include_router(resources.router, prefix="/api/v1", tags=["resources"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["recommendations"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app_name,
        port=settings.server_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
