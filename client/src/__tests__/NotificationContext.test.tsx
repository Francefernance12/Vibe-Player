import { act, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { NotificationProvider, useNotify, useNotifications } from '../contexts/NotificationContext'
import { NotificationStack } from '../components/NotificationStack'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function Trigger({ message = 'DB down', ttlMs }: { message?: string; ttlMs?: number }) {
  const notify = useNotify()
  return <button onClick={() => notify({ type: 'error', message, ttlMs })}>fire</button>
}

function setup(node: React.ReactNode) {
  return render(
    <NotificationProvider>
      <NotificationStack />
      {node}
    </NotificationProvider>
  )
}

describe('NotificationContext', () => {
  test('notify shows a toast', () => {
    setup(<Trigger />)
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('alert')).toHaveTextContent('DB down')
  })

  test('toast auto-dismisses after default TTL (6000ms)', () => {
    setup(<Trigger />)
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('honors custom ttlMs', () => {
    setup(<Trigger ttlMs={1000} />)
    fireEvent.click(screen.getByText('fire'))
    act(() => { vi.advanceTimersByTime(999) })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('dismiss button removes the toast immediately', () => {
    setup(<Trigger />)
    fireEvent.click(screen.getByText('fire'))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('coalesces duplicate notifications (same message+type)', () => {
    setup(<Trigger />)
    fireEvent.click(screen.getByText('fire'))
    fireEvent.click(screen.getByText('fire'))
    fireEvent.click(screen.getByText('fire'))
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })

  test('useNotifications throws outside provider', () => {
    function Probe() { useNotifications(); return null }
    // Suppress React's error boundary noise in console
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/NotificationProvider/)
    errSpy.mockRestore()
  })
})
