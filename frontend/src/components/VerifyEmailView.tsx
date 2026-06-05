import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ZonaEliteLogo } from './Logo';

export function VerifyEmailView({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authApi.verifyEmail(token)
      .then(res => {
        setStatus('success');
        setMessage(res.message || 'Cuenta verificada exitosamente.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Error al verificar la cuenta.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <ZonaEliteLogo />
      </div>
      
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p>Verificando tu correo electrónico...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 text-emerald-500 fade-in">
            <CheckCircle2 size={64} className="text-emerald-500" />
            <h2 className="text-2xl font-bold text-foreground">¡Correo Verificado!</h2>
            <p className="text-muted-foreground">{message}</p>
            <a href="/" className="btn-primary w-full py-3 mt-4 inline-block">
              Ir a Iniciar Sesión
            </a>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 text-red-500 fade-in">
            <XCircle size={64} className="text-red-500" />
            <h2 className="text-2xl font-bold text-foreground">Enlace Inválido</h2>
            <p className="text-muted-foreground">{message}</p>
            <a href="/" className="btn-secondary w-full py-3 mt-4 inline-block text-foreground">
              Volver al Inicio
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
