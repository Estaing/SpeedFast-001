import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import styles from './Toast.module.css'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; type: ToastType; message: string }

// Simple singleton toast bus
const listeners: Array<(t: ToastItem) => void> = []
let nextId = 0

export const toast = {
  success: (message: string) => emit('success', message),
  error:   (message: string) => emit('error',   message),
  info:    (message: string) => emit('info',     message),
}

function emit(type: ToastType, message: string) {
  const item: ToastItem = { id: ++nextId, type, message }
  listeners.forEach(fn => fn(item))
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const fn = (t: ToastItem) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => remove(t.id), 4000)
    }
    listeners.push(fn)
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1) }
  }, [remove])

  return (
    <div className={styles.container} role="log" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          {t.type === 'success' && <CheckCircle2 size={16} />}
          {t.type === 'error'   && <XCircle size={16} />}
          {t.type === 'info'    && <Info size={16} />}
          <span>{t.message}</span>
          <button className={styles.close} onClick={() => remove(t.id)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
