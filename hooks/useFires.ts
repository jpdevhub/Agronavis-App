import { useQuery } from '@tanstack/react-query';
import type { FarmFireReport, FireSummary } from '@agronavis/shared-types';
import { fireApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

/**
 * What is burning near this farm, and whether its smoke is coming this way.
 *
 * Half an hour stale is fine. The satellites pass a few times a day and FIRMS
 * publishes about three hours behind, so asking more often returns the same
 * answer and spends a farmer's data to do it.
 */
export function useFarmFires(days = 2, radiusKm = 100) {
  const farmId = useFarmStore((s) => s.activeFarmId);

  const query = useQuery({
    queryKey: ['fires', 'farm', farmId, days, radiusKm],
    queryFn: () => fireApi.forFarm(farmId!, days, radiusKm),
    enabled: Boolean(farmId),
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
