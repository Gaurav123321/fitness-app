import { apiFetch, ApiError } from './client'
import type { Recommendation } from '../types'

export function getRecommendationByActivity(activityId: string) {
  return apiFetch<Recommendation>(`/api/recommendations/activity/${activityId}`)
}

export function getRecommendationsByUser(userId: string) {
  return apiFetch<Recommendation[]>(`/api/recommendations/user/${userId}`)
}

function isNotReadyYet(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404 || error.status === 500
  }
  return false
}

export async function pollRecommendation(
  activityId: string,
  maxAttempts = 20,
  intervalMs = 2000,
): Promise<Recommendation> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await getRecommendationByActivity(activityId)
    } catch (error) {
      if (!isNotReadyYet(error) || attempt === maxAttempts - 1) {
        throw new Error(
          'Activity was saved, but the AI recommendation is not ready yet. ' +
            'Click "Refresh history" in a few seconds, or restart ai-service after setting GEMINI_KEY.',
        )
      }
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }
  throw new Error('Timed out waiting for AI recommendation')
}
