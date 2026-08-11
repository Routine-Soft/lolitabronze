// modules/print/print.controller.js
import * as printService from './print.service.js';

export async function printOrderReceipt(request, reply) {
  const result = await printService.printOrder(request.params.orderId);
  return reply.send(result);
}