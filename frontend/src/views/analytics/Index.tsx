import React from 'react'

export default function AnalyticsIndex() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analytics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48 border border-[#222] rounded" />
        <div className="h-48 border border-[#222] rounded" />
        <div className="h-48 border border-[#222] rounded" />
        <div className="h-48 border border-[#222] rounded" />
      </div>
      <div className="text-[#B3B3B3] text-sm">Graphs coming soon (BPM Distribution, Key Wheel, etc.)</div>
    </div>
  )
}
