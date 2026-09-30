import { useQuery } from '@tanstack/react-query';
import type { WeatherBundle } from '@agronavis/shared-types';
import { weatherApi } from '@/services/endpoints';

export type { WeatherBundle };

/**
 * Weather for the farmer's selected land. The OpenWeatherMap key lives on the
 * server, so the app never carries it and never calls the provider directly.
 *
 * Prefers the field, because a farm holds a single pair of coordinates fixed by
 * whichever field was mapped first, while its fields can be a thousand
 * kilometres apart — one farm here has land in Kolkata and in Ludhiana. Falls
 * back to the farm for land that has no mapped boundary yet.
 */
export function useWeather(farmId: string | null | undefined, fieldId?: string | null) {
  const key = fieldId ? ['weather', 'field', fieldId] : ['weather', 'farm', farmId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => (fieldId ? weatherApi.byField(fieldId) : weatherApi.byFarm(farmId!)),
    enabled: Boolean(fieldId ?? farmId),
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
