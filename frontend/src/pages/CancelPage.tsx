import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function CancelPage() {
  const token = new URLSearchParams(window.location.search).get('token');
  const [status, setStatus] = useState<'loading' | 'found' | 'cancelled' | 'error' | 'invalid'>('loading');
  const [booking, setBooking] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    api.get<any>(`/bookings/token/${token}`)
      .then(b => { setBooking(b); setStatus('found'); })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleCancel = async () => {
    setStatus('loading');
    try {
      await api.post('/bookings/cancel-token', { token });
      setStatus('cancelled');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Error al cancelar');
      setStatus('error');
    }
  };

  const fmt12 = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#12141A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Inter', Arial, sans-serif" }}>
      <div style={{ maxWidth: 440, width: '100%', backgroundColor: '#171A21', border: '1px solid #1E222B', borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: '24px 30px', borderBottom: '2px solid #F5B927', textAlign: 'center' }}>
          <h1 style={{ color: '#F5B927', margin: 0, fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 900 }}>ZONA ÉLITE</h1>
        </div>

        <div style={{ padding: '36px 30px' }}>

          {status === 'loading' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: '3px solid #F5B927', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
              <p style={{ color: '#8D94A5', margin: 0 }}>Verificando reserva...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h2 style={{ color: '#ef4444', margin: '0 0 10px' }}>Enlace inválido</h2>
              <p style={{ color: '#8D94A5', margin: 0 }}>Este link ya fue usado o no es válido. Si necesitas cancelar, ingresa a la app.</p>
            </div>
          )}

          {status === 'found' && booking && (
            <div>
              <h2 style={{ color: '#FFFFFF', margin: '0 0 24px', fontSize: 20 }}>¿Cancelar reserva?</h2>
              <div style={{ backgroundColor: '#12141A', border: '1px solid #1E222B', borderRadius: 12, padding: '20px', marginBottom: 28 }}>
                <p style={{ margin: '0 0 10px 0', color: '#D1D5DB' }}><span style={{ color: '#8D94A5', display: 'inline-block', width: 90 }}>Cliente:</span> <strong style={{ color: '#FFF' }}>{booking.user_name}</strong></p>
                <p style={{ margin: '0 0 10px 0', color: '#D1D5DB' }}><span style={{ color: '#8D94A5', display: 'inline-block', width: 90 }}>Modalidad:</span> <strong style={{ color: '#F5B927', textTransform: 'capitalize' }}>{booking.modality === 'fuerza' ? 'Entrenamiento Funcional' : 'Personalizado'}</strong></p>
                <p style={{ margin: '0 0 10px 0', color: '#D1D5DB' }}><span style={{ color: '#8D94A5', display: 'inline-block', width: 90 }}>Fecha:</span> <strong style={{ color: '#FFF' }}>{new Date(booking.date).toISOString().split('T')[0]}</strong></p>
                <p style={{ margin: 0, color: '#D1D5DB' }}><span style={{ color: '#8D94A5', display: 'inline-block', width: 90 }}>Hora:</span> <strong style={{ color: '#FFF' }}>{fmt12(booking.start_time?.substring(0, 5))}</strong></p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="https://zonaelitemarinilla.com" style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #1E222B', color: '#8D94A5', textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                  No, volver
                </a>
                <button
                  onClick={handleCancel}
                  style={{ flex: 1, padding: '14px', borderRadius: 12, backgroundColor: '#ef4444', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Sí, cancelar
                </button>
              </div>
            </div>
          )}

          {status === 'cancelled' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: '#22c55e', margin: '0 0 10px' }}>Reserva cancelada</h2>
              <p style={{ color: '#8D94A5', marginBottom: 24 }}>Tu reserva ha sido cancelada exitosamente. Esperamos verte pronto en Zona Élite.</p>
              <a href="https://zonaelitemarinilla.com" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: '#F5B927', color: '#12141A', borderRadius: 10, textDecoration: 'none', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 }}>
                Ir a la app
              </a>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ color: '#ef4444', margin: '0 0 10px' }}>Error al cancelar</h2>
              <p style={{ color: '#8D94A5' }}>{errorMsg}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
