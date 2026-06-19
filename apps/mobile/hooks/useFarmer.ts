import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type FarmerProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state: string | null;
  district: string | null;
  avatar_url: string | null;
  language: string;
  onboarding_complete: boolean;
};

async function fetchFarmer(userId: string): Promise<FarmerProfile> {
  const { data, error } = await supabase
    .from('farmers')
    .select('id, full_name, email, phone, state, district, avatar_url, language, onboarding_complete')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as FarmerProfile;
}

export function useFarmer() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['farmer', user?.id],
    queryFn: () => fetchFarmer(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 min — profile rarely changes
  });
}
