// modules/orderHistory/orderHistory.controller.js
import * as orderService from './orderHistory.service.js';
import { toCreateOrderDto, toOrderResponseDto } from './orderHistory.dto.js';

export async function create(request, reply) {
  const dto = toCreateOrderDto({
    ...request.body,
    userId: request.user.id, // do token, não confia no body
  });

  const order = await orderService.createOrder(dto);
  return reply.code(201).send(toOrderResponseDto(order));
}

export async function list(request, reply) {
  const orders = await orderService.listOrders();
  return reply.send(orders.map(toOrderResponseDto));
}

export async function getById(request, reply) {
  const order = await orderService.getOrderById(request.params.id);
  if (!order) return reply.code(404).send({ message: 'Pedido não encontrado' });
  return reply.send(toOrderResponseDto(order));
}

export async function getSlotAvailability(request, reply) {
  const { date } = request.query;
  if (!date) {
    return reply.code(400).send({ message: 'Parâmetro "date" é obrigatório (YYYY-MM-DD)' });
  }

  const availability = await orderService.getSlotAvailability(date);
  return reply.send(availability);
}

export async function finalizarServico(request, reply) {
  const { id } = request.params;
  const userId = request.user.id; // do token
  const { typePayment } = request.body;

  const order = await orderService.finalizarServicoAgendado(id, userId, typePayment);
  return reply.send(toOrderResponseDto(order));
}