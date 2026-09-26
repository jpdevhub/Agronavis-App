
export const APP_NAME = 'Agronavis';
export const APP_VERSION = '1.1.5';

export { Env, socketUrl } from './env';

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@agronavis/auth_token',
  USER_PROFILE: '@agronavis/user_profile',
  ONBOARDING_COMPLETE: '@agronavis/onboarding_complete',
  SELECTED_FARM: '@agronavis/selected_farm',
  LANGUAGE: '@agronavis/language',
} as const;

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const;

export const CROP_CATEGORIES = [
  'Cereals', 'Pulses', 'Oilseeds', 'Vegetables', 'Fruits',
  'Spices', 'Fibers', 'Sugarcane', 'Plantation Crops',
] as const;

export const SOIL_TYPES = [
  'Alluvial', 'Black Cotton', 'Red Laterite', 'Mountain', 'Desert Sandy',
  'Saline', 'Peaty & Marshy',
] as const;

export const IRRIGATION_TYPES = [
  'Drip', 'Sprinkler', 'Flood', 'Furrow', 'Rainfed',
] as const;
