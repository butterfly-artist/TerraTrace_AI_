import React, { useState, useEffect } from 'react'
import { Satellite, Globe, Layers, Bell, ChevronDown, Wifi, WifiOff } from 'lucide-react'

/**
 * TopBar — branding, nav, and status indicators.
 * Fixed at the top of the viewport above the map.
 */
export default function TopBar() {
  const [apiStatus, setApiStatus] = useState('checking') // 'ok' | 'error' | 'checking'
  const [currentTime, setCurrentTime] = useState(new Date())

  // ── Poll health endpoint ──────────────────────────────────
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/v1/health', { signal: AbortSignal.timeout(3000) })
        setApiStatus(res.ok ? 'ok' : 'error')
      } catch {
        setApiStatus('error')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30_000)
    return () => clearInterval(interval)
  }, [])

  // ── Live clock ────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = currentTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  return (
    <header
      className="relative z-50 flex items-center justify-between px-4 py-2 scanline"
      style={{
        background: 'linear-gradient(180deg, rgba(2,4,10,0.98) 0%, rgba(6,12,26,0.95) 100%)',
        borderBottom: '1px solid rgba(34,211,238,0.15)',
        boxShadow: '0 1px 20px rgba(0,0,0,0.6)',
        height: '52px',
      }}
    >
      {/* ── Brand ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Logo icon */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg glow-terra"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(129,140,248,0.2) 100%)', border: '1px solid rgba(34,211,238,0.3)' }}
        >
          <Satellite size={16} className="text-terra-400" style={{ color: 'var(--color-terra)' }} />
        </div>

        {/* Name + tagline */}
        <div className="flex items-baseline gap-2">
          <span
            className="font-bold text-lg tracking-tight gradient-text"
            style={{ letterSpacing: '-0.02em' }}
          >
            TerraTrace
          </span>
          <span className="font-light text-lg" style={{ color: 'var(--color-terra)' }}>AI</span>
          <span
            className="hidden sm:inline text-xs font-mono ml-1"
            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            v0.1.0
          </span>
        </div>

        {/* Phase badge */}
        <span className="badge badge-terra hidden md:inline-flex">Phase 1 · Offline</span>
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { icon: Globe, label: 'Explorer', active: true },
          { icon: Layers, label: 'Datasets', active: false },
          { icon: Satellite, label: 'Analysis', active: false },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
            style={{
              background: active ? 'rgba(34,211,238,0.1)' : 'transparent',
              color: active ? 'var(--color-terra)' : 'var(--color-text-secondary)',
              border: active ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Right: status + time ──────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* UTC Clock */}
        <span
          className="hidden lg:block font-mono text-xs"
          style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}
        >
          {timeStr}
        </span>

        {/* API status */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: apiStatus === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${apiStatus === 'ok' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}
          title={apiStatus === 'ok' ? 'API online' : apiStatus === 'error' ? 'API offline' : 'Checking API…'}
        >
          {apiStatus === 'ok' ? (
            <>
              <span className="status-dot" />
              <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--color-sat-green)' }}>API</span>
            </>
          ) : apiStatus === 'error' ? (
            <>
              <WifiOff size={11} style={{ color: 'var(--color-change-red)' }} />
              <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--color-change-red)' }}>Offline</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-medium hidden sm:block text-yellow-400">…</span>
            </>
          )}
        </div>

        {/* Notification bell */}
        <button
          className="p-1.5 rounded-md transition-all duration-200"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-terra)'; e.currentTarget.style.background = 'rgba(34,211,238,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent' }}
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>
      </div>
    </header>
  )
}
