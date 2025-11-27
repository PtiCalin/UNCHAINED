import React from 'react'
import MetadataTool from '../../components/MetadataTool'

export default function ITunesPro() {
  return (
    <div className="grid grid-cols-[1fr_360px] gap-4">
      <div className="min-h-[400px] border border-[#222] rounded p-2">Table View (virtualized) — coming soon</div>
      <div className="border border-[#222] rounded p-2">
        <h3 className="font-semibold mb-2">Inspector</h3>
        <MetadataTool />
      </div>
    </div>
  )
}
