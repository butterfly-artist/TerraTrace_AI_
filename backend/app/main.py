"""
TerraTrace AI — FastAPI Application Entry Point
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings

settings = get_settings()

# ── Application ───────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "AI-powered satellite imagery search and change-detection platform. "
        "Phase 1: Offline scaffold with OSCD demo data."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(api_v1_router)


# ── Root redirect ─────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"message": f"Welcome to {settings.app_name} API. Visit /docs for the interactive API documentation."}
