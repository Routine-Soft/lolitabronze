// modules/orderHistory/orderHistory.routes.js
import * as controller from './orderHistory.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function orderHistoryRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  fastify.post('/orders', controller.create);
  fastify.get('/orders', controller.list);
  fastify.get('/orders/:id', controller.getById);
  fastify.get('/orders-availability', controller.getSlotAvailability);
  fastify.patch('/orders/:id/finalizar', controller.finalizarServico);
}