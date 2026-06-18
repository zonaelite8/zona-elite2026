// src/types.ts
export type ViewState = 'landing' | 'auth' | 'client' | 'admin'

export interface UserSession {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  cedula?: string
}
