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
      {/* Backend connection banner */}
      {backendStatus === 'connecting' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500/90 backdrop-blur-sm text-black text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          Conectando con el servidor... Esto puede tardar unos segundos.
        </div>
      )}
      {backendStatus === 'connected' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-500/90 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-semibold animate-in slide-in-from-top duration-300">
          ✓ Servidor conectado
        </div>
      )}
      {backendStatus === 'error' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500/90 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          ⚠ No se pudo conectar al servidor. Algunas funciones pueden no estar disponibles.
          <button 
            onClick={() => window.location.reload()} 
            className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

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
