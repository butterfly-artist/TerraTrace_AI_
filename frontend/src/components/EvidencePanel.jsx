import React from 'react'
import { Activity, ShieldAlert, BarChart3, Info, Eye, Layers } from 'lucide-react'

export default function EvidencePanel({ stats, impact, evidence, regionName, onClose }) {
  if (!stats || !impact) return null

  const score = impact.score || 50
  const level = impact.level || 'MODERATE'

  const levelColor =
    level === 'CRITICAL' || level === 'HIGH'
      ? '#EF4444'
      : level === 'MODERATE'
      ? '#F59E0B'
      : '#10B981'

  const builtHa = stats.built_up_ha || 0
  const vegHa = stats.veg_loss_ha || 0
  const roadHa = stats.road_expansion_ha || 0
  const waterHa = stats.water_change_ha || 0
  const totalHa = stats.total_changed_ha || 0.1

  return (
    <div
      className="flex flex-col h-full overflow-y-auto p-4 animate-slide-in"
      style={{
        background: 'rgba(6,12,26,0.95)',
        borderLeft: '1px solid rgba(34,211,238,0.15)',
        backdropFilter: 'blur(16px)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid rgba(34,211,238,0.1)' }}>
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: 'var(--color-terra)' }} />
          <h3 className="text-sm font-semibold">Evidence & Impact Dashboard</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-terra)' }}>
          {regionName}
        </span>
      </div>

      {/* Impact Score Widget */}
      <div
        className="rounded-xl p-3.5 mb-4 flex items-center justify-between"
        style={{
          background: `${levelColor}10`,
          border: `1px solid ${levelColor}35`,
        }}
      >
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert size={14} style={{ color: levelColor }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: levelColor }}>
              {level} Impact
            </span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            Surface Area Affected: <strong>{totalHa} ha</strong> ({stats.total_sqkm} km²)
          </p>
        </div>

        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl" style={{ background: `${levelColor}20`, border: `1px solid ${levelColor}40` }}>
          <span className="text-xl font-extrabold" style={{ color: levelColor }}>{score}</span>
          <span className="text-[9px] uppercase tracking-widest text-slate-400">Score</span>
        </div>
      </div>

      {/* Classification Breakdown Progress Bars */}
      <div className="mb-4 space-y-2.5">
        <h4 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          <BarChart3 size={13} style={{ color: 'var(--color-terra)' }} />
          Land-Use Change Breakdown
        </h4>

        {/* Built-Up */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              New Built-up Construction
            </span>
            <span className="font-mono text-slate-300">{builtHa} ha</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (builtHa / totalHa) * 100)}%` }} />
          </div>
        </div>

        {/* Vegetation Loss */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Vegetation Loss
            </span>
            <span className="font-mono text-slate-300">{vegHa} ha</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (vegHa / totalHa) * 100)}%` }} />
          </div>
        </div>

        {/* Road Expansion */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Road & Infrastructure Expansion
            </span>
            <span className="font-mono text-slate-300">{roadHa} ha</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, (roadHa / totalHa) * 100)}%` }} />
          </div>
        </div>

        {/* Water Change */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Water Body Variation
            </span>
            <span className="font-mono text-slate-300">{waterHa} ha</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (waterHa / totalHa) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Spectral Indices (NDVI / NDWI / NDBI) */}
      {evidence && (
        <div className="mt-2 p-3 rounded-xl space-y-2" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(34,211,238,0.1)' }}>
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-cyan-300">
            <Info size={12} />
            Spectral Index Deltas
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">NDVI (Vegetation)</div>
              <div className={`font-mono font-bold ${evidence.mean_ndvi_delta < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {evidence.mean_ndvi_delta}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">NDBI (Built-up)</div>
              <div className="font-mono font-bold text-red-400">
                +{evidence.mean_ndbi_delta}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">NDWI (Water)</div>
              <div className="font-mono font-bold text-blue-400">
                {evidence.mean_ndwi_delta}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">Model Confidence</div>
              <div className="font-mono font-bold text-cyan-300">
                {evidence.avg_model_confidence}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
