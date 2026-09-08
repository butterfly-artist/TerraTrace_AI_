import React from 'react'
import { Calendar, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'

const YEARS = ['2015', '2018', '2022', '2024', '2026']

export default function TimelineScrubber({ activeYearBefore, activeYearAfter, onSelectYears }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs backdrop-blur-md rounded-xl shadow-2xl"
      style={{
        background: 'rgba(6,12,26,0.92)',
        border: '1px solid rgba(34,211,238,0.2)',
        color: 'var(--color-text-primary)',
        width: '420px',
      }}
    >
      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
        <Calendar size={13} />
        <span>Timeline Scrubber</span>
      </div>

      <div className="flex items-center gap-1.5">
        {YEARS.map((yr, idx) => {
          const isBefore = yr === activeYearBefore
          const isAfter = yr === activeYearAfter
          const isSelected = isBefore || isAfter

          return (
            <button
              key={yr}
              onClick={() => {
                if (isBefore) return
                if (!isAfter) {
                  onSelectYears(activeYearBefore, yr)
                }
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono transition-all"
              style={{
                background: isAfter
                  ? 'var(--color-terra)'
                  : isBefore
                  ? 'rgba(34,211,238,0.25)'
                  : 'rgba(15,23,42,0.6)',
                color: isAfter ? '#02040a' : isBefore ? 'var(--color-terra)' : 'var(--color-text-secondary)',
                border: isSelected ? '1px solid var(--color-terra)' : '1px solid rgba(34,211,238,0.1)',
                fontWeight: isSelected ? 'bold' : 'normal',
              }}
            >
              {yr}
              {isBefore && <span className="ml-1 text-[8px] text-cyan-200">T1</span>}
              {isAfter && <span className="ml-1 text-[8px] text-black">T2</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
