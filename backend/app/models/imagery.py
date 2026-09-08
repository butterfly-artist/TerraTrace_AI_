"""
TerraTrace AI — ORM Models (stubs)
Imagery and scene metadata stored in PostGIS.
"""

from __future__ import annotations

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SatelliteScene(Base):
    """
    Represents a single satellite acquisition (scene/tile).
    Geometry stored as PostGIS geography (WGS-84).
    """

    __tablename__ = "satellite_scenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scene_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    satellite: Mapped[str] = mapped_column(String(32), default="Sentinel-2")
    acquisition_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Bounding box stored as PostGIS POLYGON
    footprint: Mapped[Geometry] = mapped_column(
        Geometry("POLYGON", srid=4326), nullable=True
    )

    cloud_cover: Mapped[float] = mapped_column(Float, default=0.0)
    file_path: Mapped[str] = mapped_column(String(512), nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="OSCD")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<SatelliteScene id={self.id} scene_id={self.scene_id!r}>"


class ChangeDetectionResult(Base):
    """
    Stores the output of a change-detection run between two scenes.
    """

    __tablename__ = "change_detection_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    before_scene_id: Mapped[int] = mapped_column(Integer, index=True)
    after_scene_id: Mapped[int] = mapped_column(Integer, index=True)
    model_name: Mapped[str] = mapped_column(String(64), default="OSCD-baseline")
    change_mask_path: Mapped[str] = mapped_column(String(512), nullable=True)
    change_percentage: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
