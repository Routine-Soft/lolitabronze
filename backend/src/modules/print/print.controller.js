// modules/print/print.controller.js
import * as printService from './print.service.js';

export async function printTest(request, reply) {
  const result = await printService.testPrinter(request.body?.texto);
  return reply.send({ data: result, message: result.message });
}

export async function printOrderReceipt(request, reply) {
  const result = await printService.printOrder(request.params.orderId);
  return reply.send({ data: result, message: result.message });
}