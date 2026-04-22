import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onSwitchToLogin: () => void
}

export function RegisterPage({ onSwitchToLogin }: Props) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format'
    if (password.length < 8) return 'Password must be at least 8 characters'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)
    setSubmitting(true)
    try {
      await register(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <h1 className="font-display text-xl font-bold text-zinc-50">Vibe Player</h1>
        </div>

        <h2 className="text-zinc-300 text-lg font-semibold mb-6">Create account</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null) }}
            required
            aria-label="Email"
            className="bg-[#111113] border border-[#1e1e21] rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-orange-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            required
            aria-label="Password"
            className="bg-[#111113] border border-[#1e1e21] rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-orange-500 transition-colors"
          />

          {error && (
            <p role="alert" className="text-red-400 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-semibold text-sm rounded-xl px-4 py-3 transition-colors"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-600 text-center">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-orange-500 hover:text-orange-400 transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
