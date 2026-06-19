import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type CommunityPost = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  attached_image_url: string | null;
  media_type: 'image' | 'video' | null;
  upvotes: number;
  created_at: string;
  farmers: { full_name: string; avatar_url: string | null; state: string | null } | null;
};

// ── Fetch all posts ───────────────────────────────────────────────────────────
async function fetchPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, author_id, title, content, attached_image_url, media_type, upvotes, created_at, farmers(full_name, avatar_url, state)')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as CommunityPost[];
}

// ── Create post ───────────────────────────────────────────────────────────────
async function createPost(payload: { authorId: string; title: string; content: string; imageUrl?: string; mediaType?: 'image' | 'video' }) {
  const { error } = await supabase.from('community_posts').insert({
    author_id:          payload.authorId,
    title:              payload.title,
    content:            payload.content,
    attached_image_url: payload.imageUrl ?? null,
    media_type:         payload.mediaType ?? null,
  });
  if (error) throw error;
}

// ── Toggle upvote ─────────────────────────────────────────────────────────────
async function toggleLike(postId: string, currentLikes: number, increment: boolean) {
  const { error } = await supabase
    .from('community_posts')
    .update({ upvotes: Math.max(0, currentLikes + (increment ? 1 : -1)) })
    .eq('id', postId);
  if (error) throw error;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useCommunityPosts() {
  return useQuery({
    queryKey: ['community_posts'],
    queryFn:  fetchPosts,
    staleTime: 60_000, // 1 min
  });
}

export function useCreatePost() {
  const qc   = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (p: { title: string; content: string; imageUrl?: string; mediaType?: 'image' | 'video' }) =>
      createPost({ authorId: user!.id, ...p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, currentLikes, liked }: { postId: string; currentLikes: number; liked: boolean }) =>
      toggleLike(postId, currentLikes, !liked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_posts'] }),
  });
}
