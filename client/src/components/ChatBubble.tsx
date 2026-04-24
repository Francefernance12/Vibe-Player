import { memo } from 'react'

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export const ChatBubble = memo(function ChatBubble({ isOpen, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? 'Close chat' : 'Open music assistant'}
      className="fixed bottom-36 right-4 sm:bottom-8 sm:right-6 z-50 w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 shadow-lg flex items-center justify-center transition-all"
    >
      {isOpen ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
})
