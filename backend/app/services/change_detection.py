"""
TerraTrace AI — Change Detection Service
=========================================
Loads OSCD Sentinel-2 imagery, computes a pixel-difference change mask,
and returns before/after/mask as base64-encoded PNG data-URLs.

Algorithm: simple absolute difference on an RGB composite of B04/B03/B02,
averaged across channels, thresholded. No model required.
"""

from __future__ import annotations

import base64
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.io import MemoryFile

logger = logging.getLogger(__name__)

# ── Dataset root ───────────────────────────────────────────────────────────────
# Resolves to  <repo_root>/data/demo/
DATA_ROOT = Path(__file__).resolve().parents[4] / "data" / "demo"

# ── OSCD city metadata: (lat, lon) for map fly-to ─────────────────────────────
CITY_META: dict[str, dict] = {
    "abudhabi":  {"name": "Abu Dhabi",  "location": "UAE",         "lat": 24.47,  "lon":  54.37,  "zoom": 12},
    "beirut":    {"name": "Beirut",     "location": "Lebanon",     "lat": 33.89,  "lon":  35.50,  "zoom": 12},
    "dubai":     {"name": "Dubai",      "location": "UAE",         "lat": 25.20,  "lon":  55.27,  "zoom": 12},
    "lasvegas":  {"name": "Las Vegas",  "location": "Nevada, USA", "lat": 36.17,  "lon": -115.14, "zoom": 12},
    "mumbai":    {"name": "Mumbai",     "location": "India",       "lat": 19.08,  "lon":  72.88,  "zoom": 12},
    "saclay":    {"name": "Saclay",     "location": "France",      "lat": 48.72,  "lon":   2.17,  "zoom": 13},
}

# Target output size (pixels). Keep small for fast base64 payloads.
OUT_SIZE = 512

# RGB band names to load (Sentinel-2: B04=Red, B03=Green, B02=Blue)
RGB_BANDS = ["B04", "B03", "B02"]


# ── Path helpers ───────────────────────────────────────────────────────────────

def _find_images_root() -> Optional[Path]:
    """Return the 'Onera … Images' directory, regardless of exact capitalisation."""
    for child in DATA_ROOT.iterdir():
        if child.is_dir() and "Images" in child.name and "Onera" in child.name:
            return child
    return None


def _find_city_dir(region: str) -> Optional[Path]:
    """Locate the city subdirectory inside the OSCD Images folder."""
    imgs_root = _find_images_root()
    if imgs_root is None:
        return None
    candidate = imgs_root / region
    return candidate if candidate.is_dir() else None


def _find_time_dir(city_dir: Path, time_idx: int) -> Optional[Path]:
    """Return imgs_1_rect or imgs_1 for time_idx=1, similarly for 2."""
    for suffix in ("_rect", ""):
        p = city_dir / f"imgs_{time_idx}{suffix}"
        if p.is_dir():
            return p
    return None


# ── Image I/O ──────────────────────────────────────────────────────────────────

def _load_rgb(time_dir: Path) -> np.ndarray:
    """
    Load B04/B03/B02 TIFs and return a (OUT_SIZE, OUT_SIZE, 3) uint8 array.
    Pixel values are 2nd–98th percentile normalised to 0-255.
    """
    bands: list[np.ndarray] = []
    for band_name in RGB_BANDS:
        tif_path = time_dir / f"{band_name}.tif"
        if not tif_path.exists():
            raise FileNotFoundError(f"Band file not found: {tif_path}")
        with rasterio.open(tif_path) as src:
            data = src.read(
                1,
                out_shape=(1, OUT_SIZE, OUT_SIZE),
                resampling=Resampling.bilinear,
            ).astype(np.float32)
        bands.append(data[0])

    rgb = np.stack(bands, axis=-1)  # (H, W, 3)
    return _normalise(rgb)


def _normalise(arr: np.ndarray) -> np.ndarray:
    """Stretch each channel independently to 0-255 uint8."""
    out = np.empty_like(arr, dtype=np.float32)
    for c in range(arr.shape[-1]):
        ch = arr[:, :, c]
        lo, hi = np.percentile(ch, 2), np.percentile(ch, 98)
        if hi > lo:
            out[:, :, c] = np.clip((ch - lo) / (hi - lo) * 255, 0, 255)
        else:
            out[:, :, c] = 0
    return out.astype(np.uint8)


