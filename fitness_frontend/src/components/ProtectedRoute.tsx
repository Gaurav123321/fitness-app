import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { initialized, authenticated } = useAuth()

  if (!initialized) {
    return (
      <div className="page-center">
        <p className="muted">Checking session…</p>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
