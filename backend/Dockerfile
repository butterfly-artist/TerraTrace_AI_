# TerraTrace AI — Backend Dockerfile
# Python 3.11 slim image with geospatial system libraries

FROM python:3.11-slim

# ── System deps (GDAL/Rasterio, PostGIS client, build tools) ─
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── App user ──────────────────────────────────────────────────
RUN useradd --create-home appuser
WORKDIR /app
USER appuser

# ── Python deps ───────────────────────────────────────────────
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── App source ────────────────────────────────────────────────
COPY --chown=appuser:appuser . .

# ── Health check ──────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# ── Runtime ───────────────────────────────────────────────────
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
