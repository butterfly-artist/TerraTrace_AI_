"""
TerraTrace AI — API v1 Router
Mounts all sub-routers under /api/v1
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import health

router = APIRouter(prefix="/api/v1")

# ── Sub-routers ───────────────────────────────────────────────
router.include_router(health.router)

# Phase 2+: imagery, change-detection, search routers go here
# router.include_router(imagery.router)
# router.include_router(change_detection.router)
