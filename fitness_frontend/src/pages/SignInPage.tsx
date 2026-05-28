import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function SignInPage() {
  const { initialized, authenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!initialized) {
    return (
      <div className="page-center">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (authenticated) {
    return <Navigate to="/activities" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/activities', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div className="card signin-card">
        <h1>Fitness Tracker</h1>
        <p className="subtitle">Sign in with your account</p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <label>
            Username or email
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="e.g. john or john@email.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="hint muted small">
          Sign-in uses Keycloak user <strong>user2</strong> (username from Keycloak, not
          email unless login with email is enabled). Gateway must be running on port{' '}
          <strong>8080</strong>.
        </p>
      </div>
    </div>
  )
}
