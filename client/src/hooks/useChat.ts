import { useState, useCallback } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatAction {
  type: string
  [key: string]: string
}

interface LibraryTrack { id: string; name: string }
interface PlaylistSummary { id: string; name: string }

interface UseChatOptions {
  trackName?: string | null
  library?: LibraryTrack[]
  playlists?: PlaylistSummary[]
  onAction?: (action: ChatAction) => void
}

const ACTION_RE = /<action>([\s\S]*?)<\/action>/

function extractAction(text: string): { clean: string; action: ChatAction | null } {
  const m = text.match(ACTION_RE)
  if (!m) return { clean: text.trim(), action: null }
  try {
    return { clean: text.replace(ACTION_RE, '').trim(), action: JSON.parse(m[1]) as ChatAction }
  } catch {
    return { clean: text.replace(ACTION_RE, '').trim(), action: null }
  }
}

export function useChat({ trackName, library, playlists, onAction }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMsg].slice(-20)
    setMessages(nextMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          trackName: trackName ?? undefined,
          library,
          playlists,
        }),
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant' as const, content: 'Rate limit reached — try again in a minute.' }].slice(-20))
        return
      }
      if (!res.ok) throw new Error('Request failed')

      const { reply } = await res.json()
      const { clean, action } = extractAction(reply as string)
      setMessages(prev => [...prev, { role: 'assistant' as const, content: clean }].slice(-20))
      if (action && onAction) onAction(action)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant' as const, content: 'Something went wrong. Try again.' }].slice(-20))
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, trackName, library, playlists, onAction])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isLoading, sendMessage, clearMessages }
}
