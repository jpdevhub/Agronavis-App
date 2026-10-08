import type {
  Advisory,
  AppNotification,
  CommunityPost,
  CommunityReply,
  CreateFieldPayload,
  Crop,
  CropScan,
  CropStatus,
  DashboardPrice,
  DiseaseReference,
  Farm,
  FarmField,
  FarmTask,
  FarmerProfile,
  MandiCommodityRef,
  MandiDistrictRef,
  MandiMarketRef,
  MandiSearchResult,
  MandiStateRef,
  PriceTrend,
  SoilHealth,
  DiseasePrediction,
  EligibleCrop,
  SoilReport,
  TwoFactorSetup,
  TwoFactorStatus,
  UpdateFarmerPayload,
  UploadBucket,
  UploadResult,
  WeatherBundle,
} from '@agronavis/shared-types';
import { api } from './api';

export const authApi = {
  me: () =>
    api.get<{ user: { id: string; email: string | null }; profile: FarmerProfile; twoFactor: TwoFactorStatus }>(
      '/auth/me',
    ),
  twoFactorStatus: () => api.get<TwoFactorStatus>('/auth/2fa/status'),
  setupTwoFactor: () => api.post<TwoFactorSetup>('/auth/2fa/setup'),
  verifyTwoFactor: (token: string) => api.post<TwoFactorStatus>('/auth/2fa/verify', { token }),
  verifyBackupCode: (code: string) => api.post<TwoFactorStatus>('/auth/2fa/verify-backup', { code }),
  regenerateBackupCodes: (token: string) =>
    api.post<{ backupCodes: string[] }>('/auth/2fa/backup-codes', { token }),
  disableTwoFactor: (token: string) => api.delete<TwoFactorStatus>('/auth/2fa', { token }),
};

export const farmerApi = {
  me: () => api.get<FarmerProfile>('/farmers/me'),
  update: (payload: UpdateFarmerPayload) => api.patch<FarmerProfile>('/farmers/me', payload),
  registerPushToken: (token: string) => api.post<void>('/farmers/me/push-token', { token }),
};

export const farmApi = {
  list: () => api.get<Farm[]>('/farms'),
  get: (id: string) => api.get<Farm>(`/farms/${id}`),
  update: (id: string, payload: Partial<Farm>) => api.patch<Farm>(`/farms/${id}`, payload),

  listFields: () => api.get<FarmField[]>('/farms/fields'),
  getField: (id: string) => api.get<FarmField>(`/farms/fields/${id}`),
  createField: (payload: CreateFieldPayload) => api.post<FarmField>('/farms/fields', payload),
  renameField: (id: string, name: string) => api.patch<FarmField>(`/farms/fields/${id}`, { name }),
  deleteField: (id: string) => api.delete(`/farms/fields/${id}`),
};

export const cropApi = {
  /**
   * Classifies a leaf photograph. Runs on the server, so the model ships once
   * rather than inside every APK.
   */
  diagnose: (uri: string) =>
    api.upload<DiseasePrediction>('/crops/diagnose', uri, 'scan.jpg', 'image/jpeg', 'image'),
  /** Crops the scheme will advise on where this field is. */
  eligible: (fieldId: string) => api.get<EligibleCrop[]>('/crops/eligible', { fieldId }),
  list: (params?: { fieldId?: string; status?: CropStatus }) => api.get<Crop[]>('/crops', params),
  create: (payload: Partial<Crop> & { name: string }) => api.post<Crop>('/crops', payload),
  update: (id: string, payload: Partial<Crop>) => api.patch<Crop>(`/crops/${id}`, payload),
  remove: (id: string) => api.delete(`/crops/${id}`),

  listScans: () => api.get<CropScan[]>('/crops/scans'),
  recordScan: (payload: {
    farmId?: string;
    cropId?: string;
    imageUrl: string;
    detectedDisease?: string;
    confidence?: number;
    recommendation?: string;
  }) => api.post<CropScan>('/crops/scans', payload),
  diseases: (params?: { cropType?: string; search?: string }) =>
    api.get<DiseaseReference[]>('/crops/diseases', params),
  diseaseReference: (classKey: string) =>
    api.get<DiseaseReference>(`/crops/diseases/${encodeURIComponent(classKey)}`),
};

export const taskApi = {
  list: (farmId?: string) => api.get<FarmTask[]>('/tasks', farmId ? { farmId } : undefined),
  complete: (id: string) => api.patch<FarmTask>(`/tasks/${id}/complete`),
  skip: (id: string) => api.patch<FarmTask>(`/tasks/${id}/skip`),
  create: (payload: { farmId: string; title: string; dueDate: string; description?: string; taskType?: string }) =>
    api.post<FarmTask>('/tasks', payload),
};

