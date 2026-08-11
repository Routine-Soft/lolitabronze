// modules/cash/cash.routes.js
import * as controller from './cash.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function cashRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  fastify.post('/cash/open', controller.open);
  fastify.post('/cash/:id/close', controller.close);
  fastify.post('/cash/movement', controller.addMovement);
  fastify.get('/cash/current', controller.getCurrent);
}