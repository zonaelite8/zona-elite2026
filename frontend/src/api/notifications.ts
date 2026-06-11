import { api } from './client'

export interface Notification {
  id: number
  message: string
  type: string
  read: boolean
  created_at: string
}

export const notificationsApi = {
  getAll: () =>
    api.get<Notification[]>('/admin/notifications'),

  markAsRead: (id: number) =>
    api.put<{ message: string }>(`/admin/notifications/${id}/read`),

  deleteAll: () =>
    api.delete<{ message: string }>('/admin/notifications'),
}
