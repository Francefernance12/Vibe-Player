import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'

export type NotificationType = 'error' | 'info' | 'success'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  ttlMs?: number
}

export type NewNotification = Omit<Notification, 'id'> & { id?: string }

interface NotificationContextValue {
  notifications: Notification[]
  notify: (n: NewNotification) => string
  dismiss: (id: string) => void
}

const DEFAULT_TTL_MS = 6000

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const notify = useCallback((n: NewNotification): string => {
    const id = n.id ?? crypto.randomUUID()
    const ttl = n.ttlMs ?? DEFAULT_TTL_MS
    setNotifications(prev => {
      // Coalesce: if a notification with the same message+type exists, refresh its TTL instead of duplicating.
      if (prev.some(x => x.message === n.message && x.type === n.type)) return prev
      return [...prev, { id, type: n.type, message: n.message, ttlMs: ttl }]
    })
    if (ttl > 0) {
      const timer = setTimeout(() => dismiss(id), ttl)
      timersRef.current.set(id, timer)
    }
    return id
  }, [dismiss])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}

export function useNotify() {
  return useNotifications().notify
}
