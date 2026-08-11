// modules/cash/cash.controller.js
import * as cashService from './cash.service.js';
import {
  toOpenSessionDto,
  toCloseSessionDto,
  toCreateMovementDto,
  toSessionResponseDto,
} from './cash.dto.js';

export async function open(request, reply) {
  const dto = toOpenSessionDto(request.body, request.user.id);
  const sessao = await cashService.openSession(dto);
  return reply.code(201).send(toSessionResponseDto(sessao));
}

export async function close(request, reply) {
  const dto = toCloseSessionDto(request.body, request.user.id);
  const { sessao, resumo } = await cashService.closeSession(request.params.id, dto);
  return reply.send(toSessionResponseDto(sessao, resumo));
}

export async function addMovement(request, reply) {
  const dto = toCreateMovementDto(request.body, request.user.id);
  const movimento = await cashService.createMovement(dto);
  return reply.code(201).send(movimento);
}

export async function getCurrent(request, reply) {
  const sessao = await cashService.getOpenSession();
  if (!sessao) return reply.code(404).send({ message: 'Nenhum caixa aberto' });
  const { resumo } = await cashService.getSessionSummary(sessao._id);
  return reply.send(toSessionResponseDto(sessao, resumo));
}