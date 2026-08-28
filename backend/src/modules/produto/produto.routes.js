// modules/produto/produto.routes.js
import * as controller from './produto.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function produtoRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  
  fastify.post('/produtos', controller.create);
  fastify.get('/produtos', controller.list);
  fastify.get('/produtos/:id', controller.getById);
  fastify.patch('/produtos/:id', controller.update);
  fastify.delete('/produtos/:id', controller.remove);
}