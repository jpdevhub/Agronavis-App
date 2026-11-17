import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FarmTask } from '@agronavis/shared-types';
import { taskApi } from '@/services/endpoints';
import { useConnectivity } from '@/shared/network';
import { enqueue } from '@/shared/offline';
import { useFarmStore } from '@/store/useFarmStore';

export type { FarmTask };

export function useTimelineTasks() {
  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  // Tasks belong to the crop growing in a plot, so they follow the selected
  // field. Without it every plot showed the whole farm's work — sowing dates
  // for the cotton appearing against the field growing rice.
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const { isOnline } = useConnectivity();
  const queryClient = useQueryClient();
  const queryKey = ['tasks', activeFarmId, activeFieldId];

  const query = useQuery({
    queryKey,
    queryFn: () => taskApi.list(activeFarmId ?? undefined, activeFieldId ?? undefined),
    enabled: !!activeFarmId,
    staleTime: 1000 * 60 * 5,
  });

  const completeTask = useMutation({
    // Offline, the tick is recorded locally and replayed on reconnect rather
    // than failing in the farmer's face.
    mutationFn: async (taskId: string) => {
      if (!isOnline) {
        await enqueue({ kind: 'task.complete', targetId: taskId });
        return;
      }
      await taskApi.complete(taskId);
    },

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
      if (isOnline) queryClient.invalidateQueries({ queryKey });
    },
  });

  return { ...query, completeTask };
}
