import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { startNotifications } from './services/notifications'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000'
startNotifications(API_BASE)

// Tauri tray actions: navigate and trigger import modal
try {
  // @ts-ignore
  if ((window as any).__TAURI__) {
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('tray://open-library', () => {
        history.pushState({}, '', '/pro')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      listen('tray://import-folder', () => {
        window.dispatchEvent(new CustomEvent('tray-import-folder'))
      })
      listen('update://status', (e) => {
        // Could surface a toast/notification; for now console.log
        console.log('Updater:', e.payload)
      })
    }).catch(() => {})
  }
} catch {}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
