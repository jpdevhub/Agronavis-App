import { z } from 'zod';

export const listPostsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(1).max(5000),
  imageUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
});

export const voteSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export const replySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const postParamSchema = z.object({ postId: z.string().uuid() });
