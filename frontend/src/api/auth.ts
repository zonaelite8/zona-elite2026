/**
 * api/auth.ts
 * All authentication-related API calls.
 */
import { api } from './client'
import type { UserSession } from '@/types'

export interface AuthResponse {
  token: string
  user: UserSession
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password, role: 'client' }),

  googleLogin: (idToken: string) =>
    api.post<AuthResponse>('/auth/google-login', { idToken }),

  updateProfile: (name: string, phone: string, cedula: string) =>
    api.put<AuthResponse>('/auth/profile', { name, phone, cedula }),

  verifyCode: (email: string, code: string) =>
    api.post<AuthResponse>('/auth/verify-code', { email, code }),
}
