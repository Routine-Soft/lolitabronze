import * as orderService from './order.service.js';
import * as cashService from '../cash/cash.service.js'; // novo import
import { toOrderResponseDto } from './order.dto.js';

async function toDtoComFormas(order) {
  const formasPorOrder = await cashService.getFormasPagamentoPorOrders([order._id]);
  return toOrderResponseDto(order, formasPorOrder[order._id.toString()] ?? []);
}

export async function create(request, reply) {
  const order = await orderService.createOrder({ ...request.body, userId: request.user.id });
  return reply.code(201).send({ data: toOrderResponseDto(order), message: 'Comanda aberta' });
}

export async function list(request, reply) {
  const { status, dia } = request.query;
  const filtros = {};
  if (status) filtros.status = status;
  if (dia) {
    const [year, month, day] = dia.split('-').map(Number);
    const inicio = new Date(year, month - 1, day, 0, 0, 0, 0);
    const fim = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    filtros.$or = [
      { createdAt: { $gte: inicio, $lt: fim } },
      { 'itens.agenda': { $gte: inicio, $lt: fim } },
    ];
  }
  const orders = await orderService.listOrders(filtros);
  const formasPorOrder = await cashService.getFormasPagamentoPorOrders(orders.map((o) => o._id));
  return reply.send({ data: orders.map((o) => toOrderResponseDto(o, formasPorOrder[o._id.toString()] ?? [])) });
}

export async function getById(request, reply) {
  const order = await orderService.getOrderById(request.params.id);
  if (!order) return reply.code(404).send({ message: 'Comanda não encontrada' });
  return reply.send({ data: await toDtoComFormas(order) });
}

export async function update(request, reply) {
  const order = await orderService.updateOrder(request.params.id, request.body);
  return reply.send({ data: await toDtoComFormas(order), message: 'Comanda atualizada' });
}

export async function remove(request, reply) {
  await orderService.deleteOrder(request.params.id);
  return reply.send({ message: 'Comanda excluída' });
}

export async function addProduto(request, reply) {
  const order = await orderService.adicionarProduto(request.params.id, request.body);
  return reply.send({ data: await toDtoComFormas(order), message: 'Produto adicionado' });
}

export async function addServico(request, reply) {
  const order = await orderService.adicionarServico(request.params.id, { ...request.body, userId: request.user.id });
  return reply.send({ data: await toDtoComFormas(order), message: 'Serviço adicionado' });
}

export async function updateItem(request, reply) {
  const { id, itemId } = request.params;
  const order = request.body.quantidade !== undefined
    ? await orderService.updateItemProduto(id, itemId, request.body)
    : await orderService.updateItemServico(id, itemId, request.body);
  return reply.send({ data: await toDtoComFormas(order), message: 'Item atualizado' });
}

export async function removerItem(request, reply) {
  const order = await orderService.removerItem(request.params.id, request.params.itemId, {
    ...request.body,
    userId: request.user.id,
  });
  return reply.send({ data: await toDtoComFormas(order), message: 'Item removido' });
}

export async function fechar(request, reply) {
  const order = await orderService.fecharOrder(request.params.id, { ...request.body, userId: request.user.id });
  return reply.send({ data: await toDtoComFormas(order), message: 'Comanda fechada' });
}

export async function cancelar(request, reply) {
  const order = await orderService.cancelarOrder(request.params.id);
  return reply.send({ data: await toDtoComFormas(order), message: 'Comanda cancelada' });
}

export async function slots(request, reply) {
  const { date } = request.query;
  if (!date) return reply.code(400).send({ message: 'Parâmetro "date" é obrigatório (YYYY-MM-DD)' });
  const data = await orderService.getSlotAvailability(date);
  return reply.send({ data });
}

export async function relatorioFaturamento(request, reply) {
  const { inicio, fim } = request.query;
  const [resumo, porTypePayment] = await Promise.all([
    orderService.getRelatorioFaturamento(inicio, fim),
    cashService.getVendasPorTypePayment(inicio, fim),
  ]);
  return reply.send({ data: { ...resumo, porTypePayment } });
}

export async function ranking(request, reply) {
  const { inicio, fim } = request.query;
  const resultado = await orderService.getRankingVendas(inicio, fim);
  return reply.send({ data: resultado });
}