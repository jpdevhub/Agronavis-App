import api from './api';
import { ApiResponse } from '../types/api.types';
import { Farm } from '../../../packages/shared-types/src/index';

export const farmService = {
  getMyFarms: () => api.get<ApiResponse<Farm[]>>('/farms'),
  getFarm: (id: string) => api.get<ApiResponse<Farm>>(`/farms/${id}`),
  createFarm: (data: Partial<Farm>) => api.post<ApiResponse<Farm>>('/farms', data),
  updateFarm: (id: string, data: Partial<Farm>) => api.put<ApiResponse<Farm>>(`/farms/${id}`, data),
  deleteFarm: (id: string) => api.delete(`/farms/${id}`),
};
