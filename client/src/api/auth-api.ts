import { apiRequest } from './client'
import type { User } from '../types'

export function loginRequest(email: string, password: string) {
  return apiRequest<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser() {
  return apiRequest<{ user: User }>('/auth/me')
}
