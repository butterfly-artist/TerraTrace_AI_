#!/usr/bin/env python3
"""
TerraTrace AI — OSCD Dataset Downloader
========================================
Downloads the Onera Satellite Change Detection (OSCD) dataset using TorchGeo.

The OSCD dataset contains 24 pairs of Sentinel-2 multispectral images
(13 bands, 10–60 m/px) over urban areas, along with binary change masks.

Usage
-----
    # From the repo root:
    python scripts/download_oscd.py                  # train split only
    python scripts/download_oscd.py --split test     # test split only
    python scripts/download_oscd.py --split all      # both splits
    python scripts/download_oscd.py --dry-run        # check deps without downloading

Dataset
-------
    Daudt et al., "Fully Convolutional Siamese Networks for Change Detection",
    ICIP 2018. https://doi.org/10.1109/ICIP.2018.8451652
    Original data: https://rcdaudt.github.io/oscd/
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

# ── Ensure we can always find the project root ────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_DIR = REPO_ROOT / "data" / "demo"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def check_dependencies() -> bool:
    """Return True if all required packages are importable."""
    missing = []
    for pkg in ("torchgeo", "torch", "rasterio"):
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(
            f"[ERROR] Missing packages: {', '.join(missing)}\n"
            f"        Install them with:\n"
            f"          pip install torchgeo torch rasterio\n"
            f"        Or install the full backend requirements:\n"
            f"          pip install -r backend/requirements.txt"
        )
        return False
    return True


def download_split(split: str, root: Path) -> None:
    """Download one OSCD split using TorchGeo's built-in downloader."""
    from torchgeo.datasets import OSCD  # type: ignore[import]

    print(f"\n{'─'*60}")
    print(f"  Downloading OSCD split: {split.upper()!r}")
    print(f"  Destination:            {root}")
    print(f"{'─'*60}")

    start = time.perf_counter()

    # TorchGeo handles authentication, download, extraction, and checksum
    dataset = OSCD(
        root=str(root),
        split=split,
        bands="all",       # all 13 Sentinel-2 bands
        download=True,
        checksum=True,
    )

    elapsed = time.perf_counter() - start

    print(f"\n  ✅ Download complete in {elapsed:.1f}s")
    print(f"  📦 Dataset size:  {len(dataset)} image-pair chips")

    # ── Print a sample chip's metadata ───────────────────────────────────────
    if len(dataset) > 0:
        sample = dataset[0]
        img_shape = tuple(sample["image"].shape) if "image" in sample else "n/a"
        mask_shape = tuple(sample["mask"].shape) if "mask" in sample else "n/a"
        print(f"  🛰  Sample image shape:  {img_shape}  (C×H×W)")
        print(f"  🗺  Sample mask  shape:  {mask_shape}  (1×H×W, 0=no-change, 255=change)")

    # ── List downloaded files ─────────────────────────────────────────────────
    tif_files = sorted(root.rglob("*.tif")) + sorted(root.rglob("*.tiff"))
    print(f"\n  📂 TIF files on disk: {len(tif_files)}")
    for f in tif_files[:8]:
        size_mb = f.stat().st_size / 1_048_576
        print(f"     {f.relative_to(root)}  ({size_mb:.1f} MB)")
    if len(tif_files) > 8:
        print(f"     … and {len(tif_files) - 8} more")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download the OSCD change-detection dataset into data/demo/",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--split",
        choices=["train", "test", "all"],
        default="train",
        help="Which split to download (default: train)",
    )
    parser.add_argument(
        "--dest",
        type=Path,
        default=DATA_DIR,
        help=f"Destination directory (default: {DATA_DIR})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Check dependencies and print config without downloading",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  TerraTrace AI — OSCD Dataset Downloader")
    print("=" * 60)
    print(f"  Split:       {args.split}")
    print(f"  Destination: {args.dest}")

    # ── Dependency check ──────────────────────────────────────────────────────
    if not check_dependencies():
        sys.exit(1)

    if args.dry_run:
        print("\n  [dry-run] Dependencies OK. Exiting without downloading.")
        sys.exit(0)

    # ── Download ──────────────────────────────────────────────────────────────
    splits = ["train", "test"] if args.split == "all" else [args.split]
    for split in splits:
        try:
            download_split(split, args.dest)
        except Exception as exc:
            print(f"\n  ❌ Failed to download split '{split}': {exc}")
            print("     Tip: Check your internet connection. OSCD is ~2 GB per split.")
            sys.exit(1)

    print("\n" + "=" * 60)
    print("  🎉 All done! Imagery is ready in data/demo/")
    print("     The backend can now serve tiles from this directory.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
