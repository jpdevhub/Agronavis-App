import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommunityPost } from '@agronavis/shared-types';
import { communityApi } from '@/services/endpoints';

export type { CommunityPost };

export function useCommunityPosts() {
  return useQuery({
    queryKey: ['community', 'posts'],
    queryFn: () => communityApi.listPosts({ limit: 30 }),
    staleTime: 60_000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.deletePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
  });
}

/**
 * Upvote toggle. The count comes back from the server, so two people voting at
 * once can no longer overwrite each other.
 */
export function useToggleVote() {
  const queryClient = useQueryClient();
  const queryKey = ['community', 'posts'];

  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      communityApi.vote(postId, liked ? 'down' : 'up'),

    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommunityPost[]>(queryKey);
      queryClient.setQueryData<CommunityPost[]>(queryKey, (old) =>
        (old ?? []).map((post) =>
          post.id === postId
            ? { ...post, upvotes: Math.max(0, post.upvotes + (liked ? -1 : 1)) }
            : post,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: ({ upvotes }, { postId }) => {
      queryClient.setQueryData<CommunityPost[]>(queryKey, (old) =>
        (old ?? []).map((post) => (post.id === postId ? { ...post, upvotes } : post)),
      );
    },
  });
}
