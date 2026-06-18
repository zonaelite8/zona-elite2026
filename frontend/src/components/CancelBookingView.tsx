import { useState, useEffect } from 'react';
import { bookingsApi } from '../api/bookings';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CancelBookingViewProps {
  token: string;
}

export function CancelBookingView({ token }: CancelBookingViewProps) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await bookingsApi.getByToken(token);
        setBooking(data);
      } catch (err: any) {
        setError(err.message || 'Token inválido o reserva no encontrada');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [token]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingsApi.cancelByToken(token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la reserva');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in">
        <div className="p-6 text-center border-b border-border">
          <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            {success ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-heading font-bold uppercase tracking-wide">
            {success ? 'Reserva Cancelada' : 'Cancelar Reserva'}
          </h2>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                Tu reserva ha sido cancelada exitosamente y el cupo ha sido liberado. ¡Esperamos verte pronto!
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-primary w-full"
              >
                Volver al Inicio
              </button>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6">
                <p>{error}</p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-secondary w-full"
              >
                Volver al Inicio
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-center text-muted-foreground">
                Hola <strong>{booking?.user_name}</strong>, ¿estás seguro que deseas cancelar esta clase?
              </p>
              
              <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm uppercase font-bold tracking-wider">Modalidad</span>
                  <span className="text-primary font-bold uppercase">{booking?.modality}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm uppercase font-bold tracking-wider">Fecha</span>
                  <span className="font-medium text-foreground">
                    {booking?.date ? format(new Date(booking.date), "EEEE d 'de' MMMM", { locale: es }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm uppercase font-bold tracking-wider">Hora</span>
                  <span className="font-medium text-foreground">
                    {booking?.start_time ? booking.start_time.substring(0, 5) : ''}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="btn-secondary flex-1"
                  disabled={cancelling}
                >
                  Conservar
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-heading font-bold uppercase tracking-wider py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelando...' : 'Sí, Cancelar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
