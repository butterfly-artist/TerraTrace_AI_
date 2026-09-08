import React, { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Navigation, Crosshair, Maximize2 } from 'lucide-react'

// ── Hyderabad, India ──────────────────────────────────────
const HYDERABAD_CENTER = [17.3850, 78.4867]
const DEFAULT_ZOOM = 12

// ── Custom satellite pin marker ───────────────────────────
const satelliteIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M16 2C10.48 2 6 6.48 6 12c0 7.25 10 22 10 22S26 19.25 26 12c0-5.52-4.48-10-10-10z"
            fill="#22d3ee" filter="url(#glow)" opacity="0.95"/>
      <circle cx="16" cy="12" r="5" fill="#02040a"/>
      <circle cx="16" cy="12" r="3" fill="#22d3ee"/>
    </svg>`),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

// ── Map tools component (uses useMap hook) ────────────────
function MapControls({ onResetView }) {
  const map = useMap()

  const handleLocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 1.5 }),
      () => {}
    )
  }

  return (
    <div
      className="absolute right-4 top-4 z-[1000] flex flex-col gap-2"
      style={{ pointerEvents: 'all' }}
    >
      {/* Reset to Hyderabad */}
      <button
        onClick={onResetView}
        id="map-reset-btn"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
        style={{
          background: 'rgba(11,20,40,0.88)',
          border: '1px solid rgba(34,211,238,0.2)',
          color: 'var(--color-terra)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,20,40,0.88)'; e.currentTarget.style.boxShadow = 'none' }}
        title="Reset to Hyderabad"
        aria-label="Reset map to Hyderabad"
      >
        <Crosshair size={14} />
      </button>

      {/* Locate me */}
      <button
        onClick={handleLocate}
        id="map-locate-btn"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
        style={{
          background: 'rgba(11,20,40,0.88)',
          border: '1px solid rgba(34,211,238,0.2)',
          color: 'var(--color-terra)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,20,40,0.88)'; e.currentTarget.style.boxShadow = 'none' }}
        title="Go to my location"
        aria-label="Go to my location"
      >
        <Navigation size={14} />
      </button>
    </div>
  )
}

// ── Coordinate display ────────────────────────────────────
function CoordDisplay() {
  const map = useMap()
  const [coords, setCoords] = useState(map.getCenter())

  React.useEffect(() => {
    const handler = () => setCoords(map.getCenter())
    map.on('moveend', handler)
    return () => map.off('moveend', handler)
  }, [map])

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-full font-mono text-xs"
      style={{
        background: 'rgba(6,12,26,0.85)',
        border: '1px solid rgba(34,211,238,0.15)',
        color: 'var(--color-text-secondary)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
      }}
    >
      <span style={{ color: 'var(--color-terra)' }}>⌖</span>
      {'  '}
      {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
    </div>
  )
}

/**
 * MapView — full-height Leaflet map centred on Hyderabad, India.
 * Uses OpenStreetMap tiles with a dark hue-rotate filter (applied in CSS).
 */
export default function MapView() {
  const [mapRef, setMapRef] = useState(null)

  const resetView = useCallback(() => {
    mapRef?.flyTo(HYDERABAD_CENTER, DEFAULT_ZOOM, { duration: 1.2 })
  }, [mapRef])

  return (
    <div className="relative flex-1 h-full">
      <MapContainer
        center={HYDERABAD_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="h-full w-full"
        ref={setMapRef}
        id="main-map"
      >
        {/* ── OSM Tile Layer ─────────────────────────── */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* ── Leaflet zoom (top-left) ────────────────── */}
        <ZoomControl position="topleft" />

        {/* ── Hyderabad marker ──────────────────────── */}
        <Marker position={HYDERABAD_CENTER} icon={satelliteIcon}>
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <div className="font-semibold mb-1" style={{ color: 'var(--color-terra)', fontSize: '13px' }}>
                📍 Hyderabad, India
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <div>17.3850°N, 78.4867°E</div>
                <div>Telangana State Capital</div>
                <div style={{ marginTop: '6px', color: 'var(--color-text-muted)' }}>
                  TerraTrace AI Phase 1 · Offline Mode
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── Custom controls ────────────────────────── */}
        <MapControls onResetView={resetView} />
        <CoordDisplay />
      </MapContainer>

      {/* ── Vignette overlay ──────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-[999]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(2,4,10,0.35) 100%)',
        }}
      />

      {/* ── Map info chip ─────────────────────────────── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1 rounded-full text-xs font-medium pointer-events-none"
        style={{
          background: 'rgba(6,12,26,0.85)',
          border: '1px solid rgba(34,211,238,0.15)',
          color: 'var(--color-text-secondary)',
          backdropFilter: 'blur(8px)',
        }}
      >
        🛰 OSM · Phase 1 Offline · Hyderabad, India
      </div>
    </div>
  )
}