export const soilApi = {
  /**
   * The Soil Health Card figures behind a district estimate, unreduced. Keyed on
   * the farm so it describes the same place the weather does.
   */
  report: (params: { fieldId?: string; farmId?: string; state?: string; district?: string }) =>
    api.get<SoilReport | null>('/soil/report', {
      ...(params.fieldId ? { fieldId: params.fieldId } : {}),
      ...(params.farmId ? { farmId: params.farmId } : {}),
      ...(params.state ? { state: params.state } : {}),
      ...(params.district ? { district: params.district } : {}),
    }),
  forField: (fieldId: string) => api.get<SoilHealth | null>(`/soil/field/${fieldId}`),
  history: (fieldId: string) => api.get<SoilHealth[]>(`/soil/field/${fieldId}/history`),
};

export const weatherApi = {
  byCoords: (lat: number, lon: number) => api.get<WeatherBundle>('/weather', { lat, lon }),
  byFarm: (farmId: string) => api.getWithMeta<WeatherBundle>(`/weather/farm/${farmId}`),
  /** Weather where the field is, which a farm's single location cannot express. */
  byField: (fieldId: string) => api.getWithMeta<WeatherBundle>(`/weather/field/${fieldId}`),
};

export const marketApi = {
  /** Mandi prices for a place. The API narrows outward until a source answers. */
  mandi: (params: { state: string; district?: string; commodity?: string; limit?: number }) =>
    api.get<MandiSearchResult>('/market/mandi', params),
  dashboard: (state: string, crops?: string[]) =>
    api.get<DashboardPrice[]>('/market/dashboard', {
      state,
      ...(crops?.length ? { crops: crops.join(',') } : {}),
    }),
  trend: (commodity: string, state: string) =>
    api.get<PriceTrend | null>('/market/trend', { commodity, state }),

  /**
   * Agmarknet's catalogue, one dropdown at a time. The full tree is ~5000 rows,
   * and a farmer only needs one state's districts and one district's mandis.
   */
  states: () => api.get<MandiStateRef[]>('/market/catalogue/states'),
  districts: (stateId: number) =>
    api.get<MandiDistrictRef[]>('/market/catalogue/districts', { stateId }),
  markets: (stateId: number, districtId?: number) =>
    api.get<MandiMarketRef[]>('/market/catalogue/markets', {
      stateId,
      ...(districtId !== undefined ? { districtId } : {}),
    }),
  commodities: () => api.get<MandiCommodityRef[]>('/market/catalogue/commodities'),
};

export const advisoryApi = {
  list: (params?: { farmId?: string; unreadOnly?: boolean; limit?: number }) =>
    api.getWithMeta<Advisory[]>('/advisory', params),
  forFarm: (farmId: string) => api.getWithMeta<Advisory[]>(`/advisory/farm/${farmId}`),
  generate: (farmId: string) => api.post<Advisory[]>(`/advisory/farm/${farmId}/generate`),
  markRead: (id: string) => api.patch<Advisory>(`/advisory/${id}/read`),
  markAllRead: (farmId?: string) =>
    api.patch<{ updated: number }>(`/advisory/read-all${farmId ? `?farmId=${farmId}` : ''}`),
  reportPest: (farmId: string, disease: string, confidence: number) =>
    api.post<Advisory>(`/advisory/farm/${farmId}/pest`, { disease, confidence }),
};

export const communityApi = {
  listPosts: (params?: { limit?: number; offset?: number }) =>
    api.get<CommunityPost[]>('/community/posts', params),
  createPost: (payload: { title: string; content: string; imageUrl?: string; mediaType?: 'image' | 'video' }) =>
    api.post<CommunityPost>('/community/posts', payload),
  deletePost: (id: string) => api.delete(`/community/posts/${id}`),
  vote: (id: string, direction: 'up' | 'down') =>
    api.post<{ upvotes: number }>(`/community/posts/${id}/vote`, { direction }),
  listReplies: (postId: string) => api.get<CommunityReply[]>(`/community/posts/${postId}/replies`),
  addReply: (postId: string, content: string) =>
    api.post<CommunityReply>(`/community/posts/${postId}/replies`, { content }),
  deleteReply: (id: string) => api.delete(`/community/replies/${id}`),
};

export const notificationApi = {
  list: () => api.getWithMeta<AppNotification[]>('/notifications'),
  markRead: (id: string) => api.patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ updated: number }>('/notifications/read-all'),
};

export const storageApi = {
  upload: (bucket: UploadBucket, uri: string, name: string, type: string) =>
    api.upload<UploadResult>(`/storage/${bucket}`, uri, name, type),
  /** Private buckets serve signed URLs; call this when one has expired. */
  signedUrl: (bucket: UploadBucket, path: string) =>
    api.get<UploadResult>(`/storage/${bucket}/signed-url`, { path }),
  remove: (bucket: UploadBucket, path: string) => api.delete(`/storage/${bucket}`, { path }),
};
