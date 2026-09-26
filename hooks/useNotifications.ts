import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: notificationApi.list,
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    ...query,
    notifications: query.data?.data ?? [],
    unreadCount: query.data?.meta?.count ?? 0,
    markRead,
    markAllRead,
  };
}
