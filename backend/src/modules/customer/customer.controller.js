// modules/customer/customer.controller.js
import * as customerService from './customer.service.js';
import { toCreateCustomerDto, toCustomerResponseDto } from './customer.dto.js';

export async function create(request, reply) {
  const dto = toCreateCustomerDto(request.body);
  const customer = await customerService.createCustomer(dto);
  return reply.code(201).send(toCustomerResponseDto(customer));
}

export async function list(request, reply) {
  const customers = await customerService.listCustomers(request.query.search);
  return reply.send(customers.map(toCustomerResponseDto));
}

export async function getById(request, reply) {
  const customer = await customerService.getCustomerById(request.params.id);
  if (!customer) return reply.code(404).send({ message: 'Cliente não encontrado' });
  return reply.send(toCustomerResponseDto(customer));
}

export async function update(request, reply) {
  const customer = await customerService.updateCustomer(request.params.id, request.body);
  return reply.send(toCustomerResponseDto(customer));
}

export async function remove(request, reply) {
  await customerService.deleteCustomer(request.params.id);
  return reply.code(204).send();
}