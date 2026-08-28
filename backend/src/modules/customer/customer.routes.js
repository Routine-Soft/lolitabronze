// modules/customer/customer.routes.js
import * as controller from './customer.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function customerRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  
  fastify.post('/customers', controller.create);
  fastify.get('/customers', controller.list);
  fastify.get('/customers/:id', controller.getById);
  fastify.patch('/customers/:id', controller.update);
  fastify.delete('/customers/:id', controller.remove);
}