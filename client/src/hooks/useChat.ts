import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  kind?: 'action'
}

export interface ChatAction {
  type: string
  [key: string]: string
}

interface LibraryTrack { id: string; name: string }
interface PlaylistSummary { id: string; name: string }
interface CurrentTrack { id: string; name: string }

interface UseChatOptions {
  currentTrack?: CurrentTrack | null
  isPlaying?: boolean
  library?: LibraryTrack[]
  playlists?: PlaylistSummary[]
  onAction?: (action: ChatAction) => string | void
}

const ACTION_RE = /<action>([\s\S]*?)<\/action>/

function extractAction(text: string): { clean: string; action: ChatAction | null } {
  const m = text.match(ACTION_RE)
  if (!m) return { clean: text.trim(), action: null }

  let jsonStr = m[1].trim()
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  jsonStr = jsonStr.replace(/^```[\w]*\n?/i, '').replace(/\n?```$/, '').trim()
  // Strip wrapping backticks
  jsonStr = jsonStr.replace(/^`+|`+$/g, '').trim()

  try {
    return { clean: text.replace(ACTION_RE, '').trim(), action: JSON.parse(jsonStr) as ChatAction }
  } catch {
    return { clean: text.replace(ACTION_RE, '').trim(), action: null }
  }
}

export function useChat({ currentTrack, isPlaying, library, playlists, onAction }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesRef = useRef<ChatMessage[]>([])
  const isLoadingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoadingRef.current) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const nextMessages = [...messagesRef.current, userMsg].slice(-20)
    messagesRef.current = nextMessages
    setMessages(nextMessages)
    isLoadingRef.current = true
    setIsLoading(true)

    // Strip UI-only fields before sending — Groq rejects unknown properties
    const apiMessages = nextMessages
      .filter(m => !m.kind)
      .map(({ role, content }) => ({ role, content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          currentTrack: currentTrack ?? null,
          isPlaying: isPlaying ?? false,
          library,
          playlists,
        }),
      })

      if (res.status === 429) {
        const updated = [...messagesRef.current, { role: 'assistant' as const, content: 'Rate limit reached — try again in a minute.' }].slice(-20)
        messagesRef.current = updated
        setMessages(updated)
        return
      }
      if (!res.ok) throw new Error('Request failed')

      const { reply } = await res.json()
      const { clean, action } = extractAction(reply as string)

      const withReply = [...messagesRef.current, { role: 'assistant' as const, content: clean }].slice(-20)
      messagesRef.current = withReply
      setMessages(withReply)

      if (action && onAction) {
        const feedback = onAction(action)
        if (feedback) {
          const withFeedback = [...messagesRef.current, { role: 'assistant' as const, content: feedback, kind: 'action' as const }].slice(-20)
          messagesRef.current = withFeedback
          setMessages(withFeedback)
        }
      }
    } catch {
      const withError = [...messagesRef.current, { role: 'assistant' as const, content: 'Something went wrong. Try again.' }].slice(-20)
      messagesRef.current = withError
      setMessages(withError)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [currentTrack, isPlaying, library, playlists, onAction])

  const clearMessages = useCallback(() => { messagesRef.current = []; setMessages([]) }, [])

  return { messages, isLoading, sendMessage, clearMessages }
}
