import type { FarmerProfile, FarmerRow, UpdateFarmerPayload } from '@agronavis/shared-types';
import { db } from '../../config/supabase';
import { fromPostgrest, notFound } from '../../shared/errors';

/** Columns safe to read. Deliberately excludes the 2FA secret and backup codes. */
const PROFILE_COLUMNS =
  'id, email, full_name, phone, language, state, district, village, avatar_url, ' +
  'land_holding_acres, primary_crops, irrigation_type, soil_type, onboarding_complete, ' +
  'two_factor_enabled, years_of_experience, created_at';

type ProfileRow = Pick<
  FarmerRow,
  | 'id'
  | 'email'
  | 'full_name'
  | 'phone'
  | 'language'
  | 'state'
  | 'district'
  | 'village'
  | 'avatar_url'
  | 'land_holding_acres'
  | 'primary_crops'
  | 'irrigation_type'
  | 'soil_type'
  | 'onboarding_complete'
  | 'two_factor_enabled'
  | 'years_of_experience'
  | 'created_at'
>;

export function toFarmerProfile(row: ProfileRow): FarmerProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    language: row.language,
    state: row.state,
    district: row.district,
    village: row.village,
    avatarUrl: row.avatar_url,
    landHoldingAcres: row.land_holding_acres,
    primaryCrops: row.primary_crops ?? [],
    irrigationType: row.irrigation_type,
    soilType: row.soil_type,
    onboardingComplete: row.onboarding_complete,
    twoFactorEnabled: row.two_factor_enabled,
    yearsOfExperience: row.years_of_experience,
    createdAt: row.created_at,
  };
}

export const farmersService = {
  /** The caller's profile. */
  async getProfile(farmerId: string, email: string | null): Promise<FarmerProfile> {
    const { data, error } = await db
      .from('farmers')
      .select(PROFILE_COLUMNS)
      .eq('id', farmerId)
      .maybeSingle<ProfileRow>();

    if (error) throw fromPostgrest(error, 'Load profile');
    if (data) return toFarmerProfile(data);

    const { data: repaired, error: insertError } = await db
      .from('farmers')
      .insert({ id: farmerId, email: email ?? '', full_name: 'Farmer' })
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>();

    if (insertError) throw fromPostgrest(insertError, 'Create profile');
    return toFarmerProfile(repaired);
  },

  async updateProfile(farmerId: string, payload: UpdateFarmerPayload): Promise<FarmerProfile> {
    const patch: Partial<FarmerRow> = {};
    if (payload.fullName !== undefined) patch.full_name = payload.fullName;
    if (payload.phone !== undefined) patch.phone = payload.phone;
    if (payload.language !== undefined) patch.language = payload.language;
    if (payload.state !== undefined) patch.state = payload.state;
    if (payload.district !== undefined) patch.district = payload.district;
    if (payload.village !== undefined) patch.village = payload.village;
    if (payload.avatarUrl !== undefined) patch.avatar_url = payload.avatarUrl;
    if (payload.landHoldingAcres !== undefined) patch.land_holding_acres = payload.landHoldingAcres;
    if (payload.primaryCrops !== undefined) patch.primary_crops = payload.primaryCrops;
    if (payload.irrigationType !== undefined) patch.irrigation_type = payload.irrigationType;
    if (payload.soilType !== undefined) patch.soil_type = payload.soilType;
    if (payload.yearsOfExperience !== undefined) patch.years_of_experience = payload.yearsOfExperience;
    if (payload.onboardingComplete !== undefined) patch.onboarding_complete = payload.onboardingComplete;

    if (Object.keys(patch).length === 0) {
      return this.getProfile(farmerId, null);
    }

    const { data, error } = await db
      .from('farmers')
      .update(patch)
      .eq('id', farmerId)
      .select(PROFILE_COLUMNS)
      .maybeSingle<ProfileRow>();

    if (error) throw fromPostgrest(error, 'Update profile');
    if (!data) throw notFound('Farmer profile not found');

    // Keep the farm's denormalised location in step with the profile, so the
    // weather and market pollers target the right district.
    if (payload.state !== undefined || payload.district !== undefined) {
      await db
        .from('farms')
        .update({ state: data.state, district: data.district })
        .eq('farmer_id', farmerId);
    }

    return toFarmerProfile(data);
  },

  async registerPushToken(farmerId: string, token: string): Promise<void> {
    const { error } = await db
      .from('farmers')
      .update({ expo_push_token: token })
      .eq('id', farmerId);
    if (error) throw fromPostgrest(error, 'Save push token');
  },
};
