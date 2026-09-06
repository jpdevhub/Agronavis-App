import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { created, noContent, ok } from '../../shared/http';
import { db } from '../../config/supabase';
import { emitCommunityPost } from '../../websocket/socket.server';
import { communityService } from './community.service';

export const communityController = {
  async listPosts(req: Request, res: Response) {
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };
    const data = await communityService.listPosts(farmerId(req), limit, offset);
    ok(res, data, { count: data.length, page: Math.floor(offset / limit) + 1, pageSize: limit });
  },

  async createPost(req: Request, res: Response) {
    const id = farmerId(req);
    const post = await communityService.createPost(id, req.body);

    // Notify the author's district so neighbours see the question immediately.
    const { data: author } = await db.from('farmers').select('district').eq('id', id).maybeSingle();
    if (author?.district) {
      emitCommunityPost(author.district, {
        postId: post.id,
        district: author.district,
        authorName: post.author?.fullName ?? 'A farmer',
        title: post.title,
        preview: post.content.slice(0, 120),
        createdAt: post.createdAt,
      });
    }

    created(res, post);
  },

  async deletePost(req: Request, res: Response) {
    await communityService.deletePost(farmerId(req), req.params.id!);
    noContent(res);
  },

  async vote(req: Request, res: Response) {
    const direction = (req.body as { direction: 'up' | 'down' }).direction;
    const upvotes = await communityService.vote(req.params.id!, direction === 'up' ? 1 : -1);
    ok(res, { upvotes });
  },

  async listReplies(req: Request, res: Response) {
    const data = await communityService.listReplies(farmerId(req), req.params.postId!);
    ok(res, data, { count: data.length });
  },

  async addReply(req: Request, res: Response) {
    created(res, await communityService.addReply(farmerId(req), req.params.postId!, req.body.content));
  },

  async deleteReply(req: Request, res: Response) {
    await communityService.deleteReply(farmerId(req), req.params.id!);
    noContent(res);
  },
};
