import api from './api';
import { ApiResponse } from '../types/api.types';
import { WeatherData, Advisory } from '../../../packages/shared-types/src/index';

export const weatherService = {
  getCurrentWeather: (lat: number, lon: number) =>
    api.get<ApiResponse<WeatherData>>(`/weather/current?lat=${lat}&lon=${lon}`),
  getForecast: (lat: number, lon: number) =>
    api.get<ApiResponse<WeatherData[]>>(`/weather/forecast?lat=${lat}&lon=${lon}`),
};

export const advisoryService = {
  getAdvisories: (farmId: string) => api.get<ApiResponse<Advisory[]>>(`/advisory?farmId=${farmId}`),
  getAdvisory: (id: string) => api.get<ApiResponse<Advisory>>(`/advisory/${id}`),
};
