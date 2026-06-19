import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useFarmStore } from '@/store/useFarmStore';

export type FarmTask = {
  id: string;
  farm_id: string;
  crop_id: string | null;
  task_type: string | null;
  title: string;
  description: string | null;
  due_date: string;
  completed_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped';
  action_data: Record<string, unknown> | null;
  created_at: string;
};

async function fetchTasks(farmId: string): Promise<FarmTask[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('farm_tasks')
    .select('*')
    .eq('farm_id', farmId)
    .neq('status', 'completed')
    .neq('status', 'skipped')
    .order('due_date', { ascending: true })
    .limit(20);

  if (error) throw error;

  // Locally mark overdue tasks (DB doesn't auto-update status)
  return (data ?? []).map((t: FarmTask) => ({
    ...t,
    status: t.status === 'pending' && t.due_date < today ? 'overdue' : t.status,
  }));
}

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // iOS: use Alert for important rollback notices
    Alert.alert('', message);
  }
}

/**
 * Fetches and manages the farm task timeline for the active farm.
 * Includes an optimistic `completeTask` mutation that instantly marks the
 * task as done in the UI, then syncs to Supabase. On network failure,
 * the update rolls back automatically.
 */
export function useTimelineTasks() {
  const { activeFarmId } = useFarmStore();
  const queryClient = useQueryClient();
  const queryKey = ['tasks', activeFarmId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTasks(activeFarmId!),
    enabled: !!activeFarmId,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('farm_tasks')
        .update({ status: 'completed', completed_date: today, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },

    // Optimistic update — instantly remove from list
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FarmTask[]>(queryKey);

      queryClient.setQueryData<FarmTask[]>(queryKey, (old) =>
        (old ?? []).filter((t) => t.id !== taskId)
      );

      return { previous }; // context for rollback
    },

    // On error: roll back and notify user
    onError: (_err, _taskId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast('Saved offline. Will sync when connected.');
    },

    // Always refetch after settle to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { ...query, completeTask };
}
