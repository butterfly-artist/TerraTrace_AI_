#!/usr/bin/env python3
"""
TerraTrace AI — Sample OSCD Demo Data Generator
===============================================
Generates high-quality multispectral demo TIF files for OSCD regions.
Serves as an offline safety net when full dataset download is not available.
"""

import sys
from pathlib import Path
import numpy as np
import rasterio
from rasterio.transform import from_origin

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data" / "demo" / "Onera Satellite Change Detection dataset - Images"

CITIES = {
    "abudhabi": {"lat": 24.47, "lon": 54.37, "name": "Abu Dhabi"},
    "beirut":   {"lat": 33.89, "lon": 35.50, "name": "Beirut"},
    "dubai":    {"lat": 25.20, "lon": 55.27, "name": "Dubai"},
    "lasvegas": {"lat": 36.17, "lon": -115.14, "name": "Las Vegas"},
    "mumbai":   {"lat": 19.08, "lon": 72.88, "name": "Mumbai"},
    "saclay":   {"lat": 48.72, "lon": 2.17, "name": "Saclay"},
}

BANDS = ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B09", "B10", "B11", "B12"]


def generate_city_data(city_key: str, meta: dict) -> None:
    city_dir = DATA_DIR / city_key
    imgs1_dir = city_dir / "imgs_1_rect"
    imgs2_dir = city_dir / "imgs_2_rect"

    imgs1_dir.mkdir(parents=True, exist_ok=True)
    imgs2_dir.mkdir(parents=True, exist_ok=True)

    size = 512
    transform = from_origin(meta["lon"], meta["lat"], 0.0001, 0.0001)

    # Seed for reproducibility per city
    seed = sum(ord(c) for c in city_key)
    np.random.seed(seed)

    # Base land texture
    base = np.random.uniform(800, 2200, size=(size, size)).astype(np.float32)

    # Add spatial structure (smooth hills/urban grid)
    x = np.linspace(-3, 3, size)
    y = np.linspace(-3, 3, size)
    xx, yy = np.meshgrid(x, y)
    grid_pattern = 300 * np.sin(xx * 5) * np.cos(yy * 5)
    base_t1 = np.clip(base + grid_pattern, 200, 4000).astype(np.uint16)

    # Modify time 2 to simulate real change (new built-up area & vegetation loss)
    base_t2 = base_t1.copy()
    
    # Simulate built-up expansion (patch 1)
    cy1, cx1 = size // 3, size // 3
    r1 = 60
    y_grid, x_grid = np.ogrid[:size, :size]
    mask_built = ((x_grid - cx1)**2 + (y_grid - cy1)**2) <= r1**2
    base_t2[mask_built] = np.clip(base_t2[mask_built] * 1.8 + 1200, 0, 9000).astype(np.uint16)

    # Simulate vegetation clearing / water expansion (patch 2)
    cy2, cx2 = 2 * size // 3, 2 * size // 3
    r2 = 45
    mask_veg = ((x_grid - cx2)**2 + (y_grid - cy2)**2) <= r2**2
    base_t2[mask_veg] = np.clip(base_t2[mask_veg] * 0.4, 0, 9000).astype(np.uint16)

    # Write 13 bands for t1 and t2
    for b_idx, band_name in enumerate(BANDS):
        band_multiplier = 1.0 + (b_idx * 0.08)
        
        t1_band = np.clip(base_t1 * band_multiplier, 0, 10000).astype(np.uint16)
        t2_band = np.clip(base_t2 * band_multiplier, 0, 10000).astype(np.uint16)

        for out_dir, band_data in [(imgs1_dir, t1_band), (imgs2_dir, t2_band)]:
            out_file = out_dir / f"{band_name}.tif"
            with rasterio.open(
                out_file,
                'w',
                driver='GTiff',
                height=size,
                width=size,
                count=1,
                dtype=np.uint16,
                crs='EPSG:4326',
                transform=transform,
            ) as dst:
                dst.write(band_data, 1)

    print(f"  [OK] Generated synthetic OSCD imagery for {meta['name']} ({city_key})")


def main() -> None:
    print("=" * 60)
    print("  TerraTrace AI — Generating Demo OSCD Imagery")
    print("=" * 60)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for city_key, meta in CITIES.items():
        generate_city_data(city_key, meta)
    print("=" * 60)
    print("  [SUCCESS] Demo OSCD imagery generated successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
