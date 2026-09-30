import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MandiSearchResult, MandiSource } from '@agronavis/shared-types';
import { marketApi } from '@/services/endpoints';
import { useFarmer } from '@/hooks/useFarmer';

export type MandiFilter = { state: string; district: string };

const SOURCE_LABEL: Record<MandiSource, string> = {
  agmarknet_district: 'Live · Agmarknet',
  agmarknet_state: 'Live · Agmarknet, state-wide',
  enam_district: 'Live · eNAM',
  enam_state: 'Live · eNAM, state-wide',
  cache: 'Last synced prices',
  none: 'No prices reported',
  unconfigured: 'Price source not connected',
};

export function mandiSourceLabel(source: MandiSource | undefined): string {
  return source ? SOURCE_LABEL[source] : '';
}

/**
 * Mandi prices for the farmer's district, overridable from the filter sheet.
 * The API key lives on the server, so nothing here talks to data.gov.in.
 */
export function useMandiSearch(commodity?: string) {
  const { data: farmer } = useFarmer();
  const [override, setOverride] = useState<MandiFilter | null>(null);

  const filter = useMemo<MandiFilter>(
    () => override ?? { state: farmer?.state ?? '', district: farmer?.district ?? '' },
    [override, farmer?.state, farmer?.district],
  );

  const query = useQuery<MandiSearchResult>({
    queryKey: ['market', 'mandi', filter.state, filter.district, commodity ?? ''],
    queryFn: () =>
      marketApi.mandi({
        state: filter.state,
        ...(filter.district ? { district: filter.district } : {}),
        ...(commodity ? { commodity } : {}),
      }),
    enabled: filter.state.trim().length > 0,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  return {
    ...query,
    filter,
    setFilter: setOverride,
    rows: query.data?.rows ?? [],
    source: query.data?.source,
    sourceLabel: mandiSourceLabel(query.data?.source),
    needsLocation: filter.state.trim().length === 0,
  };
}
