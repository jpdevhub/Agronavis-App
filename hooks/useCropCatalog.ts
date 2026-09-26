import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CropVariety, DiseaseReference } from '@agronavis/shared-types';
import { cropApi } from '@/services/endpoints';

export type { CropVariety, DiseaseReference };

/** One card per crop, with its varieties folded in. */
export interface CatalogEntry {
  cropType: string;
  category: string;
  varieties: CropVariety[];
}

const REFERENCE_DATA = { staleTime: 1000 * 60 * 60 * 24, gcTime: 1000 * 60 * 60 * 24 };

export function useCropCatalog() {
  const query = useQuery({
    queryKey: ['crop-varieties'],
    queryFn: () => cropApi.varieties(),
    ...REFERENCE_DATA,
  });

  const entries = useMemo<CatalogEntry[]>(() => {
    const byType = new Map<string, CatalogEntry>();
    for (const variety of query.data ?? []) {
      const entry = byType.get(variety.cropType);
      if (entry) entry.varieties.push(variety);
      else
        byType.set(variety.cropType, {
          cropType: variety.cropType,
          category: variety.cropCategory,
          varieties: [variety],
        });
    }
    return Array.from(byType.values());
  }, [query.data]);

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.category))).sort(),
    [entries],
  );

  return { ...query, entries, categories };
}

export function useDiseaseLibrary(cropType?: string) {
  const query = useQuery({
    queryKey: ['crop-diseases', cropType ?? 'all'],
    queryFn: () => cropApi.diseases(cropType ? { cropType } : undefined),
    ...REFERENCE_DATA,
  });

  return { ...query, diseases: query.data ?? [] };
}
