import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, AlertCircle, CheckCircle2, LogOut, X, Trash2, CalendarPlus, Bell, ChevronDown, Calendar, Clock, Menu, ClipboardList, Plus, Crown
} from 'lucide-react';
import { format, addDays, subDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { slotsApi } from '../api/slots';
import { bookingsApi } from '../api/bookings';
import { notificationsApi, Notification } from '../api/notifications';
import { usersApi, User } from '../api/users';
import { plansApi, Plan } from '../api/plans';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';

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
  const hasFuerza = block.fuerza && !block.fuerza.is_blocked;
  const hasPers = block.personalizado && !block.personalizado.is_blocked;
  const fuerzaBookings = block.fuerza?.bookings?.length || 0;
  const personalizadoBookings = block.personalizado?.bookings?.length || 0;
  const persBlockedByRule = fuerzaBookings >= 3;
  const fuerzaBlockedByRule = personalizadoBookings >= 2;
  const showFuerza = hasFuerza && !fuerzaBlockedByRule;
  const showPers = hasPers && !persBlockedByRule;

  if (showFuerza && showPers) return <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-tight border border-purple-500/30">AMBAS</span>;
  if (showFuerza) return <span className="bg-primary/20 text-primary px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-tight border border-primary/30">ENTRENAMIENTO DE FUERZA</span>;
  if (showPers) return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-tight border border-emerald-500/30">ENTRENAMIENTO PERSONALIZADO</span>;
  return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-tight border border-red-500/30">BLOQUEADO</span>;
};

const playSuccessSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    const now = audioCtx.currentTime;
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.setValueAtTime(659.25, now + 0.1);
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (error) {}
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
    oscillator.frequency.setValueAtTime(440.00, now);
    oscillator.frequency.setValueAtTime(349.23, now + 0.1);
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (error) {}
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

export function AdminDashboard({ onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'calendario' | 'horarios' | 'usuarios' | 'planes'>('calendario');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [baseDate, setBaseDate] = useState<Date>(startOfToday());

  const [slots, setSlots] = useState<any[]>([]);
  const [calendarSlots, setCalendarSlots] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [plansList, setPlansList] = useState<Plan[]>([]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedBlockKey, setExpandedBlockKey] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFuerza, setCreateFuerza] = useState(true);
  const [createPersonalizado, setCreatePersonalizado] = useState(true);
  // Multi-date / multi-time block state (horarios de 1 hora fija)
  const [selectedDates, setSelectedDates] = useState<string[]>([format(new Date(), 'yyyy-MM-dd')]);
  const [timeBlocks, setTimeBlocks] = useState<{ start_time: string; end_time: string }[]>([
    { start_time: '08:00', end_time: '09:00' }
  ]);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempStartTime, setTempStartTime] = useState<string>('08:00');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', default_classes: 0, price: 0 });
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [showGlobalCreateUserModal, setShowGlobalCreateUserModal] = useState(false);
  const [userSelectData, setUserSelectData] = useState<{ slotId: number; modality: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', phone: '', cedula: '', plan_type: 'Entrenamiento Funcional - Plan Básico', payment_method: 'efectivo' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef<number | null>(null);
  const dates = Array.from({ length: 7 }).map((_, i) => addDays(baseDate, i));

  const fetchSlots = async () => {
    try {
      const response = await slotsApi.getAdminSlots();
      setSlots(response);
    } catch (error) {}
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll();
      const currentUnread = response.filter(n => !n.read).length;
      if (prevUnreadCountRef.current !== null && currentUnread > prevUnreadCountRef.current) playCancelSound();
      prevUnreadCountRef.current = currentUnread;
      setNotifications(response);
    } catch (error) {}
  };

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsersList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await plansApi.getAll();
      setPlansList(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchNotifications();
    fetchUsers();
    fetchPlans();
    const interval = setInterval(() => {
      fetchSlots();
      fetchNotifications();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filtered = slots.filter(s => s.date.startsWith(dateStr));
    setCalendarSlots(filtered);
  }, [selectedDate, slots]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleDeleteSlot = (fuerzaId?: number, personalizadoId?: number) => {
    setConfirmModal({
      title: '¿Eliminar horario?',
      message: '¿Estás seguro de que deseas eliminar este bloque de horario? Se cancelarán todas las reservas.',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          if (fuerzaId) await slotsApi.delete(fuerzaId);
          if (personalizadoId) await slotsApi.delete(personalizadoId);
          playCancelSound();
          showToast('¡Horario eliminado con éxito!');
          await fetchSlots();
        } catch (error: any) {
          showToast(error.message || 'Error al eliminar', 'error');
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
          playCancelSound();
          showToast('¡Reserva cancelada con éxito!');
          await fetchSlots();
        } catch (error: any) {
          showToast(error.message || 'Error al cancelar', 'error');
        }
      }
    });
  };

  // Toggle block/unblock a modality slot
  const handleToggleModality = async (slotId: number) => {
    try {
      const result = await slotsApi.toggleBlock(slotId);
      showToast(result.message || 'Modalidad actualizada');
      await fetchSlots();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Error', 'error');
    }
  };

  // Add a missing modality to an existing time block
  const handleAddModality = async (block: any, modality: 'fuerza' | 'personalizado') => {
    try {
      const dateStr = block.date.includes('T') ? block.date.split('T')[0] : block.date;
      const st = block.start_time.length === 5 ? `${block.start_time}:00` : block.start_time;
      const [h, m] = st.replace(':00', '').split(':').map(Number);
      const endH = (h + 1) % 24;
      const et = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      await slotsApi.create({
        dates: [dateStr],
        timeBlocks: [{ start_time: st, end_time: et }],
        create_fuerza: modality === 'fuerza',
        create_personalizado: modality === 'personalizado'
      });
      showToast(`¡Modalidad ${modality === 'fuerza' ? 'Fuerza' : 'Personalizado'} agregada!`);
      playSuccessSound();
      await fetchSlots();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Error', 'error');
    }
  };

  // Remove (delete) a modality slot from a block, with confirmation
  const handleRemoveModality = (slotId: number, modalityName: string) => {
    setConfirmModal({
      title: `¿Eliminar ${modalityName}?`,
      message: `Se eliminará la modalidad ${modalityName} de este bloque. Las reservas existentes serán canceladas.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await slotsApi.delete(slotId);
          playCancelSound();
          showToast(`Modalidad ${modalityName} eliminada`);
          await fetchSlots();
        } catch (error: any) {
          showToast(error.message || 'Error', 'error');
        }
      }
    });
  };



  const handleCreateManualSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) { showToast('Agrega al menos una fecha', 'error'); return; }
    if (timeBlocks.length === 0) { showToast('Agrega al menos un horario', 'error'); return; }
    setIsCreating(true);
    try {
      const result = await slotsApi.create({
        dates: selectedDates,
        timeBlocks,
        create_fuerza: createFuerza,
        create_personalizado: createPersonalizado
      });
      showToast(result.message || '¡Horarios creados!');
      playSuccessSound();
      setShowManualModal(false);
      await fetchSlots();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Error al crear horario', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAdminCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSelectData) return;
    setIsCreating(true);
    try {
      let finalUserId = selectedUserId;
      if (isCreatingNewUser) {
        const { user } = await usersApi.create({ ...newUserData, role: 'client' });
        finalUserId = user.id;
      }
      if (!finalUserId) throw new Error("Debe seleccionar o crear un usuario");

      await bookingsApi.createAdmin(userSelectData.slotId, finalUserId);
      showToast('¡Reserva manual creada con éxito!');
      playSuccessSound();
      setShowUserSelectModal(false);
      setIsCreatingNewUser(false);
      setNewUserData({ name: '', email: '', phone: '', cedula: '', plan_type: 'Entrenamiento Funcional - Plan Básico', payment_method: 'efectivo' });
      await fetchSlots();
      await fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Error al crear reserva', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGlobalCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await usersApi.create({ ...newUserData, role: 'client' });
      showToast('¡Usuario creado con éxito!');
      playSuccessSound();
      setShowGlobalCreateUserModal(false);
      setNewUserData({ name: '', email: '', phone: '', cedula: '', plan_type: 'Entrenamiento Funcional - Plan Básico', payment_method: 'efectivo' });
      await fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.message || 'Error al crear usuario', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUserAdmin = async (id: string, data: { available_classes?: number, plan_type?: string, payment_method?: string }) => {
    try {
      // Si cambian el plan, podríamos actualizar las clases por defecto opcionalmente
      // pero para mantenerlo simple y seguro, si el usuario elige un plan,
      // actualizamos el nombre del plan en la BD
      await usersApi.updateClasses(id, data);
      showToast('Datos de usuario actualizados');
      setUsersList(usersList.map(u => u.id === id ? { ...u, ...data } : u));
    } catch (error: any) {
      showToast(error.message || 'Error', 'error');
    }
  };

  const handleDeleteUser = (id: string) => {
    setConfirmModal({
      title: '¿Eliminar Usuario?',
      message: '¿Estás seguro de que deseas eliminar a este usuario permanentemente? Se borrarán también todas sus reservas y evaluaciones asociadas.',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await usersApi.delete(id);
          playCancelSound();
          showToast('¡Usuario eliminado con éxito!');
          await fetchUsers();
        } catch (error: any) {
          showToast(error.message || 'Error al eliminar usuario', 'error');
        }
      }
    });
  };

  const handleDeleteNotifications = async () => {
    try {
      await notificationsApi.deleteAll();
      setNotifications([]);
      showToast('Notificaciones borradas');
    } catch (error: any) {
      showToast(error.message || 'Error al borrar notificaciones', 'error');
    }
  };


  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await plansApi.create(newPlan);
      showToast('¡Plan creado con éxito!');
      playSuccessSound();
      setShowPlanModal(false);
      setNewPlan({ name: '', default_classes: 0, price: 0 });
      await fetchPlans();
    } catch (error: any) {
      showToast(error.message || 'Error al crear plan', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlan = (id: number) => {
    setConfirmModal({
      title: '¿Eliminar Plan?',
      message: '¿Estás seguro de eliminar este plan?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await plansApi.delete(id);
          playCancelSound();
          showToast('¡Plan eliminado con éxito!');
          await fetchPlans();
        } catch (error: any) {
          showToast(error.message || 'Error al eliminar', 'error');
        }
      }
    });
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
  const calendarBlocks = groupAdminSlots(calendarSlots);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden text-foreground">
      {sidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 h-24 flex items-center justify-between border-b border-border shrink-0">
          <ZonaEliteLogo />
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('calendario'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendario' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
            <Calendar size={20} /> Calendario
          </button>
          <button onClick={() => { setActiveTab('horarios'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'horarios' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
            <Clock size={20} /> Gestión Horarios
          </button>
          <button onClick={() => { setActiveTab('usuarios'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'usuarios' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
            <Users size={20} /> Usuarios
          </button>
          <button onClick={() => { setActiveTab('planes'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'planes' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
            <ClipboardList size={20} /> Planes
          </button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-2xl font-bold tracking-wider font-heading uppercase">
              {activeTab === 'calendario' ? 'Calendario de Reservas' : activeTab === 'horarios' ? 'Gestión de Horarios' : activeTab === 'planes' ? 'Gestión de Planes' : 'Usuarios Registrados'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/30 mr-2 shadow-[0_0_15px_rgba(245,185,39,0.2)]">
              <Crown size={18} className="animate-pulse" />
              <span className="text-sm font-bold tracking-wide uppercase">
                ¡Bienvenido, Santiago Alzate!
              </span>
            </div>
            <div ref={notifRef} className="relative">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowNotifications(v => !v)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>}
              </button>
              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-secondary/50 border-b border-border text-sm font-bold uppercase tracking-wider flex justify-between items-center">
                    Notificaciones
                    <div className="flex items-center gap-3">
                      {notifications.length > 0 && (
                        <button onClick={handleDeleteNotifications} className="text-red-500 hover:underline text-xs normal-case">Borrar todas</button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="hover:bg-secondary rounded p-1"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">No hay notificaciones.</p> : (
                      <ul className="divide-y divide-border">
                        {notifications.map(n => (
                          <li key={n.id} className={`p-3 text-sm ${!n.read ? 'bg-primary/5 font-semibold' : 'text-muted-foreground'}`}>
                            <p>{n.message}</p>
                            <div className="flex justify-between items-center mt-1 text-xs">
                              <span className="opacity-50">{format(new Date(n.created_at), 'hh:mm a - dd/MM/yy')}</span>
                              {!n.read && <button onClick={() => notificationsApi.markAsRead(n.id).then(fetchNotifications)} className="text-primary hover:underline">Marcar leída</button>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">

          {/* TAB CALENDARIO */}
          {activeTab === 'calendario' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-base font-bold flex items-center gap-2"><Calendar className="text-primary" size={18} /> Selecciona una fecha</h3>
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
                      <button key={i} onClick={() => setSelectedDate(date)} className={`shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50 text-foreground'}`}>
                        <span className="text-xs uppercase font-semibold mb-1">{format(date, 'eee', { locale: es })}</span>
                        <span className="text-2xl font-heading font-bold">{format(date, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-base font-bold mb-2 flex items-center gap-2"><Clock className="text-primary" size={18} /> Horarios y Atletas del día</h3>
                {calendarBlocks.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No hay horarios programados para este día.</p> : (
                  <div className="space-y-4">
                    {calendarBlocks.map((block: any) => {
                      const blockKey = `${block.date}_${block.start_time}`;
                      const isExpanded = expandedBlockKey === blockKey;
                      const hasFuerza = block.fuerza;
                      const hasPers = block.personalizado;

                      return (
                        <div key={blockKey} className="border border-border rounded-xl overflow-hidden bg-background">
                          <div className="bg-secondary/30 px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpandedBlockKey(isExpanded ? null : blockKey)}>
                            <div className="flex items-center gap-4">
                              <span className="font-heading font-bold text-xl">{formatTo12Hour(block.start_time)}</span>
                              <div className="flex gap-2">
                                {hasFuerza && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase">Fuerza: {block.fuerza.bookings.length}/{block.fuerza.capacity}</span>}
                                {hasPers && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold uppercase">Pers: {block.personalizado.bookings.length}/{block.personalizado.capacity}</span>}
                              </div>
                            </div>
                            <ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {isExpanded && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border">
                              {/* Fuerza Column */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-xs font-bold uppercase text-primary">🏋️ Entre. Fuerza</h4>
                                  <div className="flex items-center gap-1">
                                    {hasFuerza ? (
                                      <>
                                        <button
                                          onClick={() => handleToggleModality(block.fuerza.id)}
                                          title={block.fuerza.is_blocked ? 'Activar modalidad' : 'Bloquear modalidad'}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                                            block.fuerza.is_blocked
                                              ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                              : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                                          }`}
                                        >
                                          {block.fuerza.is_blocked ? '🔓 Activar' : '🔒 Bloquear'}
                                        </button>
                                        <button
                                          onClick={() => handleRemoveModality(block.fuerza.id, 'Fuerza')}
                                          title="Eliminar modalidad Fuerza"
                                          className="text-[10px] font-bold px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                          ✕ Quitar
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleAddModality(block, 'fuerza')}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                                      >
                                        + Agregar
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {!hasFuerza ? <p className="text-xs text-muted-foreground italic">No disponible</p> : block.fuerza.is_blocked ? <p className="text-xs text-amber-400/80 italic">🔒 Bloqueada — no aparece a clientes</p> : (
                                  <>
                                    {block.fuerza.bookings.length > 0 && (
                                      <ul className="space-y-2 mb-3">
                                        {block.fuerza.bookings.map((b: any) => (
                                          <li key={b.booking_id} className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
                                            <div className="text-sm font-bold">{b.user_name}</div>
                                            <button onClick={() => handleCancelBooking(b.booking_id)} className="text-xs text-red-500 hover:underline">Cancelar</button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    <button onClick={() => { setUserSelectData({ slotId: block.fuerza.id, modality: 'Fuerza' }); setSelectedUserId(''); setIsCreatingNewUser(false); setShowUserSelectModal(true); }} className="w-full border border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors rounded-lg py-2 text-xs font-bold uppercase flex justify-center items-center gap-1">
                                      <Plus size={14} /> Añadir Cliente / Usuario
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* Personalizado Column */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-xs font-bold uppercase text-emerald-400">🎯 Entre. Pers.</h4>
                                  <div className="flex items-center gap-1">
                                    {hasPers ? (
                                      <>
                                        <button
                                          onClick={() => handleToggleModality(block.personalizado.id)}
                                          title={block.personalizado.is_blocked ? 'Activar modalidad' : 'Bloquear modalidad'}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                                            block.personalizado.is_blocked
                                              ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                              : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                                          }`}
                                        >
                                          {block.personalizado.is_blocked ? '🔓 Activar' : '🔒 Bloquear'}
                                        </button>
                                        <button
                                          onClick={() => handleRemoveModality(block.personalizado.id, 'Personalizado')}
                                          title="Eliminar modalidad Personalizado"
                                          className="text-[10px] font-bold px-2 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                          ✕ Quitar
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleAddModality(block, 'personalizado')}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                      >
                                        + Agregar
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {!hasPers ? <p className="text-xs text-muted-foreground italic">No disponible</p> : block.personalizado.is_blocked ? <p className="text-xs text-amber-400/80 italic">🔒 Bloqueada — no aparece a clientes</p> : (
                                  <>
                                    {block.personalizado.bookings.length > 0 && (
                                      <ul className="space-y-2 mb-3">
                                        {block.personalizado.bookings.map((b: any) => (
                                          <li key={b.booking_id} className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
                                            <div className="text-sm font-bold">{b.user_name}</div>
                                            <button onClick={() => handleCancelBooking(b.booking_id)} className="text-xs text-red-500 hover:underline">Cancelar</button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    <button onClick={() => { setUserSelectData({ slotId: block.personalizado.id, modality: 'Personalizado' }); setSelectedUserId(''); setIsCreatingNewUser(false); setShowUserSelectModal(true); }} className="w-full border border-dashed border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 transition-colors rounded-lg py-2 text-xs font-bold uppercase flex justify-center items-center gap-1">
                                      <Plus size={14} /> Añadir Cliente / Usuario
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB HORARIOS */}
          {activeTab === 'horarios' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold uppercase">Gestión de Bloques</h3>
                <button onClick={() => setShowManualModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  <CalendarPlus size={18} /> Añadir Horario
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6"><div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Users size={24} /></div><div><p className="text-3xl font-heading font-bold">{totalReservations}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Reservas</p></div></div>
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6"><div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500"><AlertCircle size={24} /></div><div><p className="text-3xl font-heading font-bold">{fullSlots}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Llenos</p></div></div>
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6"><div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={24} /></div><div><p className="text-3xl font-heading font-bold">{availableSlots}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Libres</p></div></div>
              </div>

              <div className="space-y-8">
                {groupedBlocks.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
                    No hay horarios aún.
                  </div>
                ) : (
                  Array.from(new Set(groupedBlocks.map((b: any) => b.date))).map((date: any) => {
                    const blocks = groupedBlocks.filter((b: any) => b.date === date);
                    return (
                      <div key={date} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Calendar size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold uppercase text-foreground text-lg">
                              {format(new Date(date.includes('T') ? date.split('T')[0] + 'T00:00:00' : date + 'T00:00:00'), 'EEEE, d', { locale: es })} de {format(new Date(date.includes('T') ? date.split('T')[0] + 'T00:00:00' : date + 'T00:00:00'), 'MMMM yyyy', { locale: es })}
                            </h4>
                            <p className="text-sm text-muted-foreground font-medium">{blocks.length} {blocks.length === 1 ? 'horario programado' : 'horarios programados'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {blocks.map((block: any) => {
                            const blockKey = `${block.date}_${block.start_time}`;
                            return (
                              <div key={blockKey} className="bg-card border border-border rounded-xl p-5 flex flex-col hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <span className="font-heading font-bold text-2xl tracking-tight block">{formatTo12Hour(block.start_time)}</span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mt-1">
                                      Fin: {formatTo12Hour(block.end_time)}
                                    </span>
                                  </div>
                                  <button onClick={() => handleDeleteSlot(block.fuerza?.id, block.personalizado?.id)} className="text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all" title="Eliminar Horario">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                  {getModalityLabel(block)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB USUARIOS */}
          {activeTab === 'usuarios' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-heading font-bold uppercase">Usuarios ({usersList.length})</h3>
                <button 
                  onClick={() => {
                    setNewUserData({ name: '', email: '', phone: '', cedula: '', plan_type: 'Entrenamiento Funcional - Plan Básico', payment_method: 'efectivo' });
                    setShowGlobalCreateUserModal(true);
                  }} 
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus size={18} /> Añadir Cliente
                </button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden w-full">
                <table className="w-full text-left border-collapse table-fixed text-[9px] sm:text-[10px] lg:text-sm">
                  <thead>
                    <tr className="border-b border-border text-[8px] sm:text-[9px] lg:text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-secondary/30">
                      <th className="px-1 py-2 lg:p-4 w-[12%] truncate" title="Nombre">Nombre</th>
                      <th className="px-1 py-2 lg:p-4 w-[14%] truncate" title="Email">Email</th>
                      <th className="px-1 py-2 lg:p-4 w-[10%] truncate" title="Teléfono">Teléfono</th>
                      <th className="px-1 py-2 lg:p-4 w-[10%] truncate" title="Cédula">Cédula</th>
                      <th className="px-1 py-2 lg:p-4 w-[14%] truncate" title="Plan">Plan</th>
                      <th className="px-1 py-2 lg:p-4 w-[10%] truncate" title="Pago">Pago</th>
                      <th className="px-1 py-2 lg:p-4 w-[10%] truncate" title="Clases Disp.">Clases</th>
                      <th className="px-1 py-2 lg:p-4 w-[10%] truncate" title="Registrado">Registro</th>
                      <th className="px-1 py-2 lg:p-4 w-[10%] text-center" title="Acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersList.length === 0 && <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">Cargando...</td></tr>}
                    {usersList.map((u: User) => (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-1 py-2 lg:p-4 font-bold truncate" title={u.name}>{u.name}</td>
                        <td className="px-1 py-2 lg:p-4 text-muted-foreground truncate" title={u.email}>{u.email}</td>
                        <td className="px-1 py-2 lg:p-4 text-muted-foreground truncate" title={u.phone || '-'}>{u.phone || '-'}</td>
                        <td className="px-1 py-2 lg:p-4 text-muted-foreground truncate" title={u.cedula || '-'}>{u.cedula || '-'}</td>
                        <td className="px-1 py-2 lg:p-4 truncate">
                          <select 
                            className="bg-background border border-border rounded px-0.5 py-0.5 text-[8px] sm:text-[9px] lg:text-sm text-foreground font-semibold focus:outline-none focus:border-primary w-full max-w-[120px] truncate"
                            value={u.plan_type || 'Sin Plan'}
                            onChange={(e) => {
                              if (e.target.value !== u.plan_type) {
                                handleUpdateUserAdmin(u.id, { plan_type: e.target.value });
                              }
                            }}
                          >
                            {!plansList.find(p => p.name === (u.plan_type || 'Sin Plan')) && <option value={u.plan_type || 'Sin Plan'}>{u.plan_type || 'Sin Plan'}</option>}
                            {plansList.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1 py-2 lg:p-4 truncate">
                          <select 
                            className="bg-background border border-border rounded px-0.5 py-0.5 text-[8px] sm:text-[9px] lg:text-sm text-foreground font-semibold focus:outline-none focus:border-primary w-full max-w-[90px] truncate"
                            value={u.payment_method || 'efectivo'}
                            onChange={(e) => {
                              if (e.target.value !== u.payment_method) {
                                handleUpdateUserAdmin(u.id, { payment_method: e.target.value });
                              }
                            }}
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="qr">QR</option>
                            <option value="transferencia">Transf.</option>
                          </select>
                        </td>
                        <td className="px-1 py-2 lg:p-4">
                          <input 
                            type="number" 
                            className="w-full max-w-[40px] lg:max-w-[64px] bg-background border border-border rounded px-0.5 py-0.5 text-center font-bold text-[8px] sm:text-[9px] lg:text-sm"
                            defaultValue={u.available_classes || 0}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== u.available_classes) handleUpdateUserAdmin(u.id, { available_classes: val });
                            }}
                          />
                        </td>
                        <td className="px-1 py-2 lg:p-4 text-muted-foreground truncate" title={format(new Date(u.created_at), 'dd/MM/yyyy')}>{format(new Date(u.created_at), 'dd/MM/yyyy')}</td>
                        <td className="px-1 py-2 lg:p-4 text-center">
                          {u.email !== 'zonaelite8@gmail.com' && (
                            <button 
                              onClick={() => handleDeleteUser(u.id)} 
                              className="text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white p-1.5 lg:p-2 rounded-lg transition-all" 
                              title="Eliminar Usuario"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB PLANES */}
          {activeTab === 'planes' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold uppercase mb-4">Gestión de Planes ({plansList.length})</h3>
                <button onClick={() => setShowPlanModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  <Plus size={18} /> Añadir Plan
                </button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden w-full">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border uppercase tracking-wider text-muted-foreground font-semibold bg-secondary/30">
                      <th className="px-4 py-4">Nombre del Plan</th>
                      <th className="px-4 py-4">Clases por Defecto</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plansList.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-muted-foreground">No hay planes creados.</td></tr>}
                    {plansList.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-4 font-bold">{p.name}</td>
                        <td className="px-4 py-4 text-muted-foreground">{p.default_classes}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => handleDeletePlan(p.id)} className="text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all" title="Eliminar Plan">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL AGREGAR CLIENTE MANUAL */}
      {showUserSelectModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowUserSelectModal(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <h3 className="font-heading font-bold uppercase text-base">Agregar a {userSelectData?.modality}</h3>
              <button type="button" onClick={() => setShowUserSelectModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdminCreateBooking} className="p-5 space-y-4">
              <div className="flex gap-2 mb-4 bg-secondary/30 p-1.5 rounded-xl border border-border">
                <button type="button" onClick={() => setIsCreatingNewUser(false)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${!isCreatingNewUser ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Seleccionar</button>
                <button type="button" onClick={() => setIsCreatingNewUser(true)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${isCreatingNewUser ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Crear Nuevo</button>
              </div>

              {!isCreatingNewUser ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Seleccionar Cliente Existente</label>
                  <select 
                    required={!isCreatingNewUser}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="">-- Seleccione --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Nombre Completo</label>
                    <input type="text" required={isCreatingNewUser} value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="Ej: Juan Pérez" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Correo Electrónico (Opc.)</label>
                    <input type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="ejemplo@correo.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Teléfono (Opc.)</label>
                      <input type="tel" value={newUserData.phone} onChange={e => setNewUserData({...newUserData, phone: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="3000000000" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Cédula (Opc.)</label>
                      <input type="text" value={newUserData.cedula} onChange={e => setNewUserData({...newUserData, cedula: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="10000000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Plan</label>
                      <select 
                        value={newUserData.plan_type} 
                        onChange={e => setNewUserData({...newUserData, plan_type: e.target.value})} 
                        className="w-full bg-background border border-border rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:border-primary"
                      >
                        {plansList.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Método de Pago</label>
                      <select 
                        value={newUserData.payment_method} 
                        onChange={e => setNewUserData({...newUserData, payment_method: e.target.value})} 
                        className="w-full bg-background border border-border rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="qr">QR</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isCreating || (!isCreatingNewUser && !selectedUserId)} className="w-full bg-primary text-primary-foreground font-heading font-bold tracking-wider py-3.5 rounded-xl hover:bg-primary/90 transition-colors uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {isCreating ? 'Guardando...' : 'Asignar Cupo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR CLIENTE GLOBAL */}
      {showGlobalCreateUserModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowGlobalCreateUserModal(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <h3 className="font-heading font-bold uppercase text-base">Crear Nuevo Cliente</h3>
              <button type="button" onClick={() => setShowGlobalCreateUserModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"><X size={20} /></button>
            </div>
            <form onSubmit={handleGlobalCreateUser} className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Nombre Completo</label>
                  <input type="text" required value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Correo Electrónico (Opc.)</label>
                  <input type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="ejemplo@correo.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Teléfono (Opc.)</label>
                    <input type="tel" value={newUserData.phone} onChange={e => setNewUserData({...newUserData, phone: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="3000000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Cédula (Opc.)</label>
                    <input type="text" value={newUserData.cedula} onChange={e => setNewUserData({...newUserData, cedula: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" placeholder="10000000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Plan</label>
                    <select 
                      value={newUserData.plan_type} 
                      onChange={e => setNewUserData({...newUserData, plan_type: e.target.value})} 
                      className="w-full bg-background border border-border rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:border-primary"
                    >
                      {plansList.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Método de Pago</label>
                    <select 
                      value={newUserData.payment_method} 
                      onChange={e => setNewUserData({...newUserData, payment_method: e.target.value})} 
                      className="w-full bg-background border border-border rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="qr">QR</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isCreating} className="w-full bg-primary text-primary-foreground font-heading font-bold tracking-wider py-3.5 rounded-xl hover:bg-primary/90 transition-colors uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {isCreating ? 'Guardando...' : 'Crear Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HORARIO - MULTI DATE / MULTI TIME */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowManualModal(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <div>
                <h3 className="font-heading font-bold uppercase text-base">Añadir Horarios</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Selecciona varios días y varios rangos de hora</p>
              </div>
              <button type="button" onClick={() => setShowManualModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateManualSlot} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

              {/* MODALIDADES */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Modalidades</label>
                <div className="flex items-center gap-6 bg-secondary/20 p-3.5 rounded-xl border border-border">
                  <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer select-none">
                    <input type="checkbox" checked={createFuerza} onChange={e => setCreateFuerza(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background accent-primary" /> 🏋️ Fuerza
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer select-none">
                    <input type="checkbox" checked={createPersonalizado} onChange={e => setCreatePersonalizado(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background accent-primary" /> 🎯 Personalizado
                  </label>
                </div>
              </div>

              {/* FECHAS */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">📅 Días ({selectedDates.length} seleccionado{selectedDates.length !== 1 ? 's' : ''})</label>
                <div className="space-y-2">
                  {selectedDates.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-semibold">
                        {format(new Date(d + 'T00:00:00'), "EEEE dd 'de' MMMM yyyy", { locale: es })}
                      </div>
                      <button type="button" onClick={() => setSelectedDates(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <CustomDatePicker
                      selectedDate={tempDate}
                      onChange={d => setTempDate(d)}
                      className="flex-1 justify-between px-4 py-2.5 bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const dateStr = format(tempDate, 'yyyy-MM-dd');
                        if (!selectedDates.includes(dateStr)) {
                          setSelectedDates(prev => [...prev, dateStr].sort());
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      <Plus size={13} /> Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* BLOQUES DE HORA */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">🕐 Horas de inicio <span className="normal-case font-normal text-muted-foreground/70">(cada clase dura 1 hora)</span></label>
                <div className="space-y-2">
                  {timeBlocks.map((tb, i) => (
                    <div key={i} className="flex items-center gap-3 bg-secondary/10 border border-border rounded-xl px-3 py-2">
                      <CustomTimePicker
                        value={tb.start_time}
                        onChange={t => {
                          const [h, m] = t.split(':').map(Number);
                          const endH = (h + 1) % 24;
                          const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                          setTimeBlocks(prev => prev.map((b, idx) => idx === i ? { start_time: t, end_time: endTime } : b));
                        }}
                        className="flex-1 justify-center bg-background text-sm"
                      />
                      <span className="text-muted-foreground text-xs">→ <strong>{(() => { const [h,m] = tb.start_time.split(':').map(Number); const endH=(h+1)%24; return `${String(endH).padStart(2,'0')}:${String(m).padStart(2,'0')}`; })()}</strong></span>
                      {timeBlocks.length > 1 && (
                        <button type="button" onClick={() => setTimeBlocks(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <CustomTimePicker
                      value={tempStartTime}
                      onChange={t => setTempStartTime(t)}
                      className="flex-1 justify-center bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const [h, m] = tempStartTime.split(':').map(Number);
                        const endH = (h + 1) % 24;
                        const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        const newBlock = { start_time: tempStartTime, end_time: endTime };
                        if (!timeBlocks.find(b => b.start_time === tempStartTime)) {
                          setTimeBlocks(prev => [...prev, newBlock].sort((a,b) => a.start_time.localeCompare(b.start_time)));
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      <Plus size={13} /> Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* RESUMEN */}
              {selectedDates.length > 0 && timeBlocks.length > 0 && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
                  <strong>Resumen:</strong> Se crearán hasta <strong>{selectedDates.length * timeBlocks.length}</strong> bloques de horario en {selectedDates.length} día{selectedDates.length !== 1 ? 's' : ''} con {timeBlocks.length} franja{timeBlocks.length !== 1 ? 's' : ''} horaria{timeBlocks.length !== 1 ? 's' : ''}.
                </div>
              )}

              <button type="submit" disabled={isCreating || selectedDates.length === 0 || timeBlocks.length === 0} className="w-full bg-primary text-primary-foreground font-heading font-bold tracking-wider py-3.5 rounded-xl hover:bg-primary/90 transition-colors uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {isCreating ? 'Creando...' : `Crear ${selectedDates.length * timeBlocks.length} Bloque${selectedDates.length * timeBlocks.length !== 1 ? 's' : ''}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowPlanModal(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <h3 className="font-heading font-bold uppercase text-base">Crear Nuevo Plan</h3>
              <button type="button" onClick={() => setShowPlanModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre del Plan</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-primary"
                  value={newPlan.name}
                  onChange={e => setNewPlan(s => ({ ...s, name: e.target.value }))}
                  placeholder="Ej: Plan 20 Clases"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Clases por defecto (0 para ilimitado)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-primary"
                  value={newPlan.default_classes}
                  onChange={e => setNewPlan(s => ({ ...s, default_classes: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <button type="submit" disabled={isCreating} className="w-full bg-primary text-primary-foreground font-heading font-bold tracking-wider py-3.5 rounded-xl hover:bg-primary/90 transition-colors uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {isCreating ? 'Guardando...' : 'Crear Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold' : 'bg-red-500/15 border-red-500/30 text-red-400 font-semibold'}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border bg-secondary/30"><h3 className="font-heading font-bold uppercase text-foreground">{confirmModal.title}</h3></div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-secondary transition text-sm font-semibold">Cancelar</button>
                <button type="button" onClick={() => confirmModal.onConfirm()} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition text-sm shadow-lg shadow-red-500/20">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
