import * as printService from './print.service.js';

export async function printTest(request, reply) {
  try {
    const result = await printService.testPrinter(request.body?.texto);
    return reply.send({ data: result, message: result.message });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({
      success: false,
      message: err.message,
      logs: err.logs ?? [],
    });
  }
}

export async function printOrderReceipt(request, reply) {
  try {
    const result = await printService.printOrder(request.params.orderId);
    return reply.send({ data: result, message: result.message });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({
      success: false,
      message: err.message,
      logs: err.logs ?? [],
    });
  }
}