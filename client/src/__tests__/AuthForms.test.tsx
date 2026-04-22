import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginPage } from '../components/LoginPage'
import { RegisterPage } from '../components/RegisterPage'
import { AuthProvider } from '../contexts/AuthContext'

// Default: /api/auth/me returns 401 (not logged in)
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  } as unknown as Response)
})

// Wrap with AuthProvider since components use useAuth()
function withAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('LoginPage', () => {
  it('shows error message on bad credentials', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    } as unknown as Response)

    withAuth(<LoginPage onSwitchToRegister={() => {}} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'badpassword' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })

  it('calls onSwitchToRegister when register link is clicked', () => {
    const onSwitch = vi.fn()
    withAuth(<LoginPage onSwitchToRegister={onSwitch} />)
    fireEvent.click(screen.getByText('Register'))
    expect(onSwitch).toHaveBeenCalled()
  })
})

describe('RegisterPage', () => {
  it('shows error for invalid email format without calling register API', async () => {
    withAuth(<RegisterPage onSwitchToLogin={() => {}} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email format')
    })
    // Only /api/auth/me should have been called (by AuthProvider on mount), not /api/auth/register
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls as [string][]
    expect(calls.every(([url]) => !url.includes('/register'))).toBe(true)
  })

  it('shows error for short password without calling register API', async () => {
    withAuth(<RegisterPage onSwitchToLogin={() => {}} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters')
    })
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls as [string][]
    expect(calls.every(([url]) => !url.includes('/register'))).toBe(true)
  })

  it('calls onSwitchToLogin when sign in link is clicked', () => {
    const onSwitch = vi.fn()
    withAuth(<RegisterPage onSwitchToLogin={onSwitch} />)
    fireEvent.click(screen.getByText('Sign in'))
    expect(onSwitch).toHaveBeenCalled()
  })
})
