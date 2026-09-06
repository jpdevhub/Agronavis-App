/** API contract — the shape of everything the Express API returns. */

import type {
  AdvisoryCategory,
  AdvisorySeverity,
  CropStatus,
  IrrigationType,
  Json,
  Language,
  MediaType,
  PriceDirection,
  SoilType,
  TaskStatus,
} from './database.types';

// ── Envelope ─────────────────────────────────────────────────────────────────
// Every endpoint returns this shape, success or failure. No exceptions.

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { count?: number; page?: number; pageSize?: number; cached?: boolean };
}

export interface ApiFailure {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// ── Farmer ───────────────────────────────────────────────────────────────────

export interface FarmerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  language: Language;
  state: string | null;
  district: string | null;
  village: string | null;
  avatarUrl: string | null;
  landHoldingAcres: number | null;
  primaryCrops: string[];
  irrigationType: IrrigationType | null;
  soilType: SoilType | null;
  onboardingComplete: boolean;
  twoFactorEnabled: boolean;
  yearsOfExperience: number | null;
  createdAt: string;
}

export interface UpdateFarmerPayload {
  fullName?: string;
  phone?: string | null;
  language?: Language;
  state?: string | null;
  district?: string | null;
  village?: string | null;
  avatarUrl?: string | null;
  landHoldingAcres?: number | null;
  primaryCrops?: string[];
  irrigationType?: IrrigationType | null;
  soilType?: SoilType | null;
  yearsOfExperience?: number | null;
  onboardingComplete?: boolean;
}

// ── Farms & fields ───────────────────────────────────────────────────────────

export interface Farm {
  id: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  irrigation: string | null;
  latitude: number | null;
  longitude: number | null;
  state: string | null;
  district: string | null;
  village: string | null;
  waterSource: string | null;
  createdAt: string;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface FarmField {
  id: string;
  farmId: string;
  name: string;
  areaAcres: number;
  areaHectares: number | null;
  centerLatitude: number | null;
  centerLongitude: number | null;
  polygon: Json;
  createdAt: string;
}

export interface CreateFieldPayload {
  farmId?: string;
  name: string;
  areaAcres: number;
  areaHectares?: number;
  polygon: Json;
  centerLatitude?: number;
  centerLongitude?: number;
}

// ── Crops & scans ────────────────────────────────────────────────────────────

export interface Crop {
  id: string;
  farmId: string;
  fieldId: string | null;
  name: string;
  variety: string | null;
  category: string | null;
  sownDate: string | null;
  harvestDate: string | null;
  status: CropStatus;
  createdAt: string;
}

export interface CropScan {
  id: string;
  farmId: string | null;
  cropId: string | null;
  imageUrl: string;
  detectedDisease: string | null;
  confidence: number | null;
  recommendation: string | null;
  scannedAt: string;
}

// ── Reference data ───────────────────────────────────────────────────────────

export interface CropVariety {
  id: string;
  cropType: string;
  cropCategory: string;
  variety: string;
  seasons: string[];
  growthDurationDays: number | null;
  avgYieldPerAcre: number | null;
  yieldUnit: string | null;
  waterRequirementMm: number | null;
  idealPh: { min: number | null; max: number | null };
  nutrientsKgPerAcre: { n: number | null; p: number | null; k: number | null };
}

export interface DiseaseReference {
  id: string;
  classKey: string;
  name: string;
  cropType: string;
  isHealthy: boolean;
  severity: string | null;
  description: string | null;
  symptoms: string[];
  treatment: string[];
  imageUrl: string | null;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export interface FarmTask {
  id: string;
  farmId: string;
  cropId: string | null;
  taskType: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  completedDate: string | null;
  status: TaskStatus;
  actionData: Json | null;
  createdAt: string;
}

// ── Soil ─────────────────────────────────────────────────────────────────────

export type NutrientLevel = 'High' | 'Medium' | 'Low' | 'N/A';

export interface SoilHealth {
  /** `lab` = a real soil test for this field; `regional` = district averages. */
  source: 'lab' | 'regional';
  phLevel: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organicCarbon: number | null;
  moistureLevel: number | null;
  testedDate: string | null;
  levels: { nitrogen: NutrientLevel; phosphorus: NutrientLevel; potassium: NutrientLevel };
}

// ── Weather ──────────────────────────────────────────────────────────────────

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  iconUrl: string;
  pressure: number;
  visibility: number;
  observedAt: string;
}

export interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  rainMm: number;
  windSpeed: number;
  description: string;
  icon: string;
  rainProbability: number;
}

export interface SolarDay {
  date: string;
  solarRadiation: number;
  et0: number;
  precipitation: number;
  temperatureMax: number;
  temperatureMin: number;
}

export interface WeatherBundle {
  current: CurrentWeather;
  forecast: ForecastDay[];
  solar: SolarDay[];
  /** ET₀ minus rainfall over the last 3 days, in mm. Drives irrigation advice. */
  waterDeficitMm: number | null;
  fetchedAt: string;
}

// ── Market ───────────────────────────────────────────────────────────────────

export interface MandiPrice {
  commodity: string;
  variety: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrivalDate: string;
}

export interface PriceTrend {
  commodity: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePct: number;
  direction: PriceDirection;
  history: { date: string; price: number }[];
}

export interface DashboardPrice {
  commodity: string;
  price: number;
  unit: string;
  market: string;
  trend: PriceDirection;
  changePct: number;
  arrivalDate: string;
}

// ── Advisory ─────────────────────────────────────────────────────────────────

export interface Advisory {
  id: string;
  farmId: string | null;
  fieldId: string | null;
  category: AdvisoryCategory;
  severity: AdvisorySeverity;
  title: string;
  body: string;
  source: string;
  read: boolean;
  validUntil: string | null;
  metadata: Json;
  createdAt: string;
}

// ── Community ────────────────────────────────────────────────────────────────

export interface PostAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  state: string | null;
  district: string | null;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  mediaType: MediaType | null;
  upvotes: number;
  replyCount: number;
  createdAt: string;
  author: PostAuthor | null;
  /** True when the requesting farmer wrote it — drives the delete affordance. */
  isOwn: boolean;
}

export interface CommunityReply {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: PostAuthor | null;
  isOwn: boolean;
}

// ── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Json;
  read: boolean;
  createdAt: string;
}

// ── Two-factor auth ──────────────────────────────────────────────────────────

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  manualKey: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

// ── Storage ──────────────────────────────────────────────────────────────────

export type UploadBucket = 'avatars' | 'community-media' | 'crop-scans';

export interface UploadResult {
  bucket: UploadBucket;
  path: string;
  publicUrl: string;
}
