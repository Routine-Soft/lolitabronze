// modules/cash/cash.routes.js
import * as controller from './cash.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function cashRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  // sessões (caixa)
  fastify.post('/cash/open', controller.open);
  fastify.get('/cash/current', controller.getCurrent);
  fastify.get('/cash/sessions', controller.listSessions);
  fastify.get('/cash/sessions/:id', controller.getSessionById);
  fastify.patch('/cash/sessions/:id/close', controller.close);
  fastify.delete('/cash/sessions/:id', controller.deleteSession);

  // movimentações
  fastify.post('/cash/movement', controller.addMovement);
  fastify.post('/cash/despesa', controller.addDespesa);
  fastify.get('/cash/movements', controller.listMovements);
  fastify.get('/cash/movements/:id', controller.getMovementById);
  fastify.patch('/cash/movements/:id', controller.updateMovement);
  fastify.delete('/cash/movements/:id', controller.deleteMovement);
  fastify.get('/cash/relatorio', controller.relatorio);
}