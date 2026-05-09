// ─── Agronavis Shared TypeScript Definitions ─────────────────────────────────
// Used by both the mobile app (@agronavis/mobile) and the backend (@agronavis/backend)

// ── Enums ─────────────────────────────────────────────────────────────────────

export type IrrigationType = 'DRIP' | 'SPRINKLER' | 'FLOOD' | 'FURROW' | 'RAINFED';
export type SoilType = 'ALLUVIAL' | 'BLACK_COTTON' | 'RED_LATERITE' | 'MOUNTAIN' | 'DESERT_SANDY' | 'SALINE' | 'PEATY';
export type CropStatus = 'PLANTED' | 'GROWING' | 'HARVESTED' | 'FAILED';
export type AdvisoryType = 'IRRIGATION' | 'FERTILIZER' | 'PEST_CONTROL' | 'WEATHER_ALERT' | 'MARKET' | 'SCHEME';
export type AdvisoryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Language = 'en' | 'hi' | 'mr' | 'pa' | 'gu' | 'te' | 'kn';

// ── Core Entities ─────────────────────────────────────────────────────────────

export interface Farmer {
  id: string;
  clerkId: string;
  fullName: string;
  phone: string;
  state: string;
  district: string;
  village?: string;
  landHolding?: number;
  primaryCrops: string[];
  language: Language;
  irrigationType?: IrrigationType;
  soilType?: SoilType;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  name: string;
  state: string;
  district: string;
  village?: string;
  area: number;
  latitude?: number;
  longitude?: number;
  soilType?: SoilType;
  irrigationType?: IrrigationType;
  waterSource?: string;
  createdAt: string;
  updatedAt: string;
  crops?: Crop[];
}

export interface Crop {
  id: string;
  farmId: string;
  name: string;
  variety?: string;
  status: CropStatus;
  plantedAt: string;
  expectedHarvestAt?: string;
  actualHarvestAt?: string;
  areaUnderCrop?: number;
  seedSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  scanResults?: CropScanResult[];
}

export interface CropScanResult {
  id: string;
  cropId: string;
  imageUrl: string;
  disease?: string;
  confidence?: number;
  recommendations: string[];
  scannedAt: string;
}

export interface Advisory {
  id: string;
  farmId: string;
  type: AdvisoryType;
  priority: AdvisoryPriority;
  title: string;
  content: string;
  validFrom?: string;
  validUntil?: string;
  isRead: boolean;
  source?: string;
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  rainfall?: number;
  uvIndex?: number;
  timestamp: string;
}

export interface WeatherForecast {
  date: string;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  rainfall: number;
  description: string;
  icon: string;
}

export interface MarketPrice {
  commodity: string;
  variety?: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
}

export interface CommunityPost {
  id: string;
  farmerId: string;
  farmer?: Pick<Farmer, 'id' | 'fullName' | 'avatarUrl' | 'state' | 'district'>;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  farmerId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ── API Generics ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
