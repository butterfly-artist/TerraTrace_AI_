"""
TerraTrace AI — Copernicus Data Space Ecosystem Live Integration
================================================================
Fetches Sentinel-2 imagery via Copernicus Data Space Ecosystem STAC / OpenSearch API.
Includes a graceful fallback to Demo Mode if API keys are absent or if network requests fail.
"""

from __future__ import annotations

import logging
import os
import requests
from typing import Dict, Any, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

COPERNICUS_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
COPERNICUS_STAC_URL = "https://catalogue.dataspace.copernicus.eu/stac/search"


def get_copernicus_token() -> Optional[str]:
    """Obtain an OAuth 2.0 access token from Copernicus CDSE identity service."""
    client_id = os.getenv("COPERNICUS_CLIENT_ID") or settings.copernicus_client_id
    client_secret = os.getenv("COPERNICUS_CLIENT_SECRET") or settings.copernicus_client_secret

    if not client_id or not client_secret or client_id == "your_copernicus_client_id_here":
        logger.info("Copernicus credentials not provided — using Live Mode simulation fallback.")
        return None

    try:
        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        }
        resp = requests.post(COPERNICUS_AUTH_URL, data=data, timeout=5.0)
        if resp.status_code == 200:
            return resp.json().get("access_token")
        else:
            logger.warning("Copernicus token request failed HTTP %d: %s", resp.status_code, resp.text)
            return None
    except Exception as exc:
        logger.warning("Copernicus auth exception: %s", exc)
        return None


def search_sentinel2_scenes(
    bbox: list[float],
    start_date: str,
    end_date: str,
    max_cloud_cover: float = 20.0
) -> Dict[str, Any]:
    """
    Search Sentinel-2 L2A scenes over given bounding box [min_lon, min_lat, max_lon, max_lat]
    and date range.
    Returns scene metadata with fallback to Demo Mode if API call fails.
    """
    token = get_copernicus_token()
    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "collections": ["SENTINEL-2"],
                "bbox": bbox,
                "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
                "query": {
                    "eo:cloud_cover": {"lte": max_cloud_cover}
                },
                "limit": 5
            }
            res = requests.post(COPERNICUS_STAC_URL, headers=headers, json=payload, timeout=8.0)
            if res.status_code == 200:
                data = res.json()
                features = data.get("features", [])
                logger.info("Copernicus STAC search found %d scenes", len(features))
                return {
                    "status": "success",
                    "mode": "live_copernicus",
                    "scenes_found": len(features),
                    "scenes": [
                        {
                            "id": f.get("id"),
                            "date": f.get("properties", {}).get("datetime"),
                            "cloud_cover": f.get("properties", {}).get("eo:cloud_cover"),
                        }
                        for f in features
                    ]
                }
        except Exception as exc:
            logger.warning("Live Copernicus STAC query failed: %s. Falling back to Demo Mode.", exc)

    # Fallback response indicating graceful fallback
    return {
        "status": "fallback",
        "mode": "demo_fallback",
        "message": "Live Copernicus API unavailable or credentials omitted. Operating in Demo Mode using cached OSCD data.",
        "scenes_found": 2,
        "scenes": [
            {"id": "S2B_MSIL2A_2015_DEMO", "date": f"{start_date}-15", "cloud_cover": 2.0},
            {"id": "S2A_MSIL2A_2018_DEMO", "date": f"{end_date}-15", "cloud_cover": 1.5},
        ]
    }
