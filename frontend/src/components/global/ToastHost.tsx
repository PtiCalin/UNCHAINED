import React, { useEffect } from 'react'
import { useToastStore } from '../../store/useToastStore'

export const ToastHost: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => remove(t.id), t.ttl ?? 4000))
    return () => { timers.forEach(clearTimeout) }
  }, [toasts, remove])

  return (
    <div className="fixed bottom-6 right-6 space-y-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className={`glass-panel neo-border px-4 py-2 rounded text-sm shadow-accent ${t.type === 'error' ? 'border-red-500' : t.type === 'success' ? 'border-green-500' : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}