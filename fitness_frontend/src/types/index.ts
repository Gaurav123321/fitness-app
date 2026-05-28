export type ActivityType =
  | 'RUNNING'
  | 'WALKING'
  | 'CYCLING'
  | 'SWIMMING'
  | 'WEIGHT_TRAINING'
  | 'YOGA'
  | 'HIIT'
  | 'CARDIO'
  | 'STRETCHING'
  | 'OTHER'

export interface ActivityRequest {
  userId: string
  type: ActivityType
  duration: number
  caloriesBurned: number
  additionalMetrics?: Record<string, unknown>
}

export interface ActivityResponse {
  id: string
  userId: string
  type: ActivityType
  duration: number
  caloriesBurned: number
  startTime: string | null
  additionalMetrics?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Recommendation {
  id: string
  activityId: string
  userId: string
  type: ActivityType
  recommendation: string
  improvements: string[]
  suggestions: string[]
  safety: string[]
  createdAt: string
}
