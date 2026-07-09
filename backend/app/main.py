from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.api.v1 import auth, resources, health, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    print("Bootstrapping database tables...")
    await init_db()
    print("Database initialization complete.")
    yield
    # Cleanup on shutdown if needed
    print("Shutting down CloudPulse API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configurations
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["AWS Resources"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health & Recommendations"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["SRE Chat Copilot"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "api_prefix": settings.API_V1_STR,
        "documentation": "/docs"
    }
