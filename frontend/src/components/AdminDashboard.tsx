import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  X, 
  Trash2,
  CalendarPlus,
  Bell,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { slotsApi } from '../api/slots';
import { bookingsApi } from '../api/bookings';
import { notificationsApi, Notification } from '../api/notifications';

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

function groupAdminSlots(slots: any[]) {
  const map: Record<string, { date: string; start_time: string; end_time: string; fuerza?: any; personalizado?: any }> = {};
  slots.forEach(slot => {
    const dateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
    const key = `${dateStr}_${slot.start_time}`;
    if (!map[key]) {
      map[key] = { date: slot.date, start_time: slot.start_time, end_time: slot.end_time };
    }
    map[key][slot.modality as 'fuerza' | 'personalizado'] = slot;
  });
  return Object.values(map).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });
}

const getModalityLabel = (block: any) => {
  const fuerzaBookings = block.fuerza?.bookings?.length || 0;
  const personalizadoBookings = block.personalizado?.bookings?.length || 0;

  // Fuerza blocks personalizado if fuerzaBookings >= 3
  const persBlocked = fuerzaBookings >= 3;
  // Personalizado blocks fuerza if personalizadoBookings >= 2
  const fuerzaBlocked = personalizadoBookings >= 2;

  if (fuerzaBlocked) {
    return <span className="bg-chart-2/20 text-chart-2 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-chart-2/30">PERSONALIZADO</span>;
  }
  if (persBlocked) {
    return <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-primary/30">FUERZA</span>;
  }
  return <span className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-purple-500/30">AMBAS</span>;
};

