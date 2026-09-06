import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { communityController } from './community.controller';
import {
  createPostSchema,
  idParamSchema,
  listPostsSchema,
  postParamSchema,
  replySchema,
  voteSchema,
} from './community.schema';

export const communityRoutes = Router();

communityRoutes.use(requireAuth);

communityRoutes.get('/posts', validate(listPostsSchema, 'query'), handler(communityController.listPosts));
communityRoutes.post('/posts', validate(createPostSchema), handler(communityController.createPost));
communityRoutes.delete('/posts/:id', validate(idParamSchema, 'params'), handler(communityController.deletePost));
communityRoutes.post(
  '/posts/:id/vote',
  validate(idParamSchema, 'params'),
  validate(voteSchema),
  handler(communityController.vote),
);

communityRoutes.get(
  '/posts/:postId/replies',
  validate(postParamSchema, 'params'),
  handler(communityController.listReplies),
);
communityRoutes.post(
  '/posts/:postId/replies',
  validate(postParamSchema, 'params'),
  validate(replySchema),
  handler(communityController.addReply),
);
communityRoutes.delete(
  '/replies/:id',
  validate(idParamSchema, 'params'),
  handler(communityController.deleteReply),
);
