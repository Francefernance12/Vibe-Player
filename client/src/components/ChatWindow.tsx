import { useEffect, useRef, useState, memo, Fragment, useCallback } from 'react'
import { useChat, ChatAction } from '../hooks/useChat'

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split(/\*\*([^*]+)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
      )}
    </Fragment>
  ))
}

interface LibraryTrack { id: string; name: string }
interface PlaylistSummary { id: string; name: string }

interface Props {
  isOpen: boolean
  onClose: () => void
  trackName?: string | null
  library?: LibraryTrack[]
  playlists?: PlaylistSummary[]
  onAction?: (action: ChatAction) => void
}

const SUGGESTIONS = [
  'Play something from my library',
  'Search for chill jazz',
  'What is this genre called?',
  'Add this track to my Favorites',
]

export const ChatWindow = memo(function ChatWindow({ isOpen, onClose, trackName, library, playlists, onAction }: Props) {
  const { messages, isLoading, sendMessage } = useChat({ trackName, library, playlists, onAction })
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

  const handleSuggestion = useCallback((text: string) => {
    sendMessage(text)
  }, [sendMessage])

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 z-40 flex flex-col bg-[#111113] border-l border-[#1e1e21] w-full sm:w-80 sm:right-4 sm:top-auto sm:bottom-4 sm:h-[520px] sm:max-h-[85vh] sm:rounded-2xl sm:border transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-[#1e1e21] flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
            <span className="font-display font-bold text-sm text-zinc-100">Vibe Assistant</span>
          </div>
          {trackName && (
            <p className="text-[11px] text-zinc-600 truncate mt-0.5 pl-3.5">{trackName}</p>
          )}
        </div>
        <button onClick={onClose} aria-label="Close" className="text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5 flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center mt-8 px-4 gap-4">
            <p className="text-zinc-600 text-xs text-center leading-relaxed">
              Ask me about music, artists, or what you&apos;re listening to.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  disabled={isLoading}
                  className="text-[11px] text-zinc-500 hover:text-zinc-200 bg-[#1a1a1d] hover:bg-[#252528] border border-[#2a2a2e] rounded-full px-2.5 py-1 transition-all disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.kind === 'action') {
            return (
              <p key={i} className="text-center text-[11px] text-zinc-600 italic px-4 py-0.5">
                {msg.content}
              </p>
            )
          }
          return (
            <div
              key={i}
              className={`max-w-[82%] px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white self-end rounded-2xl rounded-br-sm'
                  : 'bg-[#1e1e21] text-zinc-300 self-start rounded-2xl rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          )
        })}
        {isLoading && (
          <div className="bg-[#1e1e21] rounded-2xl rounded-bl-sm px-3 py-2.5 self-start flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 pt-3 pb-3 border-t border-[#1e1e21] flex-shrink-0 sm:pb-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message…"
          disabled={isLoading}
          className="flex-1 bg-[#0a0a0b] rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
          className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-20 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white translate-x-px">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  )
})
