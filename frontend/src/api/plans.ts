import { api } from './client';

export interface Plan {
  id: number;
  name: string;
  default_classes: number;
  price: string;
  is_active: boolean;
  created_at: string;
}

export const plansApi = {
  getAll: async (): Promise<Plan[]> => {
    return await api.get<Plan[]>('/plans');
  },

  create: async (data: { name: string; default_classes?: number; price?: number }): Promise<Plan> => {
    return await api.post<Plan>('/plans', data);
  },

  update: async (id: number, data: { name?: string; default_classes?: number; price?: number; is_active?: boolean }): Promise<Plan> => {
    return await api.put<Plan>(`/plans/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<void>(`/plans/${id}`);
  }
};
