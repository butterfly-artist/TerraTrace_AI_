import React, { useState } from 'react'
import {
  Search, SlidersHorizontal, Database, ImageIcon,
  ChevronRight, Calendar, Percent, MapPin, X, Layers
} from 'lucide-react'

// ── OSCD demo scenes (static for Phase 1) ──────────────────
const DEMO_SCENES = [
  {
    id: 'abudhabi-2015-2018',
    name: 'Abu Dhabi',
    location: 'UAE',
    dates: ['2015-01', '2018-01'],
    cloudCover: 2,
    changeScore: 78,
    source: 'OSCD',
    bands: 13,
  },
  {
    id: 'beirut-2015-2018',
    name: 'Beirut',
    location: 'Lebanon',
    dates: ['2015-03', '2018-03'],
    cloudCover: 8,
    changeScore: 42,
    source: 'OSCD',
    bands: 13,
  },
  {
    id: 'dubai-2015-2018',
    name: 'Dubai',
    location: 'UAE',
    dates: ['2015-02', '2018-02'],
    cloudCover: 0,
    changeScore: 91,
    source: 'OSCD',
    bands: 13,
  },
  {
    id: 'lasvegas-2015-2018',
    name: 'Las Vegas',
    location: 'Nevada, USA',
    dates: ['2015-04', '2018-04'],
    cloudCover: 1,
    changeScore: 55,
    source: 'OSCD',
    bands: 13,
  },
  {
    id: 'mumbai-2015-2018',
    name: 'Mumbai',
    location: 'India',
    dates: ['2015-01', '2018-01'],
    cloudCover: 14,
    changeScore: 38,
    source: 'OSCD',
    bands: 13,
  },
  {
    id: 'saclay-2015-2018',
    name: 'Saclay',
    location: 'France',
    dates: ['2015-06', '2018-06'],
    cloudCover: 5,
    changeScore: 63,
    source: 'OSCD',
    bands: 13,
  },
]

function SceneCard({ scene, selected, onClick }) {
  const changeColor =
    scene.changeScore >= 70
      ? 'var(--color-change-red)'
      : scene.changeScore >= 40
      ? '#fbbf24'
      : 'var(--color-sat-green)'

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3 transition-all duration-200 glass-hover"
      style={{
        background: selected ? 'rgba(34,211,238,0.08)' : 'rgba(11,20,40,0.5)',
        border: `1px solid ${selected ? 'rgba(34,211,238,0.35)' : 'rgba(34,211,238,0.08)'}`,
        boxShadow: selected ? 'var(--shadow-glow)' : 'none',
      }}
      aria-pressed={selected}
      id={`scene-card-${scene.id}`}
    >
      {/* Row 1 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <ImageIcon size={11} style={{ color: 'var(--color-terra)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {scene.name}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={9} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{scene.location}</span>
          </div>
        </div>

        {/* Change score badge */}
        <div
          className="flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{
            background: `${changeColor}15`,
            border: `1px solid ${changeColor}30`,
          }}
        >
          <span className="text-sm font-bold" style={{ color: changeColor, lineHeight: 1 }}>
            {scene.changeScore}
          </span>
          <span className="text-[9px] font-medium" style={{ color: changeColor, opacity: 0.8 }}>%Δ</span>
        </div>
      </div>

      {/* Row 2: metadata pills */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
          style={{ background: 'rgba(34,211,238,0.06)', color: 'var(--color-text-secondary)' }}
        >
          <Calendar size={9} />
          {scene.dates[0]} → {scene.dates[1]}
        </span>
        <span
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
          style={{ background: 'rgba(34,211,238,0.06)', color: 'var(--color-text-secondary)' }}
        >
          ☁ {scene.cloudCover}%
        </span>
        <span
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
          style={{ background: 'rgba(34,211,238,0.06)', color: 'var(--color-text-secondary)' }}
        >
          {scene.bands}B
        </span>
      </div>
    </button>
  )
}

/**
 * Sidebar — glass panel with search, filters, and OSCD scene list.
 */
export default function Sidebar() {
  const [query, setQuery] = useState('')
  const [selectedScene, setSelectedScene] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [maxCloud, setMaxCloud] = useState(20)

  const filtered = DEMO_SCENES.filter(s => {
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.location.toLowerCase().includes(query.toLowerCase())
    const matchesCloud = s.cloudCover <= maxCloud
    return matchesQuery && matchesCloud
  })

  return (
    <aside
      className="flex flex-col h-full animate-slide-in"
      style={{
        width: '300px',
        minWidth: '280px',
        background: 'rgba(6,12,26,0.88)',
        borderRight: '1px solid rgba(34,211,238,0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(34,211,238,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database size={14} style={{ color: 'var(--color-terra)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Scene Browser
            </h2>
          </div>
          <span className="badge badge-terra">{filtered.length} scenes</span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            id="scene-search"
            type="text"
            className="input-terra"
            placeholder="Search scenes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: '2rem' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 w-full"
          style={{ color: showFilters ? 'var(--color-terra)' : 'var(--color-text-muted)' }}
          aria-expanded={showFilters}
          id="filter-toggle"
        >
          <SlidersHorizontal size={11} />
          Filters
          <ChevronRight
            size={11}
            style={{
              transform: showFilters ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {/* Filters panel */}
        {showFilters && (
          <div
            className="mt-2 p-3 rounded-lg animate-fade-in"
            style={{ background: 'rgba(6,12,26,0.6)', border: '1px solid rgba(34,211,238,0.1)' }}
          >
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Max cloud cover: <span style={{ color: 'var(--color-terra)' }}>{maxCloud}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={maxCloud}
              onChange={e => setMaxCloud(Number(e.target.value))}
              className="w-full mt-1.5"
              id="cloud-cover-filter"
              style={{ accentColor: 'var(--color-terra)' }}
            />
          </div>
        )}
      </div>

      {/* ── Scene list ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            <Layers size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No scenes match your filters.</p>
          </div>
        ) : (
          filtered.map(scene => (
            <SceneCard
              key={scene.id}
              scene={scene}
              selected={selectedScene === scene.id}
              onClick={() => setSelectedScene(scene.id === selectedScene ? null : scene.id)}
            />
          ))
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid rgba(34,211,238,0.08)', background: 'rgba(2,4,10,0.5)' }}
      >
        <div className="flex items-center gap-2">
          <span className="badge badge-green">OSCD</span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Onera Satellite Change Detection
          </span>
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Sentinel-2 multispectral · 13 bands · 10–60 m/px
        </p>
      </div>
    </aside>
  )
}
