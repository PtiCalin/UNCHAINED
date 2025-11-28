import React from 'react'

export const Row: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="mono-tag">ROW</span>
          <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
        </div>
      </div>
      <div className="h-[2px] w-full" style={{
        background: 'linear-gradient(90deg, rgba(193,124,255,0.0), rgba(193,124,255,0.6), rgba(193,124,255,0.0))'
      }} />
      <div className="flex gap-4 overflow-x-auto pb-2 pt-3">{children}</div>
    </div>
  )
}
