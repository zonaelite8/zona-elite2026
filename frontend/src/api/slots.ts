/**
 * api/slots.ts
 * Training-slot API calls.
 */
import { api } from './client'

export interface Slot {
  id: number
  modality: 'fuerza' | 'personalizado'
  date: string
  start_time: string
  end_time: string
  capacity: number
  bookings_count: number
  spots_left: number
  is_blocked?: boolean
}

export const slotsApi = {
  getAll: (date?: string) =>
    api.get<Slot[]>(date ? `/slots?date=${date}` : '/slots'),

  getAdminSlots: (date?: string) =>
    api.get<any[]>(date ? `/slots/admin?date=${date}` : '/slots/admin'),

  create: (payload: {
    dates: string[];
    timeBlocks: { start_time: string; end_time: string }[];
    create_fuerza?: boolean;
    create_personalizado?: boolean;
  }) =>
    api.post<{ message: string; slots: Slot[]; skipped: any[] }>('/slots', payload),

  createWeekly: (payload: { startDate: string; endDate: string }) =>
    api.post<{ message: string }>('/slots/weekly', payload),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/slots/${id}`),

  toggleBlock: (id: number) =>
    api.put<{ message: string; slot: Slot }>(`/slots/${id}/toggle-block`, {}),
}
