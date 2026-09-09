import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Eye, EyeOff, Activity, Maximize2, Minimize2, Columns, Sliders } from 'lucide-react'

export default function CompareSlider({
  beforePng,
  afterPng,
  maskPng,
  beforeLabel = 'Before',
  afterLabel  = 'After',
  stats       = {},
  regionName  = '',
  onClose,
  isMaximized = false,
  onToggleMaximize,
}) {
  const [sliderPos, setSliderPos]   = useState(50)   // 0-100%
  const [showMask, setShowMask]     = useState(true)
  const [maskOpacity, setMaskOpacity] = useState(0.85)
  const [layoutMode, setLayoutMode] = useState('swipe') // 'swipe' vs 'side-by-side'
  const [dragging, setDragging]     = useState(false)
  const containerRef                = useRef(null)

  // ── Drag logic ────────────────────────────────────────────
  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos  = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setSliderPos(pos)
  }, [])

  const handleMouseDown = (e) => {
    setDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = useCallback((e) => {
    if (dragging && layoutMode === 'swipe') updateSlider(e.clientX)
  }, [dragging, layoutMode, updateSlider])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  const handleTouchMove = useCallback((e) => {
    if (dragging && layoutMode === 'swipe') updateSlider(e.touches[0].clientX)
  }, [dragging, layoutMode, updateSlider])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',  handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend',  handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',  handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend',  handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove])

  const handleContainerClick = (e) => {
    if (!dragging && layoutMode === 'swipe') updateSlider(e.clientX)
  }

  const changePct  = stats.change_percentage ?? 0
  const changeColor = changePct >= 70 ? '#f87171' : changePct >= 40 ? '#fbbf24' : '#4ade80'

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100%',
        background:    'rgba(6,12,26,0.98)',
        borderTop:     '1px solid rgba(34,211,238,0.2)',
        boxShadow:     '0 -4px 30px rgba(0,0,0,0.8)',
      }}
    >
      {/* ── Header bar ──────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '6px 12px',
          borderBottom:   '1px solid rgba(34,211,238,0.12)',
          flexShrink:     0,
          background:     'rgba(11,20,40,0.85)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} style={{ color: 'var(--color-terra)' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
            {regionName} — Change Analysis
          </span>
          <span
            style={{
              fontSize:   '10px',
              fontWeight: 700,
              padding:    '2px 8px',
              borderRadius: '999px',
              background:  `${changeColor}20`,
              border:      `1px solid ${changeColor}50`,
              color:       changeColor,
            }}
          >
            {changePct}% Surface Change
          </span>
          {stats.total_changed_ha !== undefined && (
            <span className="text-[11px] text-cyan-300 font-mono hidden sm:inline">
              ({stats.total_changed_ha} ha)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mode Switcher: Swipe vs Side-by-Side */}
          <button
            onClick={() => setLayoutMode(m => m === 'swipe' ? 'side-by-side' : 'swipe')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.2)',
              color: 'var(--color-terra)',
            }}
            title="Switch between Swipe Slider and Side-by-Side view"
          >
            <Columns size={12} />
            {layoutMode === 'swipe' ? 'Side-by-Side' : 'Swipe Slider'}
          </button>

          {/* Toggle mask */}
          <button
            onClick={() => setShowMask(v => !v)}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '4px',
              padding:        '3px 8px',
              borderRadius:   '6px',
              fontSize:       '11px',
              fontWeight:     500,
              cursor:         'pointer',
              background:     showMask ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,238,0.08)',
              border:         `1px solid ${showMask ? 'rgba(248,113,113,0.3)' : 'rgba(34,211,238,0.15)'}`,
              color:          showMask ? '#f87171' : 'var(--color-text-secondary)',
            }}
          >
            {showMask ? <Eye size={12} /> : <EyeOff size={12} />}
            {showMask ? 'Mask On' : 'Mask Off'}
          </button>

          {/* Maximize / Minimize toggle */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              title={isMaximized ? 'Restore Split View' : 'Maximize Compare Workspace'}
              style={{
                display: 'flex', alignItems: 'center', justifyCenter: 'center',
                padding: '3px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
                color: 'var(--color-terra)', cursor: 'pointer',
              }}
            >
              {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Slider canvas ────────────────────────────────── */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{
          position:   'relative',
          flex:       1,
          overflow:   'hidden',
          cursor:     dragging ? 'ew-resize' : 'col-resize',
          userSelect: 'none',
          background: '#000',
        }}
      >
        {/* Before image — always full width underneath */}
        <img
          src={beforePng}
          alt={`Before (${beforeLabel})`}
          draggable={false}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            display:    'block',
          }}
        />

        {/* After image — clipped to show only the right portion */}
        <img
          src={afterPng}
          alt={`After (${afterLabel})`}
          draggable={false}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            clipPath:   `inset(0 0 0 ${sliderPos}%)`,
            display:    'block',
          }}
        />

        {/* Change mask — clipped identically to after image */}
        {showMask && maskPng && (
          <img
            src={maskPng}
            alt="Change mask"
            draggable={false}
            style={{
              position:  'absolute',
              inset:     0,
              width:     '100%',
              height:    '100%',
              objectFit: 'cover',
              clipPath:  `inset(0 0 0 ${sliderPos}%)`,
              display:   'block',
              mixBlendMode: 'normal',
            }}
          />
        )}

        {/* Divider line */}
        <div
          style={{
            position:    'absolute',
            top:         0,
            bottom:      0,
            left:        `${sliderPos}%`,
            width:       '2px',
            background:  'rgba(255,255,255,0.9)',
            boxShadow:   '0 0 8px rgba(34,211,238,0.8)',
            transform:   'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => { setDragging(true); e.preventDefault() }}
          style={{
            position:       'absolute',
            top:            '50%',
            left:           `${sliderPos}%`,
            transform:      'translate(-50%, -50%)',
            width:          '32px',
            height:         '32px',
            borderRadius:   '50%',
            background:     'rgba(6,12,26,0.92)',
            border:         '2px solid rgba(34,211,238,0.8)',
            boxShadow:      '0 0 12px rgba(34,211,238,0.5)',
            cursor:         'ew-resize',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         10,
            transition:     dragging ? 'none' : 'box-shadow 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.8)' }}
          onMouseLeave={e => { if (!dragging) e.currentTarget.style.boxShadow = '0 0 12px rgba(34,211,238,0.5)' }}
        >
          {/* ◁▷ arrows */}
          <span style={{ fontSize: '10px', color: 'var(--color-terra)', letterSpacing: '-2px', fontWeight: 700 }}>◁▷</span>
        </div>

        {/* Before label */}
        <span
          style={{
            position:   'absolute',
            top:        '8px',
            left:       '8px',
            fontSize:   '11px',
            fontWeight: 700,
            padding:    '2px 7px',
            borderRadius: '4px',
            background: 'rgba(6,12,26,0.82)',
            border:     '1px solid rgba(255,255,255,0.15)',
            color:      'rgba(255,255,255,0.85)',
            pointerEvents: 'none',
            letterSpacing: '0.04em',
          }}
        >
          {beforeLabel}
        </span>

        {/* After label */}
        <span
          style={{
            position:   'absolute',
            top:        '8px',
            right:      '8px',
            fontSize:   '11px',
            fontWeight: 700,
            padding:    '2px 7px',
            borderRadius: '4px',
            background: 'rgba(6,12,26,0.82)',
            border:     '1px solid rgba(34,211,238,0.3)',
            color:      'var(--color-terra)',
            pointerEvents: 'none',
            letterSpacing: '0.04em',
          }}
        >
          {afterLabel}
        </span>

        {/* Pixel stats bottom bar */}
        <div
          style={{
            position:   'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            padding:    '4px 10px',
            fontSize:   '10px',
            fontFamily: 'monospace',
            color:      'rgba(255,255,255,0.5)',
            background: 'rgba(2,4,10,0.7)',
            pointerEvents: 'none',
            display:    'flex',
            gap:        '16px',
          }}
        >
          <span>Changed: <strong style={{ color: changeColor }}>{(stats.changed_pixels ?? 0).toLocaleString()}</strong> px</span>
          <span>Total: {(stats.total_pixels ?? 0).toLocaleString()} px</span>
          <span>Threshold: {stats.threshold_used ?? 0.15}</span>
        </div>
      </div>
    </div>
  )
}
