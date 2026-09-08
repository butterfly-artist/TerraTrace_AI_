"""
TerraTrace AI — API v1 Change Detection, Chat, Copernicus & Report Router
========================================================================
Endpoints:
  GET  /api/v1/change-detection/regions
  POST /api/v1/change-detection/compare
  POST /api/v1/chat/query
  POST /api/v1/copernicus/search
  POST /api/v1/report/generate
"""

from __future__ import annotations

import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.services.change_detection import list_regions, run_compare
from app.services.llm_chat import parse_query_and_execute, generate_grounded_summary
from app.services.copernicus import search_sentinel2_scenes
from app.services.report_generator import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["TerraTrace Platform"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    region: str = Field(..., description="OSCD city folder name, e.g. 'dubai'")
    threshold: float = Field(0.15, ge=0.0, le=1.0, description="Change detection threshold")
    year_before: Optional[str] = Field("2015", description="Start year")
    year_after: Optional[str] = Field("2018", description="End year")


class ChatQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language search query")
    mode: Optional[str] = Field("demo", description="demo or live")


class CopernicusSearchRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date: str = Field(..., description="YYYY-MM-DD")
    max_cloud_cover: Optional[float] = Field(20.0, description="Max cloud cover %")


class ReportGenerateRequest(BaseModel):
    region: str = Field(..., description="Region key, e.g. 'dubai'")
    year_before: Optional[str] = Field("2015")
    year_after: Optional[str] = Field("2018")


# ── Change Detection Endpoints ─────────────────────────────────────────────────

@router.get("/change-detection/regions", summary="List available OSCD regions")
async def get_regions() -> list[dict]:
    return list_regions()


@router.post("/change-detection/compare", summary="Run before/after change detection")
async def compare(req: CompareRequest) -> dict:
    try:
        result = run_compare(
            region=req.region,
            threshold=req.threshold,
            year_before=req.year_before or "2015",
            year_after=req.year_after or "2018",
        )
        logger.info(
            "Compare executed: region=%s changed=%.1f%% impact=%d",
            req.region,
            result["stats"]["change_percentage"],
            result["impact"]["score"],
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error running compare for region=%s", req.region)
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}") from exc


# ── Natural Language Query / Chat Endpoint ─────────────────────────────────────

@router.post("/chat/query", summary="Parse free-text query with LLM")
async def chat_query(req: ChatQueryRequest) -> dict:
    regions = list_regions()
    parsed = parse_query_and_execute(req.query, regions, current_mode=req.mode or "demo")

    target_region = parsed["intent"]["target_region_key"]
    threshold = parsed["intent"]["confidence_threshold"]

    # Execute backend compare tool call automatically
    try:
        comp_res = run_compare(target_region, threshold=threshold)
        summary = generate_grounded_summary(
            query=req.query,
            region_name=comp_res["name"],
            stats=comp_res["stats"],
            impact=comp_res["impact"],
            llm_name=parsed["llm_used"],
        )
        return {
            "query": req.query,
            "intent": parsed["intent"],
            "llm_used": parsed["llm_used"],
            "summary": summary,
            "compare_data": comp_res,
        }
    except Exception as exc:
        logger.warning("Auto execution failed during chat: %s", exc)
        return {
            "query": req.query,
            "intent": parsed["intent"],
            "llm_used": parsed["llm_used"],
            "summary": f"Parsed query for region '{target_region}'. Imagery comparison failed: {exc}",
            "compare_data": None,
        }


# ── Live Copernicus Search Endpoint ───────────────────────────────────────────

@router.post("/copernicus/search", summary="Search live Sentinel-2 scenes via Copernicus API")
async def copernicus_search(req: CopernicusSearchRequest) -> dict:
    return search_sentinel2_scenes(
        bbox=req.bbox,
        start_date=req.start_date,
        end_date=req.end_date,
        max_cloud_cover=req.max_cloud_cover or 20.0,
    )


# ── PDF Report Generation Endpoint ────────────────────────────────────────────

@router.post("/report/generate", summary="Generate downloadable PDF analytical report")
async def generate_report(req: ReportGenerateRequest):
    try:
        comp_res = run_compare(req.region, year_before=req.year_before, year_after=req.year_after)
        summary = generate_grounded_summary(
            query="Analytical Report Request",
            region_name=comp_res["name"],
            stats=comp_res["stats"],
            impact=comp_res["impact"],
        )

        pdf_bytes = generate_pdf_report(
            region_name=comp_res["name"],
            location=comp_res["location"],
            lat=comp_res["lat"],
            lon=comp_res["lon"],
            before_date=comp_res["before_label"],
            after_date=comp_res["after_label"],
            stats=comp_res["stats"],
            impact=comp_res["impact"],
            summary_text=summary,
        )

        filename = f"TerraTrace_Report_{req.region}_{comp_res['before_label']}_{comp_res['after_label']}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        logger.exception("Failed to generate PDF report for region=%s", req.region)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc
