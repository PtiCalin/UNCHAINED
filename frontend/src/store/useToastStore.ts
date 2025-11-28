import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  type?: 'info' | 'error' | 'success'
  ttl?: number
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  remove: (id: number) => void
}

let _id = 1
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { id: _id++, ttl: 4000, ...t }] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export function toast(message: string, type: 'info'|'error'|'success'='info') {
  useToastStore.getState().push({ message, type })
}