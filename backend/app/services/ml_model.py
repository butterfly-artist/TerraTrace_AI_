"""
TerraTrace AI — ML Change Detection & Classification Service
============================================================
Performs bi-temporal satellite image change detection, land-cover change
classification (built-up, vegetation loss, road expansion, water body),
evidence metrics (NDVI/NDWI/NDBI delta), confidence map generation,
and physical affected area calculation.
"""

from __future__ import annotations

import base64
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.io import MemoryFile

logger = logging.getLogger(__name__)

# Ground Sample Distance for Sentinel-2 10m bands (1 pixel = 10m x 10m = 100 sq meters)
PIXEL_AREA_SQM = 100.0  # 10m x 10m
SQM_TO_HECTARES = 0.0001
SQM_TO_SQKM = 0.000001


def calculate_spectral_indices(b02: np.ndarray, b03: np.ndarray, b04: np.ndarray, b08: np.ndarray, b11: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Computes key Earth Observation spectral indices:
      - NDVI (Normalized Difference Vegetation Index) = (NIR - Red) / (NIR + Red)
      - NDWI (Normalized Difference Water Index)     = (Green - NIR) / (Green + NIR)
      - NDBI (Normalized Difference Built-up Index)  = (SWIR - NIR) / (SWIR + NIR)
    """
    eps = 1e-6
    b02_f = b02.astype(np.float32)
    b03_f = b03.astype(np.float32)
    b04_f = b04.astype(np.float32)
    b08_f = b08.astype(np.float32)
    b11_f = b11.astype(np.float32)

    ndvi = (b08_f - b04_f) / (b08_f + b04_f + eps)
    ndwi = (b03_f - b08_f) / (b03_f + b08_f + eps)
    ndbi = (b11_f - b08_f) / (b11_f + b08_f + eps)

    return {
        "ndvi": np.clip(ndvi, -1.0, 1.0),
        "ndwi": np.clip(ndwi, -1.0, 1.0),
        "ndbi": np.clip(ndbi, -1.0, 1.0),
    }


def classify_changes(
    indices_t1: Dict[str, np.ndarray],
    indices_t2: Dict[str, np.ndarray],
    raw_diff: np.ndarray,
    threshold: float = 0.15
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Classifies change pixels into 4 target land-use categories:
      1: New built-up area  (NDBI increases significantly)
      2: Vegetation loss     (NDVI drops significantly)
      3: Water-body change   (NDWI delta is large)
      4: Road expansion      (linear high-contrast structure / general built change)
      0: No change
    """
    d_ndvi = indices_t2["ndvi"] - indices_t1["ndvi"]
    d_ndwi = indices_t2["ndwi"] - indices_t1["ndwi"]
    d_ndbi = indices_t2["ndbi"] - indices_t1["ndbi"]

    # Base change mask
    change_mask = raw_diff > threshold

    h, w = change_mask.shape
    class_mask = np.zeros((h, w), dtype=np.uint8)
    confidence_map = np.zeros((h, w), dtype=np.float32)

    if not np.any(change_mask):
        return class_mask, confidence_map, {
            "built_up_ha": 0.0,
            "veg_loss_ha": 0.0,
            "water_change_ha": 0.0,
            "road_expansion_ha": 0.0,
            "total_changed_ha": 0.0,
            "total_sqkm": 0.0,
        }

    # Assign classes based on spectral deltas
    # Vegetation loss: d_ndvi < -0.2
    veg_loss = change_mask & (d_ndvi < -0.15)
    # Water change: |d_ndwi| > 0.25
    water_change = change_mask & (~veg_loss) & (np.abs(d_ndwi) > 0.20)
    # New built up: d_ndbi > 0.15
    built_up = change_mask & (~veg_loss) & (~water_change) & (d_ndbi > 0.10)
    # Road expansion: remaining change pixels
    road_exp = change_mask & (~veg_loss) & (~water_change) & (~built_up)

    class_mask[built_up] = 1
    class_mask[veg_loss] = 2
    class_mask[road_exp] = 3
    class_mask[water_change] = 4

    # Calculate model confidence map (0.0 to 1.0) based on signal strength
    signal = np.abs(d_ndbi) * 0.4 + np.abs(d_ndvi) * 0.4 + raw_diff * 0.2
    confidence_map[change_mask] = np.clip(signal[change_mask] / 0.5, 0.5, 0.98)

    # Calculate physical areas
    num_built = int(np.sum(built_up))
    num_veg = int(np.sum(veg_loss))
    num_road = int(np.sum(road_exp))
    num_water = int(np.sum(water_change))
    num_total = int(np.sum(change_mask))

    built_ha = round(num_built * PIXEL_AREA_SQM * SQM_TO_HECTARES, 2)
    veg_ha = round(num_veg * PIXEL_AREA_SQM * SQM_TO_HECTARES, 2)
    road_ha = round(num_road * PIXEL_AREA_SQM * SQM_TO_HECTARES, 2)
    water_ha = round(num_water * PIXEL_AREA_SQM * SQM_TO_HECTARES, 2)
    total_ha = round(num_total * PIXEL_AREA_SQM * SQM_TO_HECTARES, 2)
    total_sqkm = round(num_total * PIXEL_AREA_SQM * SQM_TO_SQKM, 3)

    area_stats = {
        "built_up_ha": built_ha,
        "veg_loss_ha": veg_ha,
        "road_expansion_ha": road_ha,
        "water_change_ha": water_ha,
        "total_changed_ha": total_ha,
        "total_sqkm": total_sqkm,
        "class_counts": {
            "new_built_up": num_built,
            "vegetation_loss": num_veg,
            "road_expansion": num_road,
            "water_body_change": num_water,
        }
    }

    return class_mask, confidence_map, area_stats


def class_mask_to_rgba(class_mask: np.ndarray) -> str:
    """
    Converts multi-class uint8 mask to a multi-colored RGBA overlay PNG.
      1: Built-up → Red (#EF4444)
      2: Veg Loss → Amber (#F59E0B)
      3: Road Expansion → Cyan (#06B6D4)
      4: Water Change → Blue (#3B82F6)
    """
    h, w = class_mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    # 1: Built up (Red)
    m1 = (class_mask == 1)
    rgba[m1] = [239, 68, 68, 190]

    # 2: Veg Loss (Amber/Orange)
    m2 = (class_mask == 2)
    rgba[m2] = [245, 158, 11, 190]

    # 3: Road Expansion (Cyan)
    m3 = (class_mask == 3)
    rgba[m3] = [6, 182, 212, 190]

    # 4: Water Change (Blue)
    m4 = (class_mask == 4)
    rgba[m4] = [59, 130, 246, 190]

    h_arr, w_arr, c_arr = rgba.shape
    chw = rgba.transpose(2, 0, 1)
    with MemoryFile() as memfile:
        with memfile.open(
            driver="PNG",
            width=w_arr,
            height=h_arr,
            count=4,
            dtype=np.uint8,
        ) as ds:
            ds.write(chw)
        raw = memfile.read()
    return "data:image/png;base64," + base64.b64encode(raw).decode()


def compute_impact_score(area_stats: Dict[str, Any], avg_confidence: float) -> Dict[str, Any]:
    """
    Computes a unified Impact Score (0–100) based on affected area, class severity weights,
    and model confidence.
    """
    ha = area_stats.get("total_changed_ha", 0.0)
    built_ha = area_stats.get("built_up_ha", 0.0)
    veg_ha = area_stats.get("veg_loss_ha", 0.0)

    # Severity weights: Built-up & Veg loss weighted higher
    severity = (built_ha * 1.5 + veg_ha * 1.2 + (ha - built_ha - veg_ha) * 0.8) / (ha + 1e-5)
    
    # Logarithmic area scale up to 1000 ha
    area_factor = min(1.0, np.log10(ha + 1.0) / 3.0)

    raw_score = (area_factor * 60.0 + severity * 25.0 + avg_confidence * 15.0)
    score = int(round(np.clip(raw_score, 1, 99)))

    level = "CRITICAL" if score >= 75 else "HIGH" if score >= 50 else "MODERATE" if score >= 25 else "LOW"

    return {
        "score": score,
        "level": level,
        "factors": {
            "area_factor": round(area_factor, 2),
            "severity_weight": round(severity, 2),
            "confidence": round(avg_confidence, 2),
        }
    }
