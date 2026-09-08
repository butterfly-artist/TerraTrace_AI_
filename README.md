# 🛰 TerraTrace AI

> AI-powered satellite imagery search and change-detection platform.

---

## Architecture

```
terratrace-ai/
├── backend/          # FastAPI (Python 3.11)
├── frontend/         # React + Vite + Tailwind CSS + Leaflet
├── data/
│   └── demo/         # OSCD Sentinel-2 sample imagery (gitignored after download)
├── scripts/
│   └── download_oscd.py
├── docker-compose.yml
└── .env.example
```

## Quick Start

### 1 — Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.11 |
| Node.js | ≥ 18 |
| Docker + Compose | any recent |

### 2 — Environment

```bash
cp .env.example .env
# Edit .env with your API keys (not required for Phase 1 offline mode)
```

### 3 — Database (PostGIS)

```bash
docker compose up -d
# PostgreSQL 16 + PostGIS 3.4 → localhost:5432
```

### 4 — Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/api/v1/health  
Interactive docs: http://localhost:8000/docs

### 5 — Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 6 — Download OSCD Demo Data (optional, requires internet on first run)

```bash
cd scripts
pip install torchgeo   # if not already installed via backend requirements
python download_oscd.py --split train
# Downloads ~2 GB of Sentinel-2 imagery into data/demo/
```

---

## API Endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Service health check |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, react-leaflet |
| Backend | FastAPI, Uvicorn, SQLAlchemy (async) |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| ML | PyTorch, TorchGeo, Rasterio, GeoPandas |
| Data | OSCD (Onera Satellite Change Detection) dataset |

---

## Roadmap

- **Phase 1** ✅ — Monorepo scaffold, Leaflet map, health API, OSCD downloader
- **Phase 2** — Imagery ingestion pipeline (Rasterio), PostGIS storage
- **Phase 3** — Change-detection model (TorchGeo fine-tune)
- **Phase 4** — Copernicus / Sentinel Hub live search integration
- **Phase 5** — Gemini/Groq AI assistant for natural-language queries
