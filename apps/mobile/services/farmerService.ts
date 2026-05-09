import api from './api';
import { ApiResponse } from '@types/api.types';
import { Farmer } from '@agronavis/shared-types';

export const farmerService = {
  /** Get current farmer's profile */
  getProfile: () => api.get<ApiResponse<Farmer>>('/farmers/me'),

  /** Create or update farmer profile during onboarding */
  upsertProfile: (data: Partial<Farmer>) => api.post<ApiResponse<Farmer>>('/farmers', data),

  /** Update farmer profile */
  updateProfile: (id: string, data: Partial<Farmer>) =>
    api.put<ApiResponse<Farmer>>(`/farmers/${id}`, data),
};
