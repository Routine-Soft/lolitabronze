// modules/servico/servico.controller.js
import * as servicoService from './servico.service.js';
import { toCreateServicoDto, toServicoResponseDto } from './servico.dto.js';

export async function create(request, reply) {
  const dto = toCreateServicoDto(request.body);
  const servico = await servicoService.createServico(dto);
  return reply.code(201).send({
    data: toServicoResponseDto(servico),
    message: 'Serviço criado com sucesso',
  });
}

export async function list(request, reply) {
  const { search = '', page = 1, limit = 10 } = request.query;
  const { items, pagination } = await servicoService.listServicos({ search, page: Number(page), limit: Number(limit) });
  return reply.send({ data: items.map(toServicoResponseDto), pagination });
}

export async function getById(request, reply) {
  const servico = await servicoService.getServicoById(request.params.id);
  if (!servico) return reply.code(404).send({ message: 'Serviço não encontrado' });
  return reply.send({ data: toServicoResponseDto(servico) });
}

export async function update(request, reply) {
  const servico = await servicoService.updateServico(request.params.id, request.body);
  return reply.send({
    data: toServicoResponseDto(servico),
    message: 'Serviço atualizado com sucesso',
  });
}

export async function remove(request, reply) {
  await servicoService.deleteServico(request.params.id);
  return reply.send({ message: 'Serviço deletado com sucesso' });
}