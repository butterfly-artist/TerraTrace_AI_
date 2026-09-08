import React, { useState, useCallback } from 'react'
import TopBar from '../components/TopBar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import MapView from '../components/MapView.jsx'
import CompareSlider from '../components/CompareSlider.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import EvidencePanel from '../components/EvidencePanel.jsx'
import TimelineScrubber from '../components/TimelineScrubber.jsx'
import ReportModal from '../components/ReportModal.jsx'

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [compareData, setCompareData] = useState(null)
  const [isComparing, setIsComparing] = useState(false)
  const [compareError, setCompareError] = useState(null)

  // Mode: 'demo' vs 'live'
  const [currentMode, setCurrentMode] = useState('demo')

  // Panel visibility toggles
  const [showChat, setShowChat] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Timeline year selections
  const [activeYearBefore, setActiveYearBefore] = useState('2015')
  const [activeYearAfter, setActiveYearAfter] = useState('2018')

  const fetchCompareData = useCallback(async (region, yearBefore = '2015', yearAfter = '2018') => {
    setIsComparing(true)
    setCompareError(null)

    try {
      const res = await fetch('/api/v1/change-detection/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          threshold: 0.15,
          year_before: yearBefore,
          year_after: yearAfter,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new Error(err.detail ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      setCompareData(data)
      setSelectedRegion(region)
    } catch (err) {
      setCompareError(err.message)
    } finally {
      setIsComparing(false)
    }
  }, [])

  const handleSelectRegion = useCallback((region) => {
    if (region === selectedRegion) {
      setSelectedRegion(null)
      setCompareData(null)
      setCompareError(null)
      setShowEvidence(false)
      return
    }
    fetchCompareData(region, activeYearBefore, activeYearAfter)
  }, [selectedRegion, activeYearBefore, activeYearAfter, fetchCompareData])

  const handleQueryResult = useCallback((data) => {
    if (data && data.region) {
      setSelectedRegion(data.region)
      setCompareData(data)
      setCompareError(null)
    }
  }, [])

  const handleTimelineChange = useCallback((yBefore, yAfter) => {
    setActiveYearBefore(yBefore)
    setActiveYearAfter(yAfter)
    if (selectedRegion) {
      fetchCompareData(selectedRegion, yBefore, yAfter)
    }
  }, [selectedRegion, fetchCompareData])

  const handleCloseCompare = useCallback(() => {
    setSelectedRegion(null)
    setCompareData(null)
    setCompareError(null)
    setShowEvidence(false)
  }, [])

  const toggleMode = useCallback(() => {
    setCurrentMode(prev => (prev === 'demo' ? 'live' : 'demo'))
  }, [])

  const showPanel = selectedRegion !== null

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}
    >
      {/* ── Top navigation bar ─────────────────────────────── */}
      <TopBar
        currentMode={currentMode}
        onToggleMode={toggleMode}
        showChat={showChat}
        onToggleChat={() => setShowChat(v => !v)}
        showEvidence={showEvidence}
        onToggleEvidence={() => setShowEvidence(v => !v)}
        onOpenReportModal={() => setShowReportModal(true)}
        hasCompareData={compareData !== null}
      />

      {/* ── Content area ───────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Scene Browser Sidebar */}
        <Sidebar
          selectedRegion={selectedRegion}
          onSelectRegion={handleSelectRegion}
          isComparing={isComparing}
        />

        {/* Center / Right Column: Map + Compare Panel */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {/* Timeline Scrubber floating overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <TimelineScrubber
              activeYearBefore={activeYearBefore}
              activeYearAfter={activeYearAfter}
              onSelectYears={handleTimelineChange}
            />
          </div>

          {/* Map View */}
          <div style={{ flex: showPanel ? '1 1 0%' : '1 1 auto', minHeight: 0, position: 'relative' }}>
            <MapView selectedRegion={selectedRegion} compareData={compareData} />
          </div>

          {/* Compare panel — slides in from bottom */}
          {showPanel && (
            <div style={{ height: '240px', flexShrink: 0, overflow: 'hidden' }}>
              {isComparing ? (
                <LoadingPanel regionName={selectedRegion} />
              ) : compareError ? (
                <ErrorPanel message={compareError} onClose={handleCloseCompare} />
              ) : compareData ? (
                <CompareSlider
                  beforePng={compareData.before_png}
                  afterPng={compareData.after_png}
                  maskPng={compareData.mask_png}
                  beforeLabel={compareData.before_label}
                  afterLabel={compareData.after_label}
                  stats={compareData.stats}
                  regionName={compareData.name}
                  onClose={handleCloseCompare}
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Right Drawer 1: AI Chat Assistant */}
        {showChat && (
          <div className="w-[340px] flex-shrink-0 h-full z-[1050]">
            <ChatPanel
              currentMode={currentMode}
              onExecuteQueryResult={handleQueryResult}
            />
          </div>
        )}

        {/* Right Drawer 2: Evidence Dashboard */}
        {showEvidence && compareData && (
          <div className="w-[320px] flex-shrink-0 h-full z-[1050]">
            <EvidencePanel
              stats={compareData.stats}
              impact={compareData.impact}
              evidence={compareData.evidence}
              regionName={compareData.name}
              onClose={() => setShowEvidence(false)}
            />
          </div>
        )}
      </main>

      {/* Report Modal */}
      {showReportModal && compareData && (
        <ReportModal
          region={selectedRegion}
          compareData={compareData}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  )
}

function LoadingPanel({ regionName }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'rgba(6,12,26,0.97)',
        borderTop: '1px solid rgba(34,211,238,0.15)',
        gap: '10px',
        color: 'var(--color-text-secondary)',
        fontSize: '13px',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="rgba(34,211,238,0.25)" strokeWidth="3" fill="none" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      Loading imagery & executing ML detection for <strong style={{ color: 'var(--color-terra)' }}>{regionName}</strong>…
    </div>
  )
}

function ErrorPanel({ message, onClose }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '0 20px',
        background: 'rgba(6,12,26,0.97)',
        borderTop: '1px solid rgba(248,113,113,0.3)',
        gap: '12px',
      }}
    >
      <div>
        <p style={{ color: '#f87171', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
          ⚠ Could not load imagery
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: '5px 12px',
          borderRadius: '6px',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.25)',
          color: '#f87171',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
