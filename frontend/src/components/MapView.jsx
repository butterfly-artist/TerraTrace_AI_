import React, { useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Navigation, Crosshair } from 'lucide-react'

// ── Hyderabad, India ──────────────────────────────────────
const HYDERABAD_CENTER = [17.3850, 78.4867]
const DEFAULT_ZOOM = 12

// ── City coordinates for map fly-to ──────────────────────────
const CITY_COORDS = {
  abudhabi:  { lat: 24.47,  lon:  54.37,  zoom: 12 },
  beirut:    { lat: 33.89,  lon:  35.50,  zoom: 12 },
  dubai:     { lat: 25.20,  lon:  55.27,  zoom: 12 },
  lasvegas:  { lat: 36.17,  lon: -115.14, zoom: 12 },
  mumbai:    { lat: 19.08,  lon:  72.88,  zoom: 12 },
  saclay:    { lat: 48.72,  lon:   2.17,  zoom: 13 },
}

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

// ── Fly-to handler (must be inside MapContainer) ───────────────────
function FlyToRegion({ selectedRegion }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedRegion) return
    const city = CITY_COORDS[selectedRegion]
    if (city) {
      map.flyTo([city.lat, city.lon], city.zoom, { duration: 1.4 })
    }
  }, [selectedRegion, map])
  return null
}

// ── Map tools component (uses useMap hook) ────────────────
function MapControls({ onResetView, useGibsLayer, onToggleGibs }) {
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

      {/* NASA GIBS Toggle */}
      <button
        onClick={onToggleGibs}
        id="map-gibs-btn"
        className="flex items-center justify-center h-8 px-2 rounded-lg text-xs font-semibold transition-all duration-200"
        style={{
          background: useGibsLayer ? 'rgba(34,211,238,0.25)' : 'rgba(11,20,40,0.88)',
          border: useGibsLayer ? '1px solid #22d3ee' : '1px solid rgba(34,211,238,0.2)',
          color: useGibsLayer ? '#ffffff' : 'var(--color-terra)',
          backdropFilter: 'blur(8px)',
        }}
        title="Toggle NASA GIBS Near-Real-Time Basemap"
        aria-label="Toggle NASA GIBS Layer"
      >
        NASA GIBS
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
 * MapView — Leaflet map that flies to the selected OSCD region.
 */
export default function MapView({ selectedRegion, compareData }) {
  const [mapRef, setMapRef] = useState(null)
  const [useGibsLayer, setUseGibsLayer] = useState(false)

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
        {/* ── Base Tile Layer (OSM vs NASA GIBS) ────────── */}
        {useGibsLayer ? (
          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2024-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
            attribution='&copy; NASA EOSDIS GIBS'
            maxZoom={9}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        )}

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
                  TerraTrace AI Platform
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── Fly-to handler ────────────────────────── */}
        <FlyToRegion selectedRegion={selectedRegion} />

        {/* ── Custom controls ────────────────────────── */}
        <MapControls
          onResetView={resetView}
          useGibsLayer={useGibsLayer}
          onToggleGibs={() => setUseGibsLayer(prev => !prev)}
        />
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
        🛰 {useGibsLayer ? 'NASA GIBS Layer' : 'OpenStreetMap'} · TerraTrace AI
      </div>
    </div>
  )
}

