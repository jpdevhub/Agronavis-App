import { useQuery } from '@tanstack/react-query';
import type { NutrientLevel, SoilHealth } from '@agronavis/shared-types';
import { soilApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

export type { SoilHealth, NutrientLevel };

const EMPTY_LEVELS: SoilHealth['levels'] = {
  nitrogen: 'N/A',
  phosphorus: 'N/A',
  potassium: 'N/A',
};

/**
 * Soil health for the active field. The server prefers a lab test and falls
 * back to district Soil Health Card averages, telling us which it used.
 */
export function useSoilHealth() {
  const activeFieldId = useFarmStore((s) => s.activeFieldId);

  const query = useQuery({
    queryKey: ['soil', activeFieldId],
    queryFn: () => soilApi.forField(activeFieldId!),
    enabled: !!activeFieldId,
    staleTime: 1000 * 60 * 60,
  });

  return {
    ...query,
    levels: query.data?.levels ?? EMPTY_LEVELS,
    isRegional: query.data?.source === 'regional',
  };
}
