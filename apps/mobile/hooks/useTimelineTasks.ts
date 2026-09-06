import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FarmTask } from '@agronavis/shared-types';
import { taskApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

export type { FarmTask };

export function useTimelineTasks() {
  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  const queryClient = useQueryClient();
  const queryKey = ['tasks', activeFarmId];

  const query = useQuery({
    queryKey,
    queryFn: () => taskApi.list(activeFarmId ?? undefined),
    enabled: !!activeFarmId,
    staleTime: 1000 * 60 * 5,
  });

  const completeTask = useMutation({
    mutationFn: (taskId: string) => taskApi.complete(taskId),

    // Drop the task from the list straight away; put it back if the call fails.
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FarmTask[]>(queryKey);
      queryClient.setQueryData<FarmTask[]>(queryKey, (old) =>
        (old ?? []).filter((task) => task.id !== taskId),
      );
      return { previous };
    },
    onError: (_error, _taskId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { ...query, completeTask };
}
