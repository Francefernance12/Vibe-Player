import { render, screen, fireEvent } from '@testing-library/react'
import { ChatWindow } from '../components/ChatWindow'

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Prevent real fetch calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ reply: 'Great question about music!' }),
})

describe('ChatWindow', () => {
  it('renders empty state when open', () => {
    render(<ChatWindow isOpen={true} onClose={() => {}} />)
    expect(screen.getByText(/ask me about music/i)).toBeInTheDocument()
  })

  it('does not render content when closed (off-screen)', () => {
    const { container } = render(<ChatWindow isOpen={false} onClose={() => {}} />)
    // Panel is translated off-screen but still in DOM
    expect(container.firstChild).toHaveClass('translate-x-full')
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatWindow isOpen={true} onClose={() => {}} />)
    expect(screen.getByLabelText('Send')).toBeDisabled()
  })

  it('send button enables when input has text', () => {
    render(<ChatWindow isOpen={true} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/message/i), { target: { value: 'Hello' } })
    expect(screen.getByLabelText('Send')).not.toBeDisabled()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ChatWindow isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })
})
