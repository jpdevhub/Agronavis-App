import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommunityReply } from '@agronavis/shared-types';
import { communityApi } from '@/services/endpoints';

export type { CommunityReply };

export function useCommunityReplies(postId: string | null) {
  return useQuery({
    queryKey: ['community', 'replies', postId],
    queryFn: () => communityApi.listReplies(postId!),
    enabled: !!postId,
    staleTime: 30_000,
  });
}

export function useAddReply(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => communityApi.addReply(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}
