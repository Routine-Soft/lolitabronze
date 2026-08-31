import * as controller from './order.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function orderRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/orders', controller.create);
  fastify.get('/orders', controller.list);
  fastify.get('/orders/:id', controller.getById);
  fastify.patch('/orders/:id', controller.update);
  fastify.delete('/orders/:id', controller.remove);

  fastify.post('/orders/:id/produtos', controller.addProduto);
  fastify.post('/orders/:id/servicos', controller.addServico);
  fastify.patch('/orders/:id/itens/:itemId', controller.updateItem);
  fastify.delete('/orders/:id/itens/:itemId', controller.removerItem);

  fastify.post('/orders/:id/fechar', controller.fechar);
  fastify.post('/orders/:id/cancelar', controller.cancelar);

  fastify.get('/orders-availability', controller.slots);
  fastify.get('/orders-faturamento', controller.relatorioFaturamento);
  fastify.get('/orders-ranking', controller.ranking);
}