// modules/item/item.routes.js
import * as controller from './item.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function itemRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  fastify.post('/items', controller.create);
  fastify.get('/items', controller.list);
  fastify.get('/items/:id', controller.getById);
  fastify.put('/items/:id', controller.update);
  fastify.delete('/items/:id', controller.remove);
}