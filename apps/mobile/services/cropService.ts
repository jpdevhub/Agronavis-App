import api from './api';
import { ApiResponse } from '../types/api.types';
import { Crop } from '../../../packages/shared-types/src/index';

export const cropService = {
  getCrops: (farmId: string) => api.get<ApiResponse<Crop[]>>(`/crops?farmId=${farmId}`),
  getCrop: (id: string) => api.get<ApiResponse<Crop>>(`/crops/${id}`),
  createCrop: (data: Partial<Crop>) => api.post<ApiResponse<Crop>>('/crops', data),
  updateCrop: (id: string, data: Partial<Crop>) => api.put<ApiResponse<Crop>>(`/crops/${id}`, data),
  deleteCrop: (id: string) => api.delete(`/crops/${id}`),
};
