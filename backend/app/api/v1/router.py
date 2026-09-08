"""
TerraTrace AI — API v1 Router
Mounts all sub-routers under /api/v1
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import health
from app.api.v1 import change_detection

router = APIRouter(prefix="/api/v1")

# ── Sub-routers ───────────────────────────────────────────────
router.include_router(health.router)
router.include_router(change_detection.router)
