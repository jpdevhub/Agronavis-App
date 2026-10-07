import { useQuery } from '@tanstack/react-query';
import type { DiseaseReference } from '@agronavis/shared-types';
import { cropApi } from '@/services/endpoints';

export type { DiseaseReference };

/** Disease reference data changes with the scheme, not with the farm. */
const REFERENCE_DATA = { staleTime: 1000 * 60 * 60 * 24, gcTime: 1000 * 60 * 60 * 24 };

export function useDiseaseLibrary(cropType?: string) {
  const query = useQuery({
    queryKey: ['crop-diseases', cropType ?? 'all'],
    queryFn: () => cropApi.diseases(cropType ? { cropType } : undefined),
    ...REFERENCE_DATA,
  });

  return { ...query, diseases: query.data ?? [] };
}
