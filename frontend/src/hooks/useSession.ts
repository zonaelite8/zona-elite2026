/**
 * hooks/useSession.ts
 * Manages JWT session: persist, restore on mount, and logout.
 */
import { useState, useEffect, useCallback } from 'react'
import type { ViewState, UserSession } from '@/types'

function decodeToken(token: string): UserSession | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64)) as UserSession
  } catch {
    return null
  }
}

export function useSession() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [view, setView] = useState<ViewState>('landing')
  const [checking, setChecking] = useState(true)

  // Restore session on first render
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const parsed = decodeToken(token)
      if (parsed) {
        setUser(parsed)
        setView(parsed.role as ViewState)
      } else {
        localStorage.removeItem('token')
      }
    }
    setChecking(false)
  }, [])

  const login = useCallback((token: string, userData: UserSession) => {
    localStorage.setItem('token', token)
    setUser(userData)
    setView(userData.role as ViewState)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    setView('landing')
  }, [])

  return { user, view, setView, login, logout, checking }
}
