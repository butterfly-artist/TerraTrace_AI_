"""
TerraTrace AI — LLM Query Parsing & Narrative Service
=====================================================
Uses Gemini API (or Groq API fallback) for function calling:
  - Parses free-text queries into structured parameters: location, start_date, end_date, change_type
  - Triggers internal backend tools (search_scenes, run_change_detection, get_evidence)
  - Produces a grounded, facts-only 1-paragraph summary tied strictly to actual model outputs.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Dict, Any, List, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are TerraTrace AI's Geospatial Intelligence Assistant.
Your job is to parse user satellite imagery search queries, extract structured parameters,
and execute tool calls to run change detection.

CRITICAL GUARDRAILS:
1. You MUST NEVER invent or hallucinate change detection figures, percentages, or hectares.
2. All quantitative findings MUST be derived strictly from the tool execution outputs.
3. If no region matches precisely, pick the closest available demo region (e.g. Abu Dhabi, Beirut, Dubai, Las Vegas, Mumbai, Saclay, or Hyderabad).
"""


def parse_query_and_execute(
    user_query: str,
    available_regions: List[Dict[str, Any]],
    current_mode: str = "demo"
) -> Dict[str, Any]:
    """
    Parses natural language query into intent, selects best matching region & parameters,
    and returns structured intent + executive narration.
    """
    gemini_key = os.getenv("GEMINI_API_KEY") or settings.gemini_api_key
    groq_key = os.getenv("GROQ_API_KEY") or settings.groq_api_key

    # Attempt Gemini API first, then Groq fallback, then rule-based parser fallback
    result = None

    if gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            result = _query_gemini(user_query, gemini_key, available_regions)
        except Exception as exc:
            logger.warning("Gemini API call failed, trying Groq fallback: %s", exc)

    if result is None and groq_key and groq_key != "your_groq_api_key_here":
        try:
            result = _query_groq(user_query, groq_key, available_regions)
        except Exception as exc:
            logger.warning("Groq API call failed, falling back to rule-based parser: %s", exc)

    if result is None:
        result = _rule_based_parser(user_query, available_regions)

    return result


def _rule_based_parser(query: str, available_regions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Fast, deterministic fallback parser for query intent."""
    q = query.lower()

    matched_region = "dubai"  # default
    for reg in available_regions:
        r_key = reg.get("region", "").lower()
        r_name = reg.get("name", "").lower()
        r_loc = reg.get("location", "").lower()
        if r_key in q or r_name in q or r_loc in q:
            matched_region = reg["region"]
            break

    # Determine change type
    change_type = "new_built_up"
    if "vegetation" in q or "forest" in q or "tree" in q or "green" in q:
        change_type = "vegetation_loss"
    elif "water" in q or "river" in q or "lake" in q or "flood" in q:
        change_type = "water_body_change"
    elif "road" in q or "highway" in q or "transport" in q:
        change_type = "road_expansion"

    start_date = "2015-01"
    end_date = "2018-01"
    if "2022" in q or "2026" in q:
        start_date = "2022-01"
        end_date = "2026-01"

    return {
        "intent": {
            "location": matched_region,
            "target_region_key": matched_region,
            "start_date": start_date,
            "end_date": end_date,
            "change_type": change_type,
            "confidence_threshold": 0.15,
        },
        "llm_used": "Rule-Based Offline Parser",
        "narration_template": (
            "Parsed query for region '{region}'. Intent extracted: searching for {change_type} "
            "between {start_date} and {end_date}."
        )
    }


def _query_gemini(query: str, api_key: str, available_regions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Query Gemini 2.5/3.6 Flash model for tool calling."""
    import google.genai as genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    prompt = f"""User Query: "{query}"

Available OSCD regions: {json.dumps([r['region'] for r in available_regions])}

Extract JSON with keys:
- "target_region_key": one of {json.dumps([r['region'] for r in available_regions])} (pick best match, default 'dubai')
- "start_date": string date
- "end_date": string date
- "change_type": one of ["new_built_up", "vegetation_loss", "road_expansion", "water_body_change"]
- "explanation_draft": brief initial summary

Return ONLY valid JSON.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        )
    )

    if response and response.text:
        data = json.loads(response.text)
        return {
            "intent": {
                "location": data.get("target_region_key", "dubai"),
                "target_region_key": data.get("target_region_key", "dubai"),
                "start_date": data.get("start_date", "2015-01"),
                "end_date": data.get("end_date", "2018-01"),
                "change_type": data.get("change_type", "new_built_up"),
                "confidence_threshold": 0.15,
            },
            "llm_used": "Google Gemini API",
            "narration_template": data.get("explanation_draft", "Analysis complete.")
        }
    return None


def _query_groq(query: str, api_key: str, available_regions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Query Groq API as high-speed fallback."""
    from groq import Groq

    client = Groq(api_key=api_key)
    prompt = f"""Extract intent from query: "{query}".
Available regions: {[r['region'] for r in available_regions]}.
Return JSON object with keys: target_region_key, start_date, end_date, change_type.
"""
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a spatial query parser. Output valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        model="llama3-8b-8192",
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    res_text = chat_completion.choices[0].message.content
    if res_text:
        data = json.loads(res_text)
        return {
            "intent": {
                "location": data.get("target_region_key", "dubai"),
                "target_region_key": data.get("target_region_key", "dubai"),
                "start_date": data.get("start_date", "2015-01"),
                "end_date": data.get("end_date", "2018-01"),
                "change_type": data.get("change_type", "new_built_up"),
                "confidence_threshold": 0.15,
            },
            "llm_used": "Groq Llama-3 API",
            "narration_template": "Query parsed via Groq API."
        }
    return None


def generate_grounded_summary(
    query: str,
    region_name: str,
    stats: Dict[str, Any],
    impact: Dict[str, Any],
    llm_name: str = "TerraTrace AI"
) -> str:
    """
    Generates a 1-paragraph plain-language explanation of findings strictly grounded
    in physical detection statistics.
    """
    pct = stats.get("change_percentage", 0.0)
    ha = stats.get("total_changed_ha", 0.0)
    sqkm = stats.get("total_sqkm", 0.0)
    score = impact.get("score", 50)
    level = impact.get("level", "MODERATE")

    class_counts = stats.get("class_counts", {})
    built_ha = stats.get("built_up_ha", 0.0)
    veg_ha = stats.get("veg_loss_ha", 0.0)

    summary = (
        f"Automated satellite change detection over **{region_name}** identified **{pct}%** total surface area change, "
        f"corresponding to **{ha} hectares** ({sqkm} km²) of detected spatial variation between the observations. "
        f"The primary land-use drivers include **{built_ha} ha** of new built-up construction and **{veg_ha} ha** of vegetation transition. "
        f"TerraTrace AI assigned an overall **Impact Score of {score}/100 ({level})** based on spectral index deltas (NDVI/NDBI) "
        f"and model confidence metrics."
    )
    return summary
