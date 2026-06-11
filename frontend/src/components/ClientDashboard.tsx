import { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Activity, 
  Calendar, 
  Menu, 
  X, 
  Clock,
  LogOut,
  Trash2,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { format, addDays, subDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { slotsApi } from '../api/slots';
import { bookingsApi } from '../api/bookings';
import { authApi } from '../api/auth';
import { CustomDatePicker } from './CustomDatePicker';

function ZonaEliteLogo() {
  return (
    <div className="flex items-center gap-2 text-primary font-heading tracking-widest font-bold text-xl">
      <div className="w-8 h-8 border-2 border-primary rounded-lg flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute top-1.5 left-1.5 w-4 h-[2px] bg-primary transform -rotate-45 origin-left"></div>
        <div className="absolute bottom-1.5 left-1.5 w-5 h-[2px] bg-primary"></div>
        <div className="absolute top-1/2 left-1.5 w-4 h-[2px] bg-primary -translate-y-1/2"></div>
        <div className="absolute top-1.5 left-1.5 w-4 h-[2px] bg-primary"></div>
      </div>
      <div className="flex flex-col leading-none">
        <span>ZONA</span>
        <span>ÉLITE</span>
      </div>
    </div>
  );
}

// Groups slots by time block (date + start_time)
function groupSlotsByTime(slots: any[]) {
  const map: Record<string, { date: string; start_time: string; end_time: string; fuerza?: any; personalizado?: any }> = {};
  slots.forEach(slot => {
    const key = `${slot.date}_${slot.start_time}`;
    if (!map[key]) {
      map[key] = { date: slot.date, start_time: slot.start_time, end_time: slot.end_time };
    }
    map[key][slot.modality as 'fuerza' | 'personalizado'] = slot;
  });
  return Object.values(map).sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );
}

const playSuccessSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    const now = audioCtx.currentTime;
    
    // Ascending high chime
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (error) {
    console.warn('Audio playback blocked or failed:', error);
  }
};

const playCancelSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    const now = audioCtx.currentTime;
    
    // Descending soft chime
    oscillator.frequency.setValueAtTime(440.00, now); // A4
    oscillator.frequency.setValueAtTime(349.23, now + 0.1); // F4
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (error) {
    console.warn('Audio playback blocked or failed:', error);
  }
};

const formatTo12Hour = (timeStr: string) => {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minutes = minuteStr ? minuteStr.substring(0, 2) : '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const hourFormatted = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hourFormatted}:${minutes} ${ampm}`;
};

