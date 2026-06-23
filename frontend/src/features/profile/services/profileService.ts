import { api } from '@lib/api'
import type { UserProfile } from '@lib/types/auth.types'
import type { ApiResult } from '@lib/types/api.types'

interface UpdateProfileRequest {
  name: string
}

async function getProfile(): Promise<ApiResult<UserProfile>> {
  return api<UserProfile>('/api/v1/users/me')
}

async function updateProfile(body: UpdateProfileRequest): Promise<ApiResult<UserProfile>> {
  return api<UserProfile>('/api/v1/users/me', { method: 'PATCH', body })
}

export const profileService = { getProfile, updateProfile }
