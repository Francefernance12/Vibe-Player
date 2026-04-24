import { useEffect, useRef, useState, memo } from 'react'
import { useChat } from '../hooks/useChat'

interface Props {
  isOpen: boolean
  onClose: () => void
  trackName?: string | null
}

export const ChatWindow = memo(function ChatWindow({ isOpen, onClose, trackName }: Props) {
  const { messages, isLoading, sendMessage } = useChat(trackName)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 z-40 flex flex-col bg-[#111113] border-l border-[#1e1e21] w-full sm:w-80 sm:right-4 sm:top-auto sm:bottom-0 sm:h-[500px] sm:rounded-2xl sm:border transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e21] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="font-display font-bold text-sm text-zinc-100">Vibe Assistant</span>
        </div>
        {trackName && (
          <span className="text-xs text-zinc-600 truncate max-w-[120px]">{trackName}</span>
        )}
        <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-200 transition-colors ml-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-zinc-600 text-sm text-center mt-8">
            Ask me about music, artists, or what you&apos;re listening to.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white self-end'
                : 'bg-[#1e1e21] text-zinc-200 self-start'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-[#1e1e21] rounded-xl px-3 py-2 self-start flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-3 py-3 border-t border-[#1e1e21] flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about music..."
          disabled={isLoading}
          className="flex-1 bg-[#0a0a0b] border border-[#1e1e21] rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
          className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-25 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white translate-x-px">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  )
})