export function AdminDashboard({ onLogout }: any) {
  const [slots, setSlots] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedBlockKey, setExpandedBlockKey] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [manualSlot, setManualSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '09:00'
  });
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


  const notifRef = useRef<HTMLDivElement>(null);


  const fetchSlots = async () => {
    try {
      const response = await slotsApi.getAdminSlots();
      setSlots(response);
    } catch (error) {
      console.error('Error fetching admin slots', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll();
      setNotifications(response);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleDeleteSlot = (fuerzaId?: number, personalizadoId?: number) => {
    setConfirmModal({
      title: '¿Eliminar horario?',
      message: '¿Estás seguro de que deseas eliminar este bloque de horario? Se cancelarán todas las reservas de ambas modalidades.',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          if (fuerzaId) await slotsApi.delete(fuerzaId);
          if (personalizadoId) await slotsApi.delete(personalizadoId);
          showToast('¡Horario eliminado con éxito!');
          await fetchSlots();
        } catch (error: any) {
          showToast(error.message || 'Error al eliminar horario', 'error');
        }
      }
    });
  };


  const handleCancelBooking = (bookingId: number) => {
    setConfirmModal({
      title: '¿Cancelar reserva?',
      message: '¿Estás seguro de que deseas cancelar la reserva de este usuario?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await bookingsApi.cancel(bookingId);
          showToast('¡Reserva cancelada con éxito!');
          await fetchSlots();
        } catch (error: any) {
          showToast(error.message || 'Error al cancelar reserva', 'error');
        }
      }
    });
  };

  const handleCreateManualSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const startWithSeconds = manualSlot.start_time.length === 5
        ? `${manualSlot.start_time}:00`
        : manualSlot.start_time;
      const endWithSeconds = manualSlot.end_time.length === 5
        ? `${manualSlot.end_time}:00`
        : manualSlot.end_time;

      await slotsApi.create({
        date: manualSlot.date,
        start_time: startWithSeconds,
        end_time: endWithSeconds
      });

      showToast('¡Horario creado con éxito!');
      setShowManualModal(false);
      setManualSlot({
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '09:00'
      });
      await fetchSlots();
    } catch (error: any) {
      showToast(error.message || 'Error al crear horario. Asegúrate de estar conectado como admin.', 'error');
    } finally {
      setIsCreating(false);
    }
  };


  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      await fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  // KPIs
  let totalReservations = 0;
  let fullSlots = 0;
  let availableSlots = 0;
  slots.forEach(slot => {
    const booked = slot.bookings.length;
    totalReservations += booked;
    if (booked >= slot.capacity) fullSlots++;
    else availableSlots++;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const groupedBlocks = groupAdminSlots(slots);

  return (

    <div className="min-h-screen bg-background flex flex-col text-foreground">

      {/* HEADER */}
      <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <ZonaEliteLogo />
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider hidden sm:block">Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">

          {/* Bell button */}
          <div ref={notifRef} className="relative">
            <button
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowNotifications(v => !v)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
              )}
            </button>

            {/* Notifications dropdown — scoped inside its own relative wrapper */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-secondary/50 border-b border-border text-sm font-bold uppercase tracking-wider flex justify-between items-center">
                  Notificaciones
                  <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No hay notificaciones.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {notifications.map(n => (
                        <li key={n.id} className={`p-3 text-sm ${!n.read ? 'bg-primary/5 font-semibold' : 'text-muted-foreground'}`}>
                          <p>{n.message}</p>
                          <div className="flex justify-between items-center mt-1 text-xs">
                            <span className="opacity-50">{format(new Date(n.created_at), 'HH:mm - dd/MM/yy')}</span>
                            {!n.read && (
                              <button onClick={() => handleMarkAsRead(n.id)} className="text-primary hover:underline">Marcar leída</button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-2 border-l border-border pl-4">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-8">
        <div className="space-y-8">

          {/* Title + Add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold uppercase">Gestión de Horarios</h1>
              <p className="text-muted-foreground mt-1">Administra los bloques de entrenamiento</p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <CalendarPlus size={20} />
              Añadir Horario
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Users size={24} /></div>
              <div><p className="text-3xl font-heading font-bold">{totalReservations}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Reservas</p></div>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500"><AlertCircle size={24} /></div>
              <div><p className="text-3xl font-heading font-bold">{fullSlots}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Horarios Llenos</p></div>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={24} /></div>
              <div><p className="text-3xl font-heading font-bold">{availableSlots}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Horarios Libres</p></div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-secondary/30">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Hora</th>
                  <th className="p-4">Modalidad</th>
                  <th className="p-4">Ocupación</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupedBlocks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      No hay horarios aún. Haz clic en <strong>"Añadir Horario"</strong>.
                    </td>
                  </tr>
                )}
                {groupedBlocks.map((block: any) => {
                  const dateStr = block.date.includes('T') ? block.date.split('T')[0] : block.date;
                  const blockKey = `${dateStr}_${block.start_time}`;
                  const isExpanded = expandedBlockKey === blockKey;

                  return (
                    <React.Fragment key={blockKey}>
                      <tr className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-semibold">{format(new Date(block.date), 'dd MMM yyyy', { locale: es })}</td>
                        <td className="p-4 font-heading font-bold text-lg">{block.start_time.substring(0, 5)}</td>
                        <td className="p-4">
                          {getModalityLabel(block)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2 max-w-[200px]">
                            {block.fuerza && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-12 font-medium">Fuerza:</span>
                                <span className={`text-xs font-bold w-8 ${block.fuerza.bookings.length >= block.fuerza.capacity ? 'text-red-500' : 'text-foreground'}`}>
                                  {block.fuerza.bookings.length}/{block.fuerza.capacity}
                                </span>
                                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${Math.min((block.fuerza.bookings.length / block.fuerza.capacity) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {block.personalizado && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-12 font-medium">Pers:</span>
                                <span className={`text-xs font-bold w-8 ${block.personalizado.bookings.length >= block.personalizado.capacity ? 'text-red-500' : 'text-foreground'}`}>
                                  {block.personalizado.bookings.length}/{block.personalizado.capacity}
                                </span>
                                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className="h-full bg-chart-2"
                                    style={{ width: `${Math.min((block.personalizado.bookings.length / block.personalizado.capacity) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setExpandedBlockKey(isExpanded ? null : blockKey)}
                              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs font-bold uppercase"
                            >
                              Atletas <ChevronDown size={14} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(block.fuerza?.id, block.personalizado?.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                              title="Eliminar Horario"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-secondary/10">
                          <td colSpan={5} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* FUERZA ATHLETES */}
                              <div>
                                <h4 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-1 border-b border-border pb-1">
                                  🏋️ Fuerza ({(block.fuerza?.bookings?.length || 0)}/{(block.fuerza?.capacity || 5)})
                                </h4>
                                {!block.fuerza || block.fuerza.bookings.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No hay reservas en Fuerza.</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {block.fuerza.bookings.map((b: any) => (
                                      <li key={b.booking_id} className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                                            {b.user_name?.charAt(0) || '?'}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold">{b.user_name}</p>
                                            <p className="text-xs text-muted-foreground">{b.user_email}</p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleCancelBooking(b.booking_id)}
                                          className="text-xs border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition"
                                        >
                                          Cancelar
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* PERSONALIZADO ATHLETES */}
                              <div>
                                <h4 className="text-xs font-bold uppercase text-chart-2 tracking-wider mb-3 flex items-center gap-1 border-b border-border pb-1">
                                  🎯 Personalizado ({(block.personalizado?.bookings?.length || 0)}/{(block.personalizado?.capacity || 2)})
                                </h4>
                                {!block.personalizado || block.personalizado.bookings.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No hay reservas en Personalizado.</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {block.personalizado.bookings.map((b: any) => (
                                      <li key={b.booking_id} className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                                            {b.user_name?.charAt(0) || '?'}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold">{b.user_name}</p>
                                            <p className="text-xs text-muted-foreground">{b.user_email}</p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleCancelBooking(b.booking_id)}
                                          className="text-xs border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition"
                                        >
                                          Cancelar
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: Añadir Horario */}
      {showManualModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowManualModal(false); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

            {/* Modal Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <CalendarPlus size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold uppercase text-base">Añadir Horario</h3>
                  <p className="text-xs text-muted-foreground">Nuevo bloque de entrenamiento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateManualSlot} className="p-5 space-y-4">

              {/* Info box */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
                <p className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Se crearán automáticamente</p>
                <p className="font-semibold text-foreground">🏋️ Fuerza — 5 cupos &nbsp;+&nbsp; 🎯 Personalizado — 2 cupos</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  📅 {manualSlot.date || '—'} &nbsp;|&nbsp; ⏰ {manualSlot.start_time} → {manualSlot.end_time}
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">📅 Fecha</label>
                <input
                  required
                  type="date"
                  value={manualSlot.date}
                  onChange={e => setManualSlot(s => ({ ...s, date: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">⏰ Inicio</label>
                  <input
                    required
                    type="time"
                    value={manualSlot.start_time}
                    onChange={e => setManualSlot(s => ({ ...s, start_time: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">⏰ Fin</label>
                  <input
                    required
                    type="time"
                    value={manualSlot.end_time}
                    onChange={e => setManualSlot(s => ({ ...s, end_time: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-primary text-primary-foreground font-heading font-bold tracking-wider py-3.5 rounded-xl hover:bg-primary/90 transition-colors uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Guardando...' : '✓ Crear Horario'}
              </button>
            </form>
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
