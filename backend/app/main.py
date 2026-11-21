import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.services.seed_data import seed_database
from backend.app.routes import public_routes, admin_routes, ai_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civictrack")

# Ensure database tables and initial records exist
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    logger.warning(f"Database seed note: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="CivicTrack Karnataka – AI-Powered Government Project Transparency & Accountability",
    description="Backend API services aggregating, analyzing, and explaining public government development projects across Karnataka, India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount Routers
app.include_router(public_routes.router, prefix=settings.API_V1_STR)
app.include_router(admin_routes.router, prefix=settings.API_V1_STR)
app.include_router(ai_routes.router, prefix=settings.API_V1_STR)

# Serve compiled frontend (dist) for single-port unified deployment
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
assets_path = os.path.join(dist_path, "assets")

if os.path.exists(dist_path) and os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["api", "docs", "redoc", "openapi.json"]:
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = os.path.join(dist_path, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to CivicTrack Karnataka – AI-Powered Government Project Transparency & Accountability System",
            "documentation": "/docs",
            "api_v1": settings.API_V1_STR,
            "state": "Karnataka, India"
        }
