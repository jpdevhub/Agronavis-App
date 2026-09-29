import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Advisory, AdvisorySeverity } from '@agronavis/shared-types';
import { advisoryApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

export type { Advisory, AdvisorySeverity };

const SEVERITY_ORDER: Record<AdvisorySeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function useAdvisories() {
  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  const queryClient = useQueryClient();
  const queryKey = ['advisories', activeFarmId];

  const query = useQuery({
    queryKey,
    queryFn: () => advisoryApi.forFarm(activeFarmId!),
    enabled: !!activeFarmId,
    staleTime: 1000 * 60 * 10,
  });

  const advisories = query.data?.data ?? [];
  const unreadCount = query.data?.meta?.count ?? 0;

  const markRead = useMutation({
    mutationFn: (advisoryId: string) => advisoryApi.markRead(advisoryId),
    onMutate: async (advisoryId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ data: Advisory[]; meta?: { count?: number } }>(queryKey);
      queryClient.setQueryData<typeof previous>(queryKey, (old) =>
        old
          ? {
              data: old.data.map((a) => (a.id === advisoryId ? { ...a, read: true } : a)),
              meta: { ...old.meta, count: Math.max(0, (old.meta?.count ?? 1) - 1) },
            }
          : old,
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const refresh = useMutation({
    mutationFn: () => advisoryApi.generate(activeFarmId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const topUnread =
    advisories
      .filter((a) => !a.read)
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])[0] ?? null;

  return { ...query, advisories, unreadCount, topUnread, markRead, refresh };
}
