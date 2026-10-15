import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotification } from '@agronavis/shared-types';
import { notificationApi } from '@/services/endpoints';

const KEY = ['notifications'];

/**
 * The alerts a farmer has been sent, and how many are unread.
 *
 * Polled rather than pushed. A delivered notification already woke the phone;
 * this list is what is read afterwards, so it only has to be current by the
 * time someone opens the screen or pulls the dashboard down.
 */
export function useNotifications() {
  const client = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => notificationApi.list(),
    staleTime: 60_000,
  });

  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: KEY });
  }, [client]);

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: invalidate,
  });

  const notifications: AppNotification[] = query.data?.data ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unread,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    isMarkingAll: markAllRead.isPending,
  };
}
