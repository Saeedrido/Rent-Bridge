import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { ToastNotification } from './ToastNotification'

type ShowToast = (message: string) => void

const ToastContext = createContext<ShowToast>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)

  const show = useCallback<ShowToast>((message) => {
    setToast({ id: Date.now(), message })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && <ToastNotification key={toast.id} message={toast.message} />}
    </ToastContext.Provider>
  )
}
