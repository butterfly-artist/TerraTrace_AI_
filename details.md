# TerraTrace AI — Antigravity Build Prompt (SIH 2026, PS227)

This is written to be pasted directly into Google Antigravity's agent chat, phase by phase. Antigravity works best when you give it one phase at a time and let it finish, verify, and report back before you paste the next one — don't dump all phases in a single message.

---

## 0. Get these free API keys before you open Antigravity

| Service | What it's for | Where to get it | Notes |
|---|---|---|---|
| **Copernicus Data Space Ecosystem** | Live Sentinel-2 satellite imagery | dataspace.copernicus.eu → register → create an OAuth client (client_id + client_secret) | Free tier includes a generous monthly processing/transfer allowance — enough for a hackathon demo. No credit card. |
| **Google AI Studio (Gemini API)** | Chatbot / query parsing / report-writing LLM | aistudio.google.com/apikey → sign in with Google account → Create API Key | Free tier, no credit card, rate-limited — fine for a demo. |
| **Groq API** | Fast, free LLM inference — good as a second/offline-friendly option | console.groq.com → sign up → API Keys → Create | No credit card. Useful as a fallback if Gemini rate-limits during rehearsal. |
| **Hugging Face** | Download Prithvi-EO-2.0 weights | huggingface.co/settings/tokens | Free account token, needed to pull the model. |
| **OSCD dataset (Onera Satellite Change Detection)** | Offline/demo-mode bi-temporal image pairs, no live API needed | Search "OSCD dataset Zenodo" — direct download | No key required at all. This is your safety net if the Copernicus API is slow or down during judging. |
| **MapTiler (optional)** | Nicer basemap tiles than default OpenStreetMap | maptiler.com → free tier API key | Skip this entirely if you want zero extra setup — plain Leaflet + OpenStreetMap needs no key. |
| **NASA API key** | **Now required** — the updated proposal adds GIBS, POWER, and FIRMS | api.nasa.gov → "Generate API Key" → fill form → key emailed instantly | Free, no credit card. `DEMO_KEY` works for early testing (30 req/hr, 50/day) but swap in a registered key (1,000 req/hr) before rehearsal. Note: GIBS and EONET-style tile layers don't actually need a key at all — only POWER and FIRMS calls require it. |
| **Web Speech API (voice search)** | Required for voice input, needs no signup | Built into the browser (Chrome/Edge) via the `SpeechRecognition` JS API | No key, no account — it's a browser API, not a paid service. Just needs HTTPS or localhost to work. |

Put all of these in a single `.env` file before you start — Antigravity will ask for them by name if you set up the project correctly in Phase 1.

---

## Phase 1 — Project scaffold + demo-mode safety net

Paste this into Antigravity:

```
Build the initial scaffold for a project called TerraTrace AI: an AI-powered
satellite imagery search and change-detection platform.

Tech stack:
- Frontend: React + Tailwind CSS, Leaflet for the map
- Backend: Python + FastAPI
- Database: PostgreSQL with PostGIS extension
- ML: PyTorch, TorchGeo, Rasterio, GeoPandas

Set up:
1. A monorepo with /frontend and /backend folders
2. FastAPI backend with a health-check endpoint
3. React frontend with a basic Leaflet map centered on Hyderabad, India
4. A .env.example file listing these keys: COPERNICUS_CLIENT_ID,
   COPERNICUS_CLIENT_SECRET, GEMINI_API_KEY, GROQ_API_KEY, HF_TOKEN,
   NASA_API_KEY
5. A /data/demo folder and a script to download the OSCD change-detection
   dataset from Zenodo into it, so the app has offline sample imagery
   that works with no internet or API calls
6. Docker Compose file for Postgres+PostGIS locally

Do not connect to any live satellite API yet. This phase should run
completely offline using the OSCD demo data. Verify the app builds and
the map renders before finishing.
```

---

## Phase 2 — Before/after comparison + basic change map

```
Using the OSCD demo dataset already downloaded, build the core
before/after comparison pipeline:

1. Backend endpoint that takes two image paths (before, after) from the
   OSCD dataset and returns a simple change mask using image differencing
   and thresholding (this is the placeholder — do not train a new model
   yet)
2. Frontend: a before/after image slider component showing the two dates
   side by side, with the change mask overlaid
3. Wire this into the Leaflet map so selecting a demo region shows its
   before/after pair

Keep this simple and reliable — this is the part of the demo that must
never fail on stage. Confirm it works end-to-end before moving on.
```

---

## Phase 2B — Cloud & shadow preprocessing (Sentinel-2 SCL)

```
Add an atmospheric preprocessing step that runs before any change
detection, using the Sentinel-2 Scene Classification Layer (SCL band):

1. Backend function that reads the SCL band for a given scene and masks
   out pixels classified as cloud, cloud shadow, cirrus, or snow
2. Compute and store a "usable pixel %" / cloud-cover % for each scene —
   this number will later feed the Evidence Panel (Phase 6)
3. If cloud cover for a scene exceeds a threshold (e.g. 40%), flag it in
   the API response so the frontend can warn the user the result may be
   unreliable, rather than silently returning a degraded detection
4. Apply this masking to the OSCD demo pairs too, even though they're
   already fairly clean, so the same code path is exercised in Demo Mode

This must run before Phase 3's change detection, not after — masked
pixels should be excluded from the model input, not just from display.
```

---

## Phase 3 — Real change-detection model

```
Replace the placeholder differencing logic with a real change-detection
model. The target architecture is ChangeViT or an FC-Siamese network
(bi-temporal Siamese CNN), per the project proposal — but for hackathon
timelines, use whichever of these has a working pretrained checkpoint
available first:

1. First choice: a pretrained FC-Siamese or ChangeViT checkpoint if one
   is publicly available (check Hugging Face / the model's official repo)
2. Fallback if no usable pretrained checkpoint exists in time: the
   TorchGeo change-detection tutorial model (docs.torchgeo.org/en/latest/
   tutorials/change_detection.html) — do not train either architecture
   from scratch under hackathon time constraints
3. Run inference on the SCL-masked OSCD demo pairs from Phase 2B,
   replacing the threshold-based mask with the model's output
4. Add a change classification step that labels the detected change as
   one of: new built-up area, vegetation loss, road expansion, water-body
   change
5. Add an endpoint that returns affected area (in hectares or sq. km)
   calculated from the change mask using GeoPandas/Shapely

Keep the Phase 2 differencing method in the code as a documented fallback
in case the model fails to load during the demo. Clearly log which
model (ChangeViT/FC-Siamese vs. TorchGeo fallback vs. differencing) is
active, so it's visible during debugging and rehearsal.
```

---

## Phase 3B — Spectral indices (NDVI, NDWI, NDBI)

```
Add automated spectral index calculation from the Sentinel-2 multispectral
bands, independent of the change-detection model:

1. Backend functions for:
   - NDVI = (NIR − Red) / (NIR + Red)
   - NDWI = (Green − NIR) / (Green + NIR)
   - NDBI = (SWIR − NIR) / (SWIR + NIR)
2. Compute all three for both the "before" and "after" scene in any
   comparison, plus the delta between them
3. Store per-scene index values so they can be plotted as a time series
   later (Phase 6) and queried by the Geo-Copilot (Phase 4)
4. Expose an endpoint get_spectral_history(location, date_range) that
   returns NDVI/NDWI/NDBI values across all available dates for a region

These indices are independent evidence, not the change-detection model's
output — keep them as a separate, clearly-labeled signal in the API
response rather than merging them into the model's confidence score.
```

---

## Phase 4 — Geo-Copilot: RAG + tool-calling chatbot

```
Add the natural-language "Geo-Copilot" interface:

1. Backend endpoint that accepts a free-text query (e.g. "find areas near
   Hyderabad where new construction occurred between 2022 and 2026") and
   uses the Gemini API (GEMINI_API_KEY from .env) to extract structured
   parameters: location, start_date, end_date, change_type
2. Context ingestion (the "RAG" part): before the LLM answers, inject the
   current active bounding box, the relevant PostGIS query results, and
   the NDVI/NDWI/NDBI values from Phase 3B directly into its context —
   this is retrieval of our own structured data, not a general document
   search, so keep it simple (no vector DB needed for this part)
3. Give the LLM function-calling access to these named backend tools:
   - search_scenes(location, date_range)
   - run_change_detection(scene_before, scene_after)
   - get_spectral_history(location, date_range)  [from Phase 3B]
   - fetch_nasa_power_data(location, date_range)  [from Phase 5B]
   - generate_pdf_report(result_id)  [from Phase 6]
   The LLM's job is to decide which tools to call and narrate the
   results — it must never invent scene data, index values, or a
   confidence score itself
4. Add a fallback path using the Groq API with the same tool-calling
   pattern, in case Gemini is rate-limited during rehearsal or judging
5. Frontend: a chat panel where the user types (or speaks) a query, sees
   the parsed intent confirmed back to them, then sees the map update
6. Voice input: wire up the browser's Web Speech API (SpeechRecognition)
   to a microphone button next to the chat input — transcribed speech
   feeds into the same text pipeline as typed queries, no separate logic
   needed. Test that it degrades gracefully (falls back to text-only)
   in browsers that don't support it.
7. After a result is returned, have the LLM generate a one-paragraph
   plain-language explanation of the finding (change type, affected area,
   confidence) — grounded in the structured numbers passed to it, never
   invented

Verify the full loop: type or speak a query → see parsed intent → see
map update → see the AI-written explanation.
```

