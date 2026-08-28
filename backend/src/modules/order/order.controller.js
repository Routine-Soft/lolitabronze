// modules/order/order.controller.js
import * as orderService from './order.service.js';
import { toCreateOrderDto, toOrderResponseDto } from './order.dto.js';

export async function create(request, reply) {
  const dto = toCreateOrderDto({
    ...request.body,
    userId: request.user.id, // do token, não confia no body
  });

  const order = await orderService.createOrder(dto);
  return reply.code(201).send({ 
    data: toOrderResponseDto(order), 
    message: 'Pedido criado com sucesso' });
}

export async function list(request, reply) {
  const { tipo, status, dia } = request.query;

  const filtros = {};
  if (tipo) filtros.tipo = tipo;
  if (status) filtros.status = status;

  if (dia) {
    // dia no formato YYYY-MM-DD, filtra pela agenda (dia do serviço)
    const [year, month, day] = dia.split('-').map(Number);
    const inicio = new Date(year, month - 1, day, 0, 0, 0, 0);
    const fim = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    filtros.agenda = { $gte: inicio, $lt: fim };
  }

  const orders = await orderService.listOrders(filtros);
  return reply.send({ data: orders.map(toOrderResponseDto) });
}

export async function getById(request, reply) {
  const order = await orderService.getOrderById(request.params.id);
  if (!order) return reply.code(404).send({ message: 'Pedido não encontrado' });
  return reply.send({ data: toOrderResponseDto(order) });
}

export async function getSlotAvailability(request, reply) {
  const { date } = request.query;
  if (!date) {
    return reply.code(400).send({ message: 'Parâmetro "date" é obrigatório (YYYY-MM-DD)' });
  }

  const availability = await orderService.getSlotAvailability(date);
  return reply.send({ data: availability });
}

// export async function finalizarServico(request, reply) {
//   const { id } = request.params;
//   const userId = request.user.id; // do token
//   const { typePayment } = request.body;

//   const order = await orderService.finalizarServicoAgendado(id, userId, typePayment);
//   return reply.send({ 
//     data: toOrderResponseDto(order),
//     message: 'Serviço finalizado com sucesso' });
// }

export async function updateStatus(request, reply) {
  const { status } = request.body;
  const order = await orderService.updateOrderStatus(request.params.id, status);
  return reply.send({
    data: toOrderResponseDto(order),
    message: `Status atualizado para ${status}`,
  });
}

export async function pagarRestante(request, reply) {
  const { id } = request.params;
  const userId = request.user.id;
  const { typePayment } = request.body;

  const order = await orderService.registrarPagamentoRestante(id, userId, typePayment);
  return reply.send({
    data: toOrderResponseDto(order),
    message: 'Pagamento restante registrado com sucesso',
  });
}

export async function updateOrder(request, reply) {
  const order = await orderService.updateOrder(request.params.id, request.body);
  if (!order) return reply.code(404).send({ message: 'Pedido não encontrado' });
  return reply.send({ 
    data: toOrderResponseDto(order), 
    message: 'Pedido atualizado com sucesso' });
}

export async function cancel(request, reply) {
  const { reembolso } = request.body; // 'NENHUM' | 'SINAL' | 'TOTAL'
  const order = await orderService.cancelOrder(request.params.id, request.user.id, reembolso);
  return reply.send({ data: toOrderResponseDto(order), message: 'Pedido cancelado' });
}

export async function deleteOrder(request, reply) {
  await orderService.deleteOrder(request.params.id);
  return reply.send({ message: 'Pedido deletado com sucesso' });
}

// order.controller.js
export async function relatorioFaturamento(request, reply) {
  const { inicio, fim } = request.query;
  const resumo = await orderService.getRelatorioFaturamento(inicio, fim);
  return reply.send({ data: resumo });
}

export async function ranking(request, reply) {
  const { inicio, fim } = request.query;
  const resultado = await orderService.getRankingVendas(inicio, fim);
  return reply.send({ data: resultado });
}