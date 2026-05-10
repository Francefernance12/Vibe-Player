import { useNotifications, NotificationType } from '../contexts/NotificationContext'

const STYLE_BY_TYPE: Record<NotificationType, string> = {
  error: 'border-red-500/60 bg-red-950/80 text-red-100',
  info: 'border-zinc-500/60 bg-zinc-900/85 text-zinc-100',
  success: 'border-emerald-500/60 bg-emerald-950/80 text-emerald-100',
}

export function NotificationStack() {
  const { notifications, dismiss } = useNotifications()
  if (notifications.length === 0) return null
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      {notifications.map(n => (
        <div
          key={n.id}
          role={n.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg backdrop-blur-sm text-sm ${STYLE_BY_TYPE[n.type]}`}
        >
          <span className="flex-1 leading-snug">{n.message}</span>
          <button
            type="button"
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100 -mr-1 px-1 text-base leading-none"
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}
