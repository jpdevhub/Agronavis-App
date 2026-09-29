import { useQuery } from '@tanstack/react-query';
import type { DashboardPrice } from '@agronavis/shared-types';
import { marketApi } from '@/services/endpoints';
import { Env } from '@/constants/env';

export type { DashboardPrice };

/**
 * Mandi prices for the farmer's state. Mandis publish once a day, so an hour
 * of staleness costs nothing and saves the upstream quota.
 */
export function useMarketPrices(state: string | null | undefined, crops?: string[]) {
  return useQuery({
    queryKey: ['market', state, crops?.join(',') ?? 'default'],
    queryFn: () => marketApi.dashboard(state!, crops),
    enabled: Env.features.marketPrices && !!state,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export function usePriceTrend(commodity: string | null, state: string | null) {
  return useQuery({
    queryKey: ['market', 'trend', commodity, state],
    queryFn: () => marketApi.trend(commodity!, state!),
    enabled: !!commodity && !!state,
    staleTime: 1000 * 60 * 60,
  });
}
