import React from 'react'

export const Row: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">{children}</div>
    </div>
  )
}
