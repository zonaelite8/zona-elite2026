import { api } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  cedula?: string;
  plan_type: string;
  payment_method?: string;
  payment_amount?: number;
  payment_date?: string;
  expiration_date?: string;
  payment_status?: string;
  available_classes: number;
  created_at: string;
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  create: (data: { name: string; email: string; phone?: string; cedula?: string; role?: string; plan_type?: string; payment_method?: string; payment_amount?: number; payment_date?: string; expiration_date?: string; payment_status?: string }) => 
    api.post<{ message: string; user: User }>('/users', data),
  updateClasses: (id: string, data: { available_classes?: number, plan_type?: string, payment_method?: string, payment_amount?: number, payment_date?: string, expiration_date?: string, payment_status?: string }) => 
    api.put<{ message: string; user: User }>(`/users/${id}/classes`, data)
      .then(res => res.user),
  delete: (id: string) => api.delete<{ message: string }>(`/users/${id}`)
};
