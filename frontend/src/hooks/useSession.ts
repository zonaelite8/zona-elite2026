/**
 * hooks/useSession.ts
 * Manages JWT session: persist, restore on mount, and logout.
 */
import { useState, useEffect, useCallback } from 'react'
import type { ViewState, UserSession } from '@/types'

function decodeToken(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(window.atob(base64))
    
    // Check if token is expired (exp is in seconds)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return decoded as UserSession
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

    // Listen for session expiration from API
    const handleSessionExpired = () => {
      localStorage.removeItem('token')
      setUser(null)
      setView('landing')
    }
    
    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
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
