// src/App.tsx

import { useState, useEffect } from 'react'
import { LandingView }   from '@/components/LandingView'
import { AuthView }      from '@/components/AuthView'
import { AdminDashboard } from '@/components/AdminDashboard'
import { ClientDashboard } from '@/components/ClientDashboard'
import { useSession }    from '@/hooks/useSession'
import { CancelBookingView } from '@/components/CancelBookingView'
import { ResetPasswordView } from '@/components/ResetPasswordView'

type BackendStatus = 'idle' | 'connecting' | 'connected' | 'error';

export default function App() {
  const { user, view, setView, login, logout, checking } = useSession()
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('idle')

  // Listen for backend connection status events from client.ts
  useEffect(() => {
    const handler = (e: Event) => {
      const status = (e as CustomEvent).detail as BackendStatus;
      setBackendStatus(status);
      // Auto-hide "connected" banner after 3 seconds
      if (status === 'connected') {
        setTimeout(() => setBackendStatus('idle'), 3000);
      }
    };
    window.addEventListener('backend-status', handler);
    return () => window.removeEventListener('backend-status', handler);
  }, []);

  // Intercept /cancelar route
  const url = new URL(window.location.href);
  if (url.pathname === '/cancelar') {
    const token = url.searchParams.get('token');
    if (token) {
      return <CancelBookingView token={token} />;
    }
  }

  // Intercept /restablecer route
  if (url.pathname === '/restablecer') {
    const token = url.searchParams.get('token');
    if (token) {
      return <ResetPasswordView token={token} />;
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {view === 'landing' && <LandingView onNavigate={setView} />}

      {view === 'auth' && (
        <AuthView
          onNavigate={setView}
          onLogin={login}
        />
      )}

      {view === 'admin' && (
        <AdminDashboard
          onLogout={logout}
          user={user}
        />
      )}

      {view === 'client' && (
        <ClientDashboard
          onLogout={logout}
          user={user}
          onLogin={login}
        />
      )}
    </>
  )
}