def _compute_mask(before: np.ndarray, after: np.ndarray, threshold: float) -> np.ndarray:
    """
    Absolute mean-channel difference, thresholded.
    Returns (H, W) bool array — True = changed pixel.
    """
    diff = np.abs(after.astype(np.float32) - before.astype(np.float32)) / 255.0
    mean_diff = diff.mean(axis=-1)          # (H, W)
    return mean_diff > threshold


def _to_png_b64(arr_hwc: np.ndarray) -> str:
    """
    Encode a (H, W, C) uint8 array as a PNG and return a data-URL string.
    C must be 1, 3, or 4.
    """
    h, w, c = arr_hwc.shape
    chw = arr_hwc.transpose(2, 0, 1)        # (C, H, W) — rasterio order
    with MemoryFile() as memfile:
        with memfile.open(
            driver="PNG",
            width=w,
            height=h,
            count=c,
            dtype=np.uint8,
        ) as ds:
            ds.write(chw)
        raw = memfile.read()
    return "data:image/png;base64," + base64.b64encode(raw).decode()


def _mask_to_rgba_png(mask: np.ndarray) -> str:
    """
    Convert a boolean (H, W) mask to a semi-transparent red RGBA PNG.
    Changed pixels → (255, 60, 60, 180); unchanged → transparent.
    """
    h, w = mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[mask, 0] = 255   # R
    rgba[mask, 1] = 60    # G
    rgba[mask, 2] = 60    # B
    rgba[mask, 3] = 180   # A  (semi-transparent)
    return _to_png_b64(rgba)


# ── Public API ─────────────────────────────────────────────────────────────────

def list_regions() -> list[dict]:
    """Return the list of known regions and whether their data is on disk."""
    regions = []
    for key, meta in CITY_META.items():
        city_dir = _find_city_dir(key)
        available = city_dir is not None and (
            _find_time_dir(city_dir, 1) is not None
            and _find_time_dir(city_dir, 2) is not None
        )
        regions.append({
            "region": key,
            "name": meta["name"],
            "location": meta["location"],
            "lat": meta["lat"],
            "lon": meta["lon"],
            "zoom": meta["zoom"],
            "available": available,
        })
    return regions


def run_compare(region: str, threshold: float = 0.15) -> dict:
    """
    Load before/after imagery for *region*, compute change mask, return
    before_png, after_png, mask_png (base64 data-URLs) + stats.

    Raises ValueError if the region is unknown.
    Raises FileNotFoundError if the OSCD data has not been downloaded.
    """
    if region not in CITY_META:
        raise ValueError(f"Unknown region '{region}'. Valid: {list(CITY_META)}")

    meta = CITY_META[region]
    city_dir = _find_city_dir(region)
    if city_dir is None:
        raise FileNotFoundError(
            f"OSCD data not found for '{region}'. "
            "Run: python scripts/download_oscd.py --split train"
        )

    before_dir = _find_time_dir(city_dir, 1)
    after_dir  = _find_time_dir(city_dir, 2)
    if before_dir is None or after_dir is None:
        raise FileNotFoundError(
            f"Image sub-directories missing for '{region}' in {city_dir}"
        )

    logger.info("Loading before imagery from %s", before_dir)
    before_rgb = _load_rgb(before_dir)

    logger.info("Loading after imagery from %s", after_dir)
    after_rgb  = _load_rgb(after_dir)

    logger.info("Computing change mask (threshold=%.2f)", threshold)
    mask = _compute_mask(before_rgb, after_rgb, threshold)

    changed   = int(mask.sum())
    total     = mask.size
    pct       = round(changed / total * 100, 2)

    return {
        "region":        region,
        "name":          meta["name"],
        "location":      meta["location"],
        "lat":           meta["lat"],
        "lon":           meta["lon"],
        "zoom":          meta["zoom"],
        "before_label":  "2015",
        "after_label":   "2018",
        "before_png":    _to_png_b64(before_rgb),
        "after_png":     _to_png_b64(after_rgb),
        "mask_png":      _mask_to_rgba_png(mask),
        "stats": {
            "changed_pixels":   changed,
            "total_pixels":     total,
            "change_percentage": pct,
            "threshold_used":   threshold,
        },
    }