---

## Phase 5 — Live Sentinel-2 integration (optional, only if time allows)

```
Add an optional live-data path alongside the offline demo mode:

1. Backend integration with the Copernicus Data Space Ecosystem OAuth API
   (COPERNICUS_CLIENT_ID / COPERNICUS_CLIENT_SECRET) to search and fetch
   Sentinel-2 scenes for a given location and date range
2. A toggle in the UI: "Demo Mode" (uses cached OSCD data, always works)
   vs "Live Mode" (fetches real Sentinel-2 imagery, may be slower)
3. Live Mode should gracefully fall back to Demo Mode with a visible
   message if the API call fails or times out

Default the app to Demo Mode. Live Mode is a bonus feature to show
judges the pipeline generalizes beyond the cached dataset — it should
never be the thing you rely on during the actual demo.
```

---

## Phase 5B — NASA GIBS / POWER / FIRMS integration (optional, only if time allows)

```
Add the NASA API suite as supplementary context layers — these enrich
the analysis but are not the core detection, so treat this whole phase
as skippable if time runs short:

1. NASA GIBS: add it as an optional background/basemap tile layer in
   Leaflet (no API key needed for GIBS tiles) so judges can see a
   near-real-time global imagery layer alongside your own results
2. NASA POWER API (needs NASA_API_KEY): implement
   fetch_nasa_power_data(location, date_range) returning surface
   temperature, solar radiation, and precipitation for the region —
   display this next to the NDVI/NDBI time series so climate context
   sits alongside vegetation/built-up trends, clearly labeled as
   correlation context, not a causal claim
3. NASA FIRMS (needs NASA_API_KEY): fetch active thermal-anomaly points
   for the region and date range, and overlay them as markers on the
   change mask when relevant (e.g. a "vegetation loss" detection near
   active fire points is a meaningful correlation to surface)
4. All three should fail silently and independently — if FIRMS is down
   or rate-limited, POWER and GIBS should still work, and the core
   change-detection flow must not depend on any of them

Wire each of these into the Geo-Copilot's tool list from Phase 4 so the
chatbot can call fetch_nasa_power_data on request, but confirm the core
demo flow (query → detection → explanation) still works with this phase
disabled entirely.
```

---

## Phase 6 — Dashboard polish + evidence + charts + report

```
Finish the analyst-facing dashboard:

1. Multi-year timeline component (e.g. 2022 → 2023 → 2024 → 2025 → 2026)
   that lets the user scrub through available dates for a region
2. Time-series charts using Recharts: plot NDVI, NDWI, NDBI (from
   Phase 3B), and total affected area (m²) over the available dates for
   the selected region
3. Spectral Trend Predictor: apply simple linear regression on the
   historical NDVI/NDBI time series to project the trend 12-24 months
   forward. Label this clearly in the UI as "projected trend, not a
   guarantee" — it's a statistical extrapolation, not a validated
   forecasting model, and should never be presented as equivalent in
   confidence to the actual change-detection output
4. An "Evidence Panel" showing the measurable indicators behind a
   detection: spectral index deltas (Phase 3B), cloud-cover % and
   flagged-scene warnings (Phase 2B), and model confidence — never an
   invented confidence percentage
5. A single combined "Impact Score" per region (affected area + change
   class weighting + model confidence) shown prominently
6. A "Generate Report" button that produces an actual downloadable PDF
   (use a Python library such as WeasyPrint or ReportLab on the backend,
   not just an on-screen summary) containing: map snapshot, dates,
   coordinates, change type, affected area, spectral shift graphs,
   confidence score, and the AI-written explanation from Phase 4. Wire
   this to the generate_pdf_report(result_id) tool the Geo-Copilot can
   call directly from the chat
7. Run a full rehearsal of the 5-7 minute demo flow: query (typed or
   voice) → results → before/after → spectral charts → evidence →
   timeline → PDF report. Fix anything that breaks this specific
   sequence first — this is what gets judged.
```

---

## Guardrails to repeat in any custom prompt you write yourself

- Never let the LLM be the change detector — it parses queries and narrates results, the vision model does the detection.
- Never let it invent a confidence number — confidence must come from the model/statistics, not the LLM's guess.
- Always keep Demo Mode (cached OSCD data) as the default and the thing you present live — live API calls are a bonus, not the backbone.
- Ask Antigravity to verify/run each phase before moving to the next one — don't stack unverified phases.
- NASA GIBS/POWER/FIRMS (Phase 5B) are supplementary context, not core evidence — the change-detection result must stand on its own without them.
- The Spectral Trend Predictor (Phase 6) is a simple linear projection, not a validated forecast — never let it be phrased or displayed as a confident prediction.
- If judges ask "is this real satellite data," Demo Mode should honestly be described as cached OSCD data — don't imply it's a live feed when it isn't.