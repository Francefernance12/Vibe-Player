import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onSwitchToRegister: () => void
}

export function LoginPage({ onSwitchToRegister }: Props) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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

        <h2 className="text-zinc-300 text-lg font-semibold mb-6">Sign in</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            aria-label="Email"
            className="bg-[#111113] border border-[#1e1e21] rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-orange-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-600 text-center">
          No account?{' '}
          <button onClick={onSwitchToRegister} className="text-orange-500 hover:text-orange-400 transition-colors">
            Register
          </button>
        </p>
      </div>
    </div>
  )
}
