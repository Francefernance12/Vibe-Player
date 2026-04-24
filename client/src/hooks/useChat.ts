import { useState, useCallback } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function useChat(trackName?: string | null) {
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
        body: JSON.stringify({ messages: nextMessages, trackName: trackName ?? undefined }),
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Rate limit reached — try again in a minute.' }].slice(-20))
        return
      }
      if (!res.ok) throw new Error('Request failed')

      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }].slice(-20))
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }].slice(-20))
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, trackName])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isLoading, sendMessage, clearMessages }
}
