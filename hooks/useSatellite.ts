import { useQuery } from '@tanstack/react-query';
import type { NdviReport, SatellitePassReport } from '@agronavis/shared-types';
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


/**
 * Crop vigour for the selected field.
 *
 * Reads what the nightly job measured rather than measuring on demand — one
 * reading costs about forty seconds against AWS, which no screen can wait for.
 * Half a day stale is fine: Sentinel-2 revisits every five days.
 */
export function useNdvi() {
  const fieldId = useFarmStore((s) => s.activeFieldId);

  const query = useQuery({
    queryKey: ['ndvi', fieldId],
    queryFn: () => satelliteApi.ndvi(fieldId!),
    enabled: Boolean(fieldId),
    staleTime: 12 * 60 * 60_000,
  });

  const report: NdviReport | undefined = query.data;

  return {
    report,
    latest: report?.latest ?? null,
    previous: report?.previous ?? null,
    change: report?.change ?? null,
    history: report?.history ?? [],
    /** The latest reading drawn as a PNG data URI, for the map overlay. */
    heatmap: report?.heatmap ?? null,
    /** Ground the heatmap covers, as four [lon, lat] corners. */
    bounds: report?.bounds ?? null,
    available: report?.available ?? true,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
