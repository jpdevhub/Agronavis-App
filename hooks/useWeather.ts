import { useQuery } from '@tanstack/react-query';
import type { WeatherBundle } from '@agronavis/shared-types';
import { weatherApi } from '@/services/endpoints';

export type { WeatherBundle };

/**
 * Weather for the active farm. The OpenWeatherMap key lives on the server, so
 * the app never carries it and never calls the provider directly.
 */
export function useWeather(farmId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['weather', farmId],
    queryFn: () => weatherApi.byFarm(farmId!),
    enabled: !!farmId,
    staleTime: 1000 * 60 * 20,
    retry: 1,
  });

  return {
    ...query,
    data: query.data?.data,
    current: query.data?.data.current,
    forecast: query.data?.data.forecast ?? [],
    waterDeficitMm: query.data?.data.waterDeficitMm ?? null,
    isStale: query.data?.meta?.cached === true,
  };
}

