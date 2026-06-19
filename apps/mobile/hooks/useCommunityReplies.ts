import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type CommunityReply = {
  id: string;
  post_id: string;
  author_id: string;
  reply_content: string;
  created_at: string;
  farmers: { full_name: string; avatar_url: string | null } | null;
};

async function fetchReplies(postId: string): Promise<CommunityReply[]> {
  const { data, error } = await supabase
    .from('community_replies')
    .select('id, post_id, author_id, reply_content, created_at, farmers(full_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommunityReply[];
}

async function addReply(postId: string, authorId: string, content: string) {
  const { error } = await supabase.from('community_replies').insert({
    post_id:       postId,
    author_id:     authorId,
    reply_content: content,
  });
  if (error) throw error;
}

export function useCommunityReplies(postId: string | null) {
  return useQuery({
    queryKey: ['community_replies', postId],
    queryFn:  () => fetchReplies(postId!),
    enabled:  !!postId,
    staleTime: 30_000,
  });
}

export function useAddReply(postId: string) {
  const qc   = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (content: string) => addReply(postId, user!.id, content),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['community_replies', postId] }),
  });
}
