import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmStore } from '@/store/useFarmStore';

export type FarmField = {
  id: string;
  farm_id: string;
  name: string;
  area_acres: number;
  area_hectares: number | null;
  center_latitude: number | null;
  center_longitude: number | null;
  polygon: object;
  created_at: string;
};

async function fetchFarmFields(userId: string): Promise<FarmField[]> {
  const { data, error } = await supabase
    .from('farm_fields')
    .select(`
      id, farm_id, name, area_acres, area_hectares,
      center_latitude, center_longitude, polygon, created_at,
      farms!inner(farmer_id)
    `)
    .eq('farms.farmer_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as FarmField[];
}

/**
 * Fetches all farm fields for the current farmer.
 * Auto-selects the first field as activeFieldId if none is selected yet.
 */
export function useFarmFields() {
  const user = useAuthStore((s) => s.user);
  const { activeFieldId, setActiveField } = useFarmStore();

  const query = useQuery({
    queryKey: ['farm_fields', user?.id],
    queryFn: () => fetchFarmFields(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select first field if none active yet
  useEffect(() => {
    if (!activeFieldId && query.data && query.data.length > 0) {
      const first = query.data[0];
      setActiveField(first.id, first.farm_id);
    }
  }, [query.data, activeFieldId, setActiveField]);

  return query;
}
