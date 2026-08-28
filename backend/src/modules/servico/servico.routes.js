// modules/servico/servico.routes.js
import * as controller from './servico.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function servicoRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  
  fastify.post('/servicos', controller.create);
  fastify.get('/servicos', controller.list);
  fastify.get('/servicos/:id', controller.getById);
  fastify.patch('/servicos/:id', controller.update);
  fastify.delete('/servicos/:id', controller.remove);
}