// modules/cash/cash.controller.js
import * as cashService from './cash.service.js';
import {
  toOpenSessionDto,
  toCloseSessionDto,
  toCreateMovementDto,
  toDespesaDto,
  toSessionResponseDto,
  toMovementResponseDto,
} from './cash.dto.js';

// ====== SESSÕES ======

export async function open(request, reply) {
  const dto = toOpenSessionDto(request.body, request.user.id);
  const sessao = await cashService.openSession(dto);
  return reply.code(201).send({ data: toSessionResponseDto(sessao), message: 'Caixa aberto com sucesso' });
}

export async function listSessions(request, reply) {
  const sessoes = await cashService.listSessions();
  return reply.send({ data: sessoes.map((s) => toSessionResponseDto(s)) });
}

export async function getSessionById(request, reply) {
  const sessao = await cashService.getSessionById(request.params.id);
  if (!sessao) return reply.code(404).send({ message: 'Sessão não encontrada' });
  const { resumo } = await cashService.getSessionSummary(sessao._id);
  return reply.send({ data: toSessionResponseDto(sessao, resumo) });
}

export async function getCurrent(request, reply) {
  const sessao = await cashService.getOpenSession();
  if (!sessao) return reply.code(404).send({ message: 'Nenhum caixa aberto' });
  const { resumo } = await cashService.getSessionSummary(sessao._id);
  return reply.send({ data: toSessionResponseDto(sessao, resumo) });
}

export async function close(request, reply) {
  const dto = toCloseSessionDto(request.body, request.user.id);
  const { sessao, resumo } = await cashService.closeSession(request.params.id, dto);
  return reply.send({ data: toSessionResponseDto(sessao, resumo), message: 'Caixa fechado com sucesso' });
}

export async function deleteSession(request, reply) {
  await cashService.deleteSession(request.params.id);
  return reply.send({ message: 'Sessão deletada com sucesso' });
}

// ====== MOVIMENTAÇÕES ======

export async function addMovement(request, reply) {
  const dto = toCreateMovementDto(request.body, request.user.id);
  const movimento = await cashService.createMovement(dto);
  return reply.code(201).send({ data: toMovementResponseDto(movimento), message: 'Movimentação registrada com sucesso' });
}

export async function addDespesa(request, reply) {
  const dto = toDespesaDto(request.body, request.user.id);
  const movimento = await cashService.createDespesa(dto);
  return reply.code(201).send({ data: toMovementResponseDto(movimento), message: 'Despesa registrada com sucesso' });
}

export async function listMovements(request, reply) {
  const { tipo, categoria } = request.query;
  const filtros = {};
  if (tipo) filtros.tipo = tipo;
  if (categoria) filtros.categoria = categoria;

  const movements = await cashService.listMovements(filtros);
  return reply.send({ data: movements.map(toMovementResponseDto) });
}

export async function getMovementById(request, reply) {
  const movimento = await cashService.getMovementById(request.params.id);
  if (!movimento) return reply.code(404).send({ message: 'Movimentação não encontrada' });
  return reply.send({ data: toMovementResponseDto(movimento) });
}

export async function updateMovement(request, reply) {
  const movimento = await cashService.updateMovement(request.params.id, request.body);
  if (!movimento) return reply.code(404).send({ message: 'Movimentação não encontrada' });
  return reply.send({ data: toMovementResponseDto(movimento), message: 'Movimentação atualizada com sucesso' });
}

export async function deleteMovement(request, reply) {
  await cashService.deleteMovement(request.params.id);
  return reply.send({ message: 'Movimentação deletada com sucesso' });
}

export async function relatorio(request, reply) {
  const { inicio, fim } = request.query;
  const resumo = await cashService.getRelatorioCaixa(inicio, fim);
  return reply.send({ data: resumo });
}