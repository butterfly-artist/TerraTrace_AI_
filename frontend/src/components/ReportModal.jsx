import React, { useState } from 'react'
import { FileText, Download, X, Check, Loader2, Sparkles, MapPin, Calendar, Layers } from 'lucide-react'

export default function ReportModal({ region, compareData, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false)

  if (!compareData) return null

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch('/api/v1/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: compareData.region,
          year_before: compareData.before_label,
          year_after: compareData.after_label,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TerraTrace_Report_${compareData.region}_${compareData.before_label}_${compareData.after_label}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Report download error: ${err.message}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const stats = compareData.stats || {}
  const impact = compareData.impact || {}

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col"
        style={{
          background: 'rgba(6,12,26,0.98)',
          border: '1px solid rgba(34,211,238,0.25)',
          color: 'var(--color-text-primary)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(34,211,238,0.12)', background: 'rgba(34,211,238,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            <FileText size={18} style={{ color: 'var(--color-terra)' }} />
            <div>
              <h2 className="text-sm font-semibold text-white">Geospatial Change Report</h2>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                SIH 2026 PS227 · TerraTrace Intelligence Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Metadata Card */}
          <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(34,211,238,0.1)' }}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <MapPin size={15} style={{ color: 'var(--color-terra)' }} />
                {compareData.name}, {compareData.location}
              </span>
              <span className="badge badge-terra">{compareData.before_label} → {compareData.after_label}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Coordinates: {compareData.lat}°N, {compareData.lon}°E | Platform: Sentinel-2 Multispectral
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Impact Score</div>
              <div className="text-xl font-bold text-cyan-400">{impact.score || 50}/100</div>
              <div className="text-[9px] text-slate-500 font-mono">{impact.level || 'MODERATE'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Total Affected Area</div>
              <div className="text-xl font-bold text-amber-400">{stats.total_changed_ha || 0} ha</div>
              <div className="text-[9px] text-slate-500 font-mono">{stats.total_sqkm || 0} km²</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Change Percentage</div>
              <div className="text-xl font-bold text-red-400">{stats.change_percentage || 0}%</div>
              <div className="text-[9px] text-slate-500 font-mono">Surface Ratio</div>
            </div>
          </div>

          {/* Preview Image Thumbnail Pair */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Before ({compareData.before_label})</p>
              <img src={compareData.before_png} alt="Before" className="rounded-lg border border-slate-800 object-cover w-full h-24" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">After ({compareData.after_label})</p>
              <img src={compareData.after_png} alt="After" className="rounded-lg border border-slate-800 object-cover w-full h-24" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Multi-Class Mask</p>
              <img src={compareData.mask_png} alt="Mask" className="rounded-lg border border-slate-800 object-cover w-full h-24" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(34,211,238,0.12)', background: 'rgba(2,4,10,0.6)' }}
        >
          <span className="text-xs text-slate-400">PDF includes executive summary, map tiles & spectral indices</span>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all shadow-glow"
            style={{ background: 'var(--color-terra)' }}
          >
            {isDownloading ? (
              <><Loader2 size={14} className="animate-spin" /> Generating PDF...</>
            ) : (
              <><Download size={14} /> Download PDF Report</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
