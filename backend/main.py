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
from routes import auth, users, organizations, resources, recommendations, dashboard, health, provisioning, api_v2, webhooks

logger = logging.getLogger(__name__)


import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from database import SessionLocal, init_db
from websocket_manager import manager

async def eventbridge_simulator_loop():
    """Simulates near-real-time AWS Config and EventBridge notification events."""
    logger.info("EventBridge / AWS Config Simulator Loop Started")
    while True:
        try:
            await asyncio.sleep(2.5)
            db = SessionLocal()
            try:
                from models import Resource
                from datetime import datetime
                
                # Check for resources in provisioning state
                provisioning_res = db.query(Resource).filter(Resource.state == "provisioning").all()
                if provisioning_res:
                    updated_resources = []
                    for r in provisioning_res:
                        # Auto-transition after a few seconds
                        r.state = "running" if r.resource_type in ["ec2", "ecs", "lambda"] else "active" if r.resource_type == "s3" else "available"
                        r.cpu_utilization = 18.2 if r.resource_type in ["ec2", "ecs"] else None
                        r.last_scanned_at = datetime.utcnow()
                        db.add(r)
                        updated_resources.append({
                            "resource_id": r.resource_id,
                            "resource_type": r.resource_type,
                            "name": r.name,
                            "state": r.state,
                            "cpu": r.cpu_utilization,
                            "cost": r.monthly_cost
                        })
                    db.commit()
                    
                    if updated_resources:
                        logger.info(f"EventBridge: Broadcasted configuration changes for {len(updated_resources)} resources.")
                        await manager.broadcast({
                            "event": "AWS_CONFIG_RESOURCE_CHANGE",
                            "timestamp": datetime.utcnow().isoformat(),
                            "resources": updated_resources
                        })
            except Exception as e:
                logger.error(f"EventBridge simulator database error: {e}")
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("EventBridge simulator loop cancelled")
            break
        except Exception as e:
            logger.error(f"EventBridge simulator unexpected error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    init_db()
    
    # Start EventBridge simulator background task
    simulator_task = asyncio.create_task(eventbridge_simulator_loop())
    yield
    # Shutdown
    logger.info("Shutting down application")
    simulator_task.cancel()
    await asyncio.gather(simulator_task, return_exceptions=True)


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
app.include_router(api_v2.router, prefix="/api/v1", tags=["api_v2"])
app.include_router(webhooks.router, prefix="/api/v1", tags=["webhooks"])


@app.websocket("/api/v1/ws/resources")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        db = SessionLocal()
        try:
            from models import Resource
            resources = db.query(Resource).all()
            serialized = []
            for r in resources:
                serialized.append({
                    "resource_id": r.resource_id,
                    "resource_type": r.resource_type,
                    "name": r.name,
                    "state": r.state,
                    "cpu": r.cpu_utilization,
                    "cost": r.monthly_cost
                })
            await websocket.send_json({
                "event": "INITIAL_STATE",
                "resources": serialized
            })
        finally:
            db.close()

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


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
