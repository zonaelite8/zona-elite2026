import { api } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  cedula?: string;
  plan_type: string;
  available_classes: number;
  created_at: string;
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  updateClasses: (id: string, data: { available_classes?: number, plan_type?: string }) => 
    api.put<{ message: string; user: User }>(`/users/${id}/classes`, data)
      .then(res => res.user),
  delete: (id: string) => api.delete<{ message: string }>(`/users/${id}`)
};
