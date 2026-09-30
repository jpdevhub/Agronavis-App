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
  /**
   * Where the polygon actually sits, reverse-geocoded as it was drawn.
   *
   * The farm's coordinates have always come from the first field's centroid,
   * but its state and district came from onboarding and were never revisited —
   * so a farm could read "Punjab" while its land sat in Kolkata. Weather
   * follows the coordinates and soil follows the names, and the two described
   * different places.
   */
  state?: string;
  district?: string;
}

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

/**
 * The Soil Health Card figures behind a district estimate, unreduced.
 *
 * The dashboard shows one word per nutrient because the estimate collapses each
 * distribution to its dominant class. That discards how close the call was, and
 * every micronutrient — boron runs 40-50% deficient in much of India and never
 * reached the farmer.
 */
export interface NutrientSpread {
  high: number;
  medium: number;
  low: number;
}

export interface MicronutrientSpread {
  sufficient: number;
  deficient: number;
}

/** A crop the Soil Health Card scheme will advise on in a given state. */
export interface EligibleCrop {
  /** The scheme's own id, which its recommendation engine takes. */
  shcId: string;
  name: string;
  variety: string | null;
  /** Crop, variety, irrigation and season as the scheme presents them. */
  label: string;
}

export interface SoilReport {
  state: string;
  /** Null when no row matched the district and the state average was used. */
  district: string | null;
  /** 'district' is specific to the farmer's place; 'state' is an average. */
  scope: 'district' | 'state';
  /** Soil Health Card collection cycle, e.g. "2026-27". */
  cycle: string | null;
  /** Districts averaged — 1 for a district match. */
  districtsCovered: number;
  /** Samples behind the figures, the honest measure of how much to trust them. */
  samples: number;
  macro: {
    nitrogen: NutrientSpread;
    phosphorus: NutrientSpread;
    potassium: NutrientSpread;
    organicCarbon: NutrientSpread;
  };
  ph: { alkaline: number; acidic: number; neutral: number };
  ec: { saline: number; nonSaline: number };
  micro: {
    sulphur: MicronutrientSpread;
    iron: MicronutrientSpread;
    zinc: MicronutrientSpread;
    copper: MicronutrientSpread;
    boron: MicronutrientSpread;
    manganese: MicronutrientSpread;
  };
}

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

/** Which upstream answered, so the UI can be honest about the source. */
export type MandiSource =
  | 'agmarknet_district'
  | 'agmarknet_state'
  | 'enam_district'
  | 'enam_state'
  | 'cache'
  /** Every upstream was asked and none had a row for this place. */
  | 'none'
  /** No price source is configured, so nothing was asked at all. */
  | 'unconfigured';

export interface MandiSearchResult {
  rows: MandiPrice[];
  source: MandiSource;
  state: string;
  district: string;
}

/**
 * Agmarknet's own catalogue, mirrored server-side. Numeric ids are Agmarknet's,
 * so a price query keys on an id rather than guessing a spelling.
 */
export interface MandiStateRef {
  id: number;
  name: string;
}

export interface MandiDistrictRef {
  id: number;
  stateId: number;
  name: string;
}

export interface MandiMarketRef {
  id: number;
  stateId: number;
  districtId: number | null;
  name: string;
}

export interface MandiCommodityRef {
  id: number;
  name: string;
  groupName: string | null;
}

export interface MandiCatalogue {
  states: MandiStateRef[];
  districts: MandiDistrictRef[];
  markets: MandiMarketRef[];
  commodities: MandiCommodityRef[];
  syncedAt: string | null;
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

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Json;
  read: boolean;
  createdAt: string;
}

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  manualKey: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

export type UploadBucket = 'avatars' | 'community-media' | 'crop-scans';

export interface UploadResult {
  bucket: UploadBucket;
  path: string;
  publicUrl: string;
}
