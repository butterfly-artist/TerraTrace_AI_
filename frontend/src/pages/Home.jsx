import React from 'react'
import TopBar from '../components/TopBar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import MapView from '../components/MapView.jsx'

/**
 * Home — main page layout.
 *
 * Structure:
 *   ┌─────────────────────────────────┐
 *   │          TopBar (52px)          │
 *   ├──────────┬──────────────────────┤
 *   │ Sidebar  │       MapView        │
 *   │ (300px)  │      (flex-1)        │
 *   └──────────┴──────────────────────┘
 */
export default function Home() {
  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}
    >
      {/* ── Top navigation bar ─────────────────────────── */}
      <TopBar />

      {/* ── Content area ───────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar />

        {/* Map canvas */}
        <MapView />
      </main>
    </div>
  )
}
