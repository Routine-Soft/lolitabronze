// modules/print/print.routes.js
import * as controller from './print.controller.js';
import { authenticate } from '../shared/middlewares/auth.middleware.js';

export async function printRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  fastify.post('/print/test', controller.printTest);
  fastify.post('/print/order/:orderId', controller.printOrderReceipt);
}