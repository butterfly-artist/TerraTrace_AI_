import React, { useState, useEffect } from 'react'
import { Satellite, Globe, Layers, Sparkles, Activity, FileText, Wifi, WifiOff } from 'lucide-react'

export default function TopBar({
  currentMode,
  onToggleMode,
  showChat,
  onToggleChat,
  showEvidence,
  onToggleEvidence,
  onOpenReportModal,
  hasCompareData,
}) {
  const [apiStatus, setApiStatus] = useState('checking')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/health', { signal: AbortSignal.timeout(3000) })
        setApiStatus(res.ok ? 'ok' : 'error')
      } catch {
        setApiStatus('error')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30_000)
    return () => clearInterval(interval)
  }, [])

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
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg glow-terra"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(129,140,248,0.2) 100%)', border: '1px solid rgba(34,211,238,0.3)' }}
        >
          <Satellite size={16} style={{ color: 'var(--color-terra)' }} />
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-bold text-lg tracking-tight gradient-text">
            TerraTrace
          </span>
          <span className="font-light text-lg" style={{ color: 'var(--color-terra)' }}>AI</span>
          <span className="hidden sm:inline text-xs font-mono ml-1" style={{ color: 'var(--color-text-muted)' }}>
            v1.0.0
          </span>
        </div>

        {/* Demo vs Live mode toggle */}
        <button
          onClick={onToggleMode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
          style={{
            background: currentMode === 'live' ? 'rgba(59,130,246,0.15)' : 'rgba(34,211,238,0.1)',
            border: `1px solid ${currentMode === 'live' ? 'rgba(59,130,246,0.4)' : 'rgba(34,211,238,0.25)'}`,
            color: currentMode === 'live' ? '#60A5FA' : 'var(--color-terra)',
          }}
          title="Click to toggle between Demo Mode (OSCD) and Live Mode (Copernicus)"
        >
          <Wifi size={11} />
          {currentMode === 'live' ? 'Live Mode' : 'Demo Mode'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* AI Query Assistant */}
        <button
          onClick={onToggleChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: showChat ? 'rgba(34,211,238,0.2)' : 'rgba(15,23,42,0.6)',
            border: `1px solid ${showChat ? 'var(--color-terra)' : 'rgba(34,211,238,0.15)'}`,
            color: showChat ? 'var(--color-terra)' : 'var(--color-text-secondary)',
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--color-terra)' }} />
          <span>AI Assistant</span>
        </button>

        {/* Evidence Dashboard */}
        <button
          onClick={onToggleEvidence}
          disabled={!hasCompareData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: showEvidence ? 'rgba(34,211,238,0.2)' : 'rgba(15,23,42,0.6)',
            border: `1px solid ${showEvidence ? 'var(--color-terra)' : 'rgba(34,211,238,0.15)'}`,
            color: hasCompareData ? (showEvidence ? 'var(--color-terra)' : 'var(--color-text-secondary)') : 'gray',
            opacity: hasCompareData ? 1 : 0.5,
            cursor: hasCompareData ? 'pointer' : 'not-allowed',
          }}
        >
          <Activity size={13} />
          <span>Evidence Mode</span>
        </button>

        {/* Generate Report */}
        <button
          onClick={onOpenReportModal}
          disabled={!hasCompareData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-glow"
          style={{
            background: hasCompareData ? 'var(--color-terra)' : 'rgba(34,211,238,0.2)',
            color: hasCompareData ? '#02040a' : 'var(--color-text-muted)',
            opacity: hasCompareData ? 1 : 0.5,
            cursor: hasCompareData ? 'pointer' : 'not-allowed',
          }}
        >
          <FileText size={13} />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Right UTC clock + API status */}
      <div className="flex items-center gap-3">
        <span className="hidden lg:block font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {timeStr}
        </span>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: apiStatus === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${apiStatus === 'ok' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}
        >
          <span className="status-dot" />
          <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--color-sat-green)' }}>
            API OK
          </span>
        </div>
      </div>
    </header>
  )
}
