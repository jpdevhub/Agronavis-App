/** Database types — mirrors supabase/migrations/*.sql */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Column value unions (mirror the SQL CHECK constraints) ───────────────────

export type Language = 'en' | 'hi' | 'mr' | 'pa' | 'gu' | 'te' | 'kn';
export type IrrigationType = 'drip' | 'sprinkler' | 'flood' | 'furrow' | 'rainfed';
export type SoilType =
  | 'alluvial'
  | 'black_cotton'
  | 'red_laterite'
  | 'mountain'
  | 'desert_sandy'
  | 'saline'
  | 'peaty';
export type CropStatus = 'active' | 'harvested' | 'failed';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped';
export type AdvisoryCategory =
  | 'irrigation'
  | 'fertilizer'
  | 'pest_control'
  | 'weather_alert'
  | 'market'
  | 'scheme';
export type AdvisorySeverity = 'low' | 'medium' | 'high' | 'critical';
export type PriceDirection = 'up' | 'down' | 'stable';
export type MediaType = 'image' | 'video';

// ── Row shapes ───────────────────────────────────────────────────────────────

export type FarmerRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  language: Language;
  state: string | null;
  district: string | null;
  village: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  education_level: string | null;
  years_of_experience: number | null;
  profile_settings: Json;
  onboarding_complete: boolean;
  land_holding_acres: number | null;
  primary_crops: string[];
  irrigation_type: IrrigationType | null;
  soil_type: SoilType | null;
  expo_push_token: string | null;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  backup_codes: string[];
  created_at: string;
  updated_at: string;
};

export type FarmRow = {
  id: string;
  farmer_id: string;
  name: string;
  area_acres: number | null;
  address: string | null;
  soil_type: string | null;
  irrigation_type: string | null;
  ownership_type: string | null;
  latitude: number | null;
  longitude: number | null;
  state: string | null;
  district: string | null;
  village: string | null;
  water_source: string | null;
  /** Legacy blob that held the coordinates before migration 0006 promoted them. */
  location: Json | null;
  created_at: string;
  updated_at: string;
};

