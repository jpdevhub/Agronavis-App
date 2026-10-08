import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MandiPrice, MandiSearchResult, MandiSource } from '@agronavis/shared-types';
import { marketApi } from '@/services/endpoints';
import { useFarmer } from '@/hooks/useFarmer';

export type MandiFilter = { state: string };

const SOURCE_LABEL: Record<MandiSource, string> = {
  agmarknet_district: 'Live · Agmarknet',
  agmarknet_state: 'Live · Agmarknet, state-wide',
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
/**
 * A deployed API is always allowed to be older than the app, and these rows
 * gained `markets` and `marketsReporting` after the backend they come from was
 * last released. Reading them straight off the wire crashes the screen the
 * moment it meets a response that predates them.
 */
function normalise(row: MandiPrice): MandiPrice {
  const markets = Array.isArray(row.markets) ? row.markets.filter(Boolean) : [];
  return {
    ...row,
    markets,
    marketsReporting:
      typeof row.marketsReporting === 'number' && row.marketsReporting > 0
        ? row.marketsReporting
        : // An older API sends one row per mandi and names it.
          (markets.length || (row.market ? 1 : 0)),
  };
}

export function useMandiSearch(commodity?: string) {
  const { data: farmer } = useFarmer();
  const [override, setOverride] = useState<MandiFilter | null>(null);

  const filter = useMemo<MandiFilter>(
    () => override ?? { state: farmer?.state ?? '' },
    [override, farmer?.state],
  );

  const query = useQuery<MandiSearchResult>({
    queryKey: ['market', 'mandi', filter.state, commodity ?? ''],
    queryFn: () =>
      marketApi.mandi({
        state: filter.state,
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
    rows: (query.data?.rows ?? []).map(normalise),
    source: query.data?.source,
    sourceLabel: mandiSourceLabel(query.data?.source),
    needsLocation: filter.state.trim().length === 0,
  };
}
