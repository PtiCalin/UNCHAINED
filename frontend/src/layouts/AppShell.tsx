import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { TopBar } from '../components/global/TopBar'
import { Sidebar } from '../components/global/Sidebar'
import { BottomPlayer } from '../components/global/BottomPlayer'

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  return (
    <div className="min-h-screen bg-[#121212] text-white grid grid-rows-[auto_1fr_auto]">
      <TopBar />
      <div className="grid grid-cols-[260px_1fr]">
        {sidebarOpen && <Sidebar />}
        <div className="p-4">{children}</div>
      </div>
      <BottomPlayer />
    </div>
  )
}
