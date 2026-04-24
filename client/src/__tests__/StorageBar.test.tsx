import { render, screen } from '@testing-library/react'
import { StorageBar } from '../components/StorageBar'

describe('StorageBar', () => {
  it('renders tier label and usage', () => {
    render(<StorageBar used={10 * 1024 * 1024} limit={100 * 1024 * 1024} tier="free" />)
    expect(screen.getByText(/free trial/i)).toBeInTheDocument()
    expect(screen.getByText(/100 MB/i)).toBeInTheDocument()
  })

  it('renders the progress bar element', () => {
    render(<StorageBar used={50 * 1024 * 1024} limit={100 * 1024 * 1024} tier="free" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-valuenow', '50')
  })

  it('shows near-full state at 90%+', () => {
    render(<StorageBar used={95 * 1024 * 1024} limit={100 * 1024 * 1024} tier="free" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '95')
  })
})
