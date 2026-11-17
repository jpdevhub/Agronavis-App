import { useQuery } from '@tanstack/react-query';
import type { RecommendationReport, StateRecommendation } from '@agronavis/shared-types';
import { recommendApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

export type { RecommendationReport, StateRecommendation };

/**
 * What is worth planting in the selected field.
 *
 * Kept for an hour: the ranking moves with the mandi and the weather, neither
 * of which changes between one look at the screen and the next.
 */
export function useFieldRecommendations() {
  const activeFieldId = useFarmStore((s) => s.activeFieldId);

  return useQuery({
    queryKey: ['recommend', 'field', activeFieldId],
    queryFn: () => recommendApi.forField(activeFieldId!),
    enabled: !!activeFieldId,
    staleTime: 1000 * 60 * 60,
  });
}

/** The browse map's answer for one state. Only fetched once a state is tapped. */
export function useStateRecommendations(state: string | null) {
  return useQuery({
    queryKey: ['recommend', 'state', state],
    queryFn: () => recommendApi.forState(state!),
    enabled: !!state,
    staleTime: 1000 * 60 * 60,
  });
}
