// modules/order/order.routes.js
import * as controller from './order.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function orderRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  fastify.post('/orders', controller.create);
  fastify.get('/orders', controller.list);
  fastify.get('/orders/:id', controller.getById);
  fastify.get('/orders-availability', controller.getSlotAvailability);
  // fastify.patch('/orders/:id/finalizar', controller.finalizarServico);
  fastify.patch('/orders/:id/status', controller.updateStatus);
  fastify.post('/orders/:id/pagamento', controller.pagarRestante);
// remove: fastify.patch('/orders/:id/finalizar', controller.finalizarServico);
  fastify.patch('/orders/:id', controller.updateOrder);
  fastify.patch('/orders/:id/cancelar', controller.cancel);
  fastify.delete('/orders/:id', controller.deleteOrder);
  fastify.get('/orders-faturamento', controller.relatorioFaturamento);
  fastify.get('/orders-ranking', controller.ranking);
}