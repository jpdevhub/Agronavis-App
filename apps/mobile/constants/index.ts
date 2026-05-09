// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = 'Agronavis';
export const APP_VERSION = '1.0.0';

// ── API ───────────────────────────────────────────────────────────────────────
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
export const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 30000);

// ── Storage Keys ──────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@agronavis/auth_token',
  USER_PROFILE: '@agronavis/user_profile',
  ONBOARDING_COMPLETE: '@agronavis/onboarding_complete',
  SELECTED_FARM: '@agronavis/selected_farm',
  LANGUAGE: '@agronavis/language',
} as const;

// ── Supported Languages ───────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

// ── Indian States ─────────────────────────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const;

// ── Crop Categories ───────────────────────────────────────────────────────────
export const CROP_CATEGORIES = [
  'Cereals', 'Pulses', 'Oilseeds', 'Vegetables', 'Fruits',
  'Spices', 'Fibers', 'Sugarcane', 'Plantation Crops',
] as const;

// ── Soil Types ────────────────────────────────────────────────────────────────
export const SOIL_TYPES = [
  'Alluvial', 'Black Cotton', 'Red Laterite', 'Mountain', 'Desert Sandy',
  'Saline', 'Peaty & Marshy',
] as const;

// ── Irrigation Types ──────────────────────────────────────────────────────────
export const IRRIGATION_TYPES = [
  'Drip', 'Sprinkler', 'Flood', 'Furrow', 'Rainfed',
] as const;
