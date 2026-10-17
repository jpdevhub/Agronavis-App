import { useQuery } from '@tanstack/react-query';
import type { SatellitePassReport } from '@agronavis/shared-types';
import { satelliteApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

/**
 * When a satellite last had a clear look at this field.
 *
 * Scoped to the selected field for the same reason weather and fires are: a
 * farm stores one point, and its fields can be in different states.
 *
 * An hour stale is generous. Sentinel-2 passes about every five days, so the
 * answer rarely changes between two openings of the app on the same morning.
 */
export function useSatellitePasses(days = 30) {
  const farmId = useFarmStore((s) => s.activeFarmId);
  const fieldId = useFarmStore((s) => s.activeFieldId);

  const query = useQuery({
    queryKey: fieldId ? ['satellite', 'field', fieldId, days] : ['satellite', 'farm', farmId, days],
    queryFn: () =>
      fieldId ? satelliteApi.forField(fieldId, days) : satelliteApi.forFarm(farmId!, days),
    enabled: Boolean(fieldId ?? farmId),
    staleTime: 60 * 60_000,
  });

  const report: SatellitePassReport | undefined = query.data;

  return {
    report,
    passes: report?.passes ?? [],
    lastClear: report?.lastClear ?? null,
    nextExpected: report?.nextExpected ?? null,
    /** False when the catalogue did not answer; not the same as "no passes". */
    available: report?.available ?? true,
    mapped: report?.mapped ?? false,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
