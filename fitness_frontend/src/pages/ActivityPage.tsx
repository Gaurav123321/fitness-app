import { useState, type FormEvent } from 'react'
import { createActivity } from '../api/activities'
import { getRecommendationsByUser, pollRecommendation } from '../api/recommendations'
import { useAuth } from '../auth/useAuth'
import type { ActivityType, Recommendation } from '../types'

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'RUNNING', label: 'Running' },
  { value: 'WALKING', label: 'Walking' },
  { value: 'CYCLING', label: 'Cycling' },
  { value: 'HIIT', label: 'Sprint / HIIT' },
  { value: 'SWIMMING', label: 'Swimming' },
  { value: 'WEIGHT_TRAINING', label: 'Weight training' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'STRETCHING', label: 'Stretching' },
  { value: 'OTHER', label: 'Other' },
]

export function ActivityPage() {
  const { email, logout, userId } = useAuth()
  const [type, setType] = useState<ActivityType>('RUNNING')
  const [duration, setDuration] = useState('30')
  const [calories, setCalories] = useState('250')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestRecommendation, setLatestRecommendation] = useState<Recommendation | null>(null)
  const [history, setHistory] = useState<Recommendation[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  async function loadHistory() {
    if (!userId) return
    try {
      const recs = await getRecommendationsByUser(userId)
      setHistory(recs)
    } catch {
      /* history is optional */
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!userId) return

    setError(null)
    setStatusMessage(null)
    setLatestRecommendation(null)
    setLoading(true)

    try {
      const activity = await createActivity({
        userId,
        type,
        duration: Number(duration),
        caloriesBurned: Number(calories),
      })

      setStatusMessage('Activity saved. Generating AI recommendation…')
      try {
        const recommendation = await pollRecommendation(activity.id)
        setLatestRecommendation(recommendation)
        setStatusMessage(null)
      } catch (pollErr) {
        setStatusMessage(null)
        setError(
          pollErr instanceof Error
            ? pollErr.message
            : 'Activity saved. Recommendation may appear after you click Refresh history.',
        )
      }
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Log activity</h1>
          {email && <p className="muted small">Signed in as {email}</p>}
        </div>
        <button type="button" className="btn ghost" onClick={logout}>
          Sign out
        </button>
      </header>

      <main className="layout">
        <section className="card">
          <h2>Add workout</h2>
          <form className="activity-form" onSubmit={handleSubmit}>
            <label>
              Activity type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                disabled={loading}
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Time (minutes)
              <input
                type="number"
                min={1}
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={loading}
              />
            </label>

            <label>
              Calories burnt
              <input
                type="number"
                min={1}
                required
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                disabled={loading}
              />
            </label>

            {error && <p className="error">{error}</p>}
            {statusMessage && <p className="status">{statusMessage}</p>}

            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Saving & analyzing…' : 'Add activity'}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>AI recommendation</h2>
            <button type="button" className="btn ghost small" onClick={loadHistory}>
              Refresh history
            </button>
          </div>

          {!latestRecommendation && !loading && (
            <p className="muted">
              Submit an activity to receive personalized tips from the AI service.
            </p>
          )}

          {latestRecommendation && (
            <RecommendationCard recommendation={latestRecommendation} highlight />
          )}

          {history.length > 0 && (
            <div className="history">
              <h3>Past recommendations</h3>
              {history.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function RecommendationCard({
  recommendation,
  highlight = false,
}: {
  recommendation: Recommendation
  highlight?: boolean
}) {
  return (
    <article className={`recommendation ${highlight ? 'highlight' : ''}`}>
      <p className="rec-meta">
        {recommendation.type.replace('_', ' ')} ·{' '}
        {new Date(recommendation.createdAt).toLocaleString()}
      </p>
      <p className="rec-body">{recommendation.recommendation}</p>

      {recommendation.improvements.length > 0 && (
        <>
          <h4>Improvements</h4>
          <ul>
            {recommendation.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {recommendation.suggestions.length > 0 && (
        <>
          <h4>Suggestions</h4>
          <ul>
            {recommendation.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {recommendation.safety.length > 0 && (
        <>
          <h4>Safety</h4>
          <ul>
            {recommendation.safety.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}
