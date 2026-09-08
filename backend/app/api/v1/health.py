"""
TerraTrace AI — Health Check Endpoint
GET /api/v1/health
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Service health check")
async def health_check() -> dict:
    """
    Returns the current service status, version, and server timestamp.
    Used by load-balancers, Docker HEALTHCHECK, and uptime monitors.
    """
    return {
        "status": "ok",
        "service": "TerraTrace AI",
        "version": "0.1.0",
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "phase": "1 — Scaffold (offline mode)",
    }
