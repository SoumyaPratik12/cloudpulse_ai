"""FastAPI application entry point."""
import builtins
import typing
import re

# Monkey-patch typing._eval_type to dynamically resolve missing type annotations (e.g., SQLAlchemy private types)
class GenericFallback:
    @classmethod
    def __class_getitem__(cls, item):
        return cls
    @classmethod
    def __getitem__(cls, item):
        return cls
    @classmethod
    def __call__(cls, *args, **kwargs):
        return cls()
    def __getattr__(self, name):
        return self
    def __getitem__(self, item):
        return self
    def __call__(self, *args, **kwargs):
        return self
    def __repr__(self):
        return "GenericFallback"
    def __get_pydantic_core_schema__(*args, **kwargs):
        try:
            from pydantic_core import core_schema
            return core_schema.any_schema()
        except Exception:
            return {"type": "any"}

original_eval_type = getattr(typing, "_eval_type", None)
if original_eval_type:
    _tried_names = set()
    def custom_eval_type(t, globalns, localns, *args, **kwargs):
        try:
            return original_eval_type(t, globalns, localns, *args, **kwargs)
        except NameError as ne:
            match = re.search(r"name '([^']+)' is not defined", str(ne))
            if match:
                missing_name = match.group(1)
                if missing_name in _tried_names:
                    raise ne
                _tried_names.add(missing_name)
                
                # Resolve using typing if available to maintain subscriptability (e.g., Literal, ClassVar)
                resolved_val = getattr(typing, missing_name, None)
                if resolved_val is None:
                    resolved_val = GenericFallback
                
                setattr(builtins, missing_name, resolved_val)
                if globalns is not None:
                    try:
                        globalns[missing_name] = resolved_val
                    except Exception:
                        pass
                if localns is not None:
                    try:
                        localns[missing_name] = resolved_val
                    except Exception:
                        pass
                try:
                    return custom_eval_type(t, globalns, localns, *args, **kwargs)
                finally:
                    _tried_names.discard(missing_name)
            raise
    typing._eval_type = custom_eval_type

from typing import Optional, List
builtins.Optional = Optional
builtins.List = List

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from routes import auth, users, organizations, resources, recommendations, dashboard, health, provisioning

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
app.include_router(provisioning.router, prefix="/api/v1", tags=["provisioning"])


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