export type FarmFieldRow = {
  id: string;
  farm_id: string;
  name: string;
  area_acres: number;
  area_hectares: number | null;
  polygon: Json;
  center_latitude: number | null;
  center_longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type CropRow = {
  id: string;
  farm_id: string;
  farmer_id: string;
  field_id: string | null;
  name: string;
  variety: string | null;
  category: string | null;
  sown_date: string | null;
  harvest_date: string | null;
  status: CropStatus;
  created_at: string;
};

export type FarmTaskRow = {
  id: string;
  farm_id: string;
  crop_id: string | null;
  task_type: string | null;
  title: string;
  description: string | null;
  due_date: string;
  completed_date: string | null;
  status: TaskStatus;
  action_data: Json | null;
  created_at: string;
  updated_at: string;
};

export type CropScanRow = {
  id: string;
  farm_id: string | null;
  crop_id: string | null;
  image_url: string;
  detected_disease: string | null;
  confidence_score: number | null;
  recommendation: string | null;
  scan_date: string;
};

export type AdvisoryRow = {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  crop_id: string | null;
  field_id: string | null;
  category: AdvisoryCategory;
  title: string;
  body: string;
  severity: AdvisorySeverity;
  source: string;
  read: boolean;
  valid_until: string | null;
  metadata: Json;
  dedupe_key: string | null;
  created_at: string;
};

export type CommunityPostRow = {
  id: string;
  author_id: string | null;
  title: string;
  content: string;
  attached_image_url: string | null;
  media_type: MediaType | null;
  location_tags: Json | null;
  upvotes: number;
  created_at: string;
};

export type CommunityReplyRow = {
  id: string;
  post_id: string | null;
  author_id: string | null;
  reply_content: string;
  created_at: string;
};

export type SoilHealthRow = {
  id: string;
  farm_id: string | null;
  field_id: string | null;
  ph_level: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organic_carbon: number | null;
  moisture_level: number | null;
  tested_date: string | null;
  created_at: string;
};

export type RegionalSoilRow = {
  id: number;
  State: string;
  District: string;
  n_High: number;
  n_Medium: number;
  n_Low: number;
  p_High: number;
  p_Medium: number;
  p_Low: number;
  k_High: number;
  k_Medium: number;
  k_Low: number;
  pH_Alkaline: number;
  pH_Acidic: number;
  pH_Neutral: number;
  OC_High: number;
  OC_Medium: number;
  OC_Low: number;
  created_at: string;
};

export type MarketPriceRow = {
  id: string;
  commodity: string;
  state: string;
  district: string;
  market: string;
  variety: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
  direction: PriceDirection;
  change_pct: number;
  source: string;
  arrival_date: string;
  fetched_at: string;
};

export type WeatherSnapshotRow = {
  id: string;
  farm_id: string;
  snapshot_date: string;
  payload: Json;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  farmer_id: string;
  title: string;
  body: string;
  type: string;
  data: Json;
  read: boolean;
  created_at: string;
};

export type YieldHistoryRow = {
  id: string;
  farm_id: string | null;
  crop_type: string;
  variety: string | null;
  season: string | null;
  year: number;
  quantity: number;
  unit: string;
  quality_notes: string | null;
  created_at: string;
};

export type CropVarietyRow = {
  id: string;
  crop_type: string;
  crop_category: string;
  variety: string;
  season: string[] | null;
  primary_harvest_part: string | null;
  yield_unit: string | null;
  avg_yield_per_acre: number | null;
  growth_duration_days: number | null;
  req_nitrogen_kg_per_acre: number | null;
  req_phosphorus_kg_per_acre: number | null;
  req_potassium_kg_per_acre: number | null;
  ideal_ph_min: number | null;
  ideal_ph_max: number | null;
  water_req_mm_per_season: number | null;
  created_at: string;
};

export type CropDiseaseRow = {
  id: string;
  class_key: string;
  name: string;
  crop_type: string;
  is_healthy: boolean;
  severity: string | null;
  description: string | null;
  symptoms: string[] | null;
  treatment: string[] | null;
  image_url: string | null;
  created_at: string;
};

// ── Supabase client generic ──────────────────────────────────────────────────

/** Insert shape: PK, defaulted and generated columns are optional. */
type Insertable<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;
type Table<Row, InsertOptional extends keyof Row> = {
  Row: Row;
  Insert: Insertable<Row, InsertOptional>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamps = 'created_at' | 'updated_at';

export interface Database {
  public: {
    Tables: {
      farmers: Table<
        FarmerRow,
        | Timestamps
        | 'phone'
        | 'language'
        | 'state'
        | 'district'
        | 'village'
        | 'avatar_url'
        | 'date_of_birth'
        | 'gender'
        | 'education_level'
        | 'years_of_experience'
        | 'profile_settings'
        | 'onboarding_complete'
        | 'land_holding_acres'
        | 'primary_crops'
        | 'irrigation_type'
        | 'soil_type'
        | 'expo_push_token'
        | 'two_factor_enabled'
        | 'two_factor_secret'
        | 'backup_codes'
      >;
      farms: Table<
        FarmRow,
        | 'id'
        | Timestamps
        | 'area_acres'
        | 'address'
        | 'soil_type'
        | 'irrigation_type'
        | 'ownership_type'
        | 'latitude'
        | 'longitude'
        | 'state'
        | 'district'
        | 'village'
        | 'water_source'
        | 'location'
      >;
      farm_fields: Table<
        FarmFieldRow,
        'id' | Timestamps | 'area_hectares' | 'center_latitude' | 'center_longitude'
      >;
      crops: Table<
        CropRow,
        | 'id'
        | 'created_at'
        | 'field_id'
        | 'variety'
        | 'category'
        | 'sown_date'
        | 'harvest_date'
        | 'status'
      >;
      farm_tasks: Table<
        FarmTaskRow,
        | 'id'
        | Timestamps
        | 'crop_id'
        | 'task_type'
        | 'description'
        | 'completed_date'
        | 'status'
        | 'action_data'
      >;
      crop_scans: Table<
        CropScanRow,
        | 'id'
        | 'scan_date'
        | 'farm_id'
        | 'crop_id'
        | 'detected_disease'
        | 'confidence_score'
        | 'recommendation'
      >;
      advisories: Table<
        AdvisoryRow,
        | 'id'
        | 'created_at'
        | 'farm_id'
        | 'crop_id'
        | 'field_id'
        | 'severity'
        | 'source'
        | 'read'
        | 'valid_until'
        | 'metadata'
        | 'dedupe_key'
      >;
      community_posts: Table<
        CommunityPostRow,
        | 'id'
        | 'created_at'
        | 'attached_image_url'
        | 'media_type'
        | 'location_tags'
        | 'upvotes'
        | 'author_id'
      >;
      community_replies: Table<CommunityReplyRow, 'id' | 'created_at' | 'author_id' | 'post_id'>;
      soil_health_history: Table<
        SoilHealthRow,
        | 'id'
        | 'created_at'
        | 'farm_id'
        | 'field_id'
        | 'ph_level'
        | 'nitrogen'
        | 'phosphorus'
        | 'potassium'
        | 'organic_carbon'
        | 'moisture_level'
        | 'tested_date'
      >;
      regional_soil_data: Table<RegionalSoilRow, 'id' | 'created_at'>;
      market_prices: Table<
        MarketPriceRow,
        | 'id'
        | 'fetched_at'
        | 'district'
        | 'market'
        | 'variety'
        | 'unit'
        | 'direction'
        | 'change_pct'
        | 'source'
      >;
      weather_snapshots: Table<WeatherSnapshotRow, 'id' | Timestamps | 'snapshot_date'>;
      notifications: Table<
        NotificationRow,
        'id' | 'created_at' | 'type' | 'data' | 'read'
      >;
      yield_history: Table<
        YieldHistoryRow,
        'id' | 'created_at' | 'farm_id' | 'variety' | 'season' | 'unit' | 'quality_notes'
      >;
      crop_diseases: Table<
        CropDiseaseRow,
        | 'id'
        | 'created_at'
        | 'severity'
        | 'description'
        | 'symptoms'
        | 'treatment'
        | 'image_url'
      >;
      crop_varieties: Table<
        CropVarietyRow,
        | 'id'
        | 'created_at'
        | 'season'
        | 'primary_harvest_part'
        | 'yield_unit'
        | 'avg_yield_per_acre'
        | 'growth_duration_days'
        | 'req_nitrogen_kg_per_acre'
        | 'req_phosphorus_kg_per_acre'
        | 'req_potassium_kg_per_acre'
        | 'ideal_ph_min'
        | 'ideal_ph_max'
        | 'water_req_mm_per_season'
      >;
    };
    Views: {
      farmer_public: {
        Row: Pick<
          FarmerRow,
          'id' | 'full_name' | 'avatar_url' | 'state' | 'district' | 'village' | 'language' | 'created_at'
        >;
        Relationships: [];
      };
    };
    Functions: {
      /**
       * Derives NPK/pH for a field from district averages in
       * `regional_soil_data` and inserts the result into `soil_health_history`.
       * Returns false when the district has no reference data.
       */
      get_estimated_soil_health: {
        Args: { p_state: string; p_district: string; p_farm_id: string; p_field_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
