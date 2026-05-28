import { apiFetch } from './client'
import type { ActivityRequest, ActivityResponse } from '../types'

export function createActivity(body: ActivityRequest) {
  return apiFetch<ActivityResponse>('/api/activities', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
