import { useQuery } from '@tanstack/react-query';
import type { FarmFireReport, FireSummary } from '@agronavis/shared-types';
import { fireApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

/**
 * What is burning near the land the farmer is currently looking at, and
 * whether its smoke is coming this way.
 *
 * Scoped to the selected *field*, falling back to the farm only for land with
 * no mapped boundary yet. This matters more than it sounds: a farm stores one
 * pair of coordinates, fixed by whichever field was mapped first, so a farmer
 * who switched to their Assam field was being shown the fires around Punjab —
 * and the Punjab wind direction deciding whether they were upwind. `useWeather`
 * already prefers the field; this now matches it.
 *
 * Half an hour stale is fine. The satellites pass a few times a day and FIRMS
 * publishes about three hours behind, so asking more often returns the same
 * answer and spends a farmer's data to do it.
 */
export function useFarmFires(days = 2, radiusKm = 100) {
  const farmId = useFarmStore((s) => s.activeFarmId);
  const fieldId = useFarmStore((s) => s.activeFieldId);

  const query = useQuery({
    queryKey: fieldId
      ? ['fires', 'field', fieldId, days, radiusKm]
      : ['fires', 'farm', farmId, days, radiusKm],
    queryFn: () =>
      fieldId ? fireApi.forField(fieldId, days, radiusKm) : fireApi.forFarm(farmId!, days, radiusKm),
    enabled: Boolean(fieldId ?? farmId),
    staleTime: 30 * 60_000,
  });

  const report: FarmFireReport | undefined = query.data;

  return {
    report,
    fires: report?.fires ?? [],
    upwindCount: report?.upwindCount ?? 0,
    nearestKm: report?.fires?.[0]?.distanceKm ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

/** The country-wide picture. Deliberately not farm-scoped. */
export function useFireSummary(days = 1) {
  const query = useQuery({
    queryKey: ['fires', 'summary', days],
    queryFn: () => fireApi.summary(days),
    staleTime: 30 * 60_000,
  });

  const summary: FireSummary | undefined = query.data;

  return {
    summary,
    regions: summary?.regions ?? [],
    totalFires: summary?.totalFires ?? 0,
    unavailable: summary?.unavailable ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
