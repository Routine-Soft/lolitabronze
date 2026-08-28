// modules/customer/customer.controller.js
import * as customerService from './customer.service.js';
import { toCreateCustomerDto, toCustomerResponseDto } from './customer.dto.js';

export async function create(request, reply) {
  const dto = toCreateCustomerDto(request.body);
  const customer = await customerService.createCustomer(dto);
  return reply.code(201).send({
    data: toCustomerResponseDto(customer),
    message: 'Cliente criado com sucesso',
  });
}

export async function list(request, reply) {
  const { search = '', page = 1, limit = 10 } = request.query;
  const { items, pagination } = await customerService.listCustomers({ search, page: Number(page), limit: Number(limit) });
  return reply.send({ data: items.map(toCustomerResponseDto), pagination });
}

export async function getById(request, reply) {
  const customer = await customerService.getCustomerById(request.params.id);
  if (!customer) return reply.code(404).send({ message: 'Cliente não encontrado' });
  return reply.send({ data: toCustomerResponseDto(customer) });
}

export async function update(request, reply) {
  const customer = await customerService.updateCustomer(request.params.id, request.body);
  return reply.send({
    data: toCustomerResponseDto(customer),
    message: 'Cliente atualizado com sucesso',
  });
}

export async function remove(request, reply) {
  await customerService.deleteCustomer(request.params.id);
  return reply.send({ message: 'Cliente deletado com sucesso' });
}