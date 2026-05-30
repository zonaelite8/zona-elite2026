/**
 * api/bookings.ts
 * Booking API calls.
 */
import { api } from './client'

export interface Booking {
  booking_id: number
  booked_at: string
  slot_id: number
  modality: 'fuerza' | 'personalizado'
  date: string
  start_time: string
  end_time: string
}

export const bookingsApi = {
  getMyBookings: () =>
    api.get<Booking[]>('/bookings/my-bookings'),

  create: (slotId: number) =>
    api.post<{ booking: Booking }>('/bookings', { slotId }),

  cancel: (bookingId: number) =>
    api.delete<{ message: string }>(`/bookings/${bookingId}`),

  getAll: () =>
    api.get<Booking[]>('/bookings/all'),
}