export function ClientDashboard({ onLogout, user, onLogin }: any) {
  const [activeTab, setActiveTab] = useState<'reservar' | 'historial'>('reservar');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [baseDate, setBaseDate] = useState<Date>(startOfToday());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [slots, setSlots] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [bookingModal, setBookingModal] = useState<{ slot: any; label: string } | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', cedula: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '', cedula: user.cedula || '' });
    }
  }, [user]);

  const dates = Array.from({ length: 7 }).map((_, i) => addDays(baseDate, i));



  const fetchSlots = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await slotsApi.getAll(dateStr);
      setSlots(res);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await bookingsApi.getMyBookings();
      setReservations(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === 'reservar') {
      fetchSlots();
      const interval = setInterval(fetchSlots, 6000);
      return () => clearInterval(interval);
    } else {
      fetchReservations();
    }
  }, [activeTab, selectedDate]);

  const handleBook = async () => {
    if (!bookingModal) return;
    setIsBooking(true);
    try {
      if (!user.phone || !user.cedula) {
        if (!profileForm.name || !profileForm.phone || !profileForm.cedula) {
          showToast('Por favor, completa todos los campos requeridos', 'error');
          setIsBooking(false);
          return;
        }
        const res = await authApi.updateProfile(profileForm.name, profileForm.phone, profileForm.cedula);
        if (onLogin) onLogin(res.token, res.user);
      }
      
      await bookingsApi.create(bookingModal.slot.id);
      playSuccessSound();
      showToast('¡Reserva confirmada!');
      setBookingModal(null);
      await fetchSlots();
    } catch (error: any) {
      showToast(error.message || 'Error al realizar la reserva', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = (id: number) => {
    setConfirmModal({
      title: '¿Cancelar reserva?',
      message: '¿Estás seguro de que deseas cancelar esta reserva?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await bookingsApi.cancel(id);
          playCancelSound();
          showToast('¡Reserva cancelada con éxito!');
          await fetchReservations();
        } catch (error: any) {
          showToast(error.message || 'Error al cancelar', 'error');
        }
      }
    });
  };

  const timeBlocks = groupSlotsByTime(slots);

  const getSlotButtonProps = (slot: any | undefined, block?: any) => {
    if (!slot) return { label: 'No disp.', style: 'opacity-0 pointer-events-none', clickable: false };
    
    // Check if user already booked this exact time block
    let hasBookingInBlock = false;
    if (block) {
      const blockDateStr = new Date(block.date).toISOString().split('T')[0];
      hasBookingInBlock = reservations.some(res => {
        const resDateStr = new Date(res.date).toISOString().split('T')[0];
        return resDateStr === blockDateStr && res.start_time.substring(0,5) === block.start_time.substring(0,5);
      });
    }

    if (hasBookingInBlock) {
      return {
        label: 'Ya reservaste',
        style: 'border-primary/50 text-primary bg-primary/10 cursor-not-allowed',
        clickable: false,
        icon: <CheckCircle2 size={12} />
      };
    }

    const isFull = slot.bookings_count >= slot.capacity;
    const isBlockedByAdmin = slot.is_blocked;
    const isBlockedByRule = slot.cross_blocked;
    const spotsLeft = slot.capacity - slot.bookings_count;

    if (isBlockedByAdmin || isBlockedByRule) return {
      label: isBlockedByAdmin ? 'Bloqueado por Admin' : 'Bloqueado',
      style: 'border-secondary text-muted-foreground bg-secondary/40 cursor-not-allowed',
      clickable: false,
      icon: <Lock size={12} />
    };
    if (isFull) return {
      label: 'Lleno',
      style: 'border-red-500/30 text-red-500 bg-red-500/10 cursor-not-allowed',
      clickable: false
    };
    return {
      label: `Reservar (${spotsLeft} libre${spotsLeft !== 1 ? 's' : ''})`,
      style: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer',
      clickable: true
    };
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden text-foreground">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 h-24 flex items-center justify-between border-b border-border shrink-0">
          <ZonaEliteLogo />
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('reservar'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reservar' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            <Calendar size={20} /> Reservar Horario
          </button>
          <button
            onClick={() => { setActiveTab('historial'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'historial' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            <Clock size={20} /> Mis Reservas
          </button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-2xl font-bold tracking-wider font-heading uppercase">
              {activeTab === 'reservar' ? 'Reservar Horario' : 'Mis Reservas'}
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-secondary/50 py-2 px-4 rounded-full border border-border">
            <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center border border-primary/50 text-primary font-bold text-xs uppercase">
              {user?.name?.substring(0, 2) || 'CL'}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name || 'Cliente'}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">

          {/* TAB: RESERVAR */}
          {activeTab === 'reservar' && (
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Date selector */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Calendar className="text-primary" size={18} /> Selecciona una fecha
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setBaseDate(subDays(baseDate, 7))} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-bold">&lt;</button>
                    <CustomDatePicker 
                      selectedDate={selectedDate} 
                      onChange={(d) => {
                        setSelectedDate(d);
                        setBaseDate(d);
                      }} 
                    />
                    <button onClick={() => setBaseDate(addDays(baseDate, 7))} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-bold">&gt;</button>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((date, i) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50 text-foreground'}`}
                      >
                        <span className="text-xs uppercase font-semibold mb-1">{format(date, 'eee', { locale: es })}</span>
                        <span className="text-2xl font-heading font-bold">{format(date, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time blocks */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                  <Clock className="text-primary" size={18} /> Horarios disponibles
                </h3>
                <p className="text-xs text-muted-foreground mb-5">
                  Regla: si hay 3+ personas en Fuerza → Personalizado se bloquea. Si hay 2 en Personalizado → Fuerza se bloquea.
                </p>

                {timeBlocks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No hay horarios para este día.</p>
                ) : (
                  <div className="space-y-3">
                    {timeBlocks.map((block) => {
                      const fuerzaProps = getSlotButtonProps(block.fuerza, block);
                      const persProps = getSlotButtonProps(block.personalizado, block);

                      return (
                        <div key={`${block.date}_${block.start_time}`} className="border border-border rounded-xl overflow-hidden">
                          {/* Time header */}
                          <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between">
                            <span className="font-heading font-bold text-lg">{formatTo12Hour(block.start_time)}</span>
                            <span className="text-xs text-muted-foreground">→ {formatTo12Hour(block.end_time)}</span>
                          </div>

                          {/* Modalities row */}
                          <div className="grid grid-cols-2 gap-px bg-border">

                            {/* FUERZA */}
                            <div className={`p-4 bg-card flex flex-col gap-2 ${!fuerzaProps.clickable ? '' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Dumbbell size={14} className="text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">Entre. Fuerza</span>
                                {block.fuerza && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {block.fuerza.bookings_count}/{block.fuerza.capacity}
                                  </span>
                                )}
                              </div>
                              {block.fuerza ? (
                                <button
                                  disabled={!fuerzaProps.clickable}
                                  onClick={() => fuerzaProps.clickable && setBookingModal({ slot: block.fuerza, label: 'Entrenamiento Fuerza' })}
                                  className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${fuerzaProps.style}`}
                                >
                                  {fuerzaProps.icon}
                                  {fuerzaProps.label}
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Sin horario</span>
                              )}
                            </div>

                            {/* PERSONALIZADO */}
                            <div className="p-4 bg-card flex flex-col gap-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Activity size={14} className="text-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Entre. Pers.</span>
                                {block.personalizado && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {block.personalizado.bookings_count}/{block.personalizado.capacity}
                                  </span>
                                )}
                              </div>
                              {block.personalizado ? (
                                <button
                                  disabled={!persProps.clickable}
                                  onClick={() => persProps.clickable && setBookingModal({ slot: block.personalizado, label: 'Entrenamiento Personalizado' })}
                                  className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${persProps.style}`}
                                >
                                  {persProps.icon}
                                  {persProps.label}
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Sin horario</span>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {reservations.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-heading font-bold mb-2">No tienes reservas activas</h3>
                  <p className="text-muted-foreground">Ve a "Reservar Horario" para agendar tu próxima sesión.</p>
                </div>
              ) : (
                reservations.map(res => (
                  <div key={res.booking_id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center border border-border shrink-0">
                        <span className="text-xs uppercase font-semibold text-muted-foreground">{format(new Date(res.date), 'eee', { locale: es })}</span>
                        <span className="text-xl font-heading font-bold">{format(new Date(res.date), 'd')}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {res.modality === 'fuerza'
                            ? <Dumbbell size={14} className="text-primary" />
                            : <Activity size={14} className="text-emerald-400" />}
                          <h4 className="font-heading font-bold uppercase text-sm">{res.modality}</h4>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-1">
                          <Clock size={12} /> {formatTo12Hour(res.start_time)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(res.booking_id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={14} /> Cancelar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de confirmación */}
      {bookingModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setBookingModal(null); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border bg-secondary/30">
              <h3 className="font-heading font-bold uppercase">Confirmar Reserva</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-4">
                Estás reservando un turno de{' '}
                <strong className="text-foreground">{bookingModal.label}</strong> para el{' '}
                <strong className="text-foreground">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</strong>{' '}
                a las{' '}
                <strong className="text-foreground">{formatTo12Hour(bookingModal.slot.start_time)}</strong>.
              </p>
              
              {(!user.phone || !user.cedula) && (
                <div className="mb-6 space-y-4 bg-secondary/20 p-4 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Completa tu perfil para continuar
                  </p>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Teléfono (WhatsApp)</label>
                    <input
                      type="tel"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Ej: 3001234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cédula</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      value={profileForm.cedula}
                      onChange={(e) => setProfileForm({ ...profileForm, cedula: e.target.value })}
                      placeholder="Tu número de documento"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setBookingModal(null)}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-secondary transition text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBook}
                  disabled={isBooking}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition text-sm disabled:opacity-60"
                >
                  {isBooking ? 'Procesando...' : (!user.phone || !user.cedula ? 'Guardar y Reservar' : '✓ Confirmar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold' 
            : 'bg-red-500/15 border-red-500/30 text-red-400 font-semibold'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border bg-secondary/30">
              <h3 className="font-heading font-bold uppercase text-foreground">{confirmModal.title}</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-secondary transition text-sm font-semibold"
                >
                  No, volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition text-sm shadow-lg shadow-red-500/20"
                >
                  Sí, continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
