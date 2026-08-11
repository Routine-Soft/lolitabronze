// modules/item/item.controller.js
import * as itemService from './item.service.js';
import { toCreateItemDto, toItemResponseDto } from './item.dto.js';

export async function create(request, reply) {
  const dto = toCreateItemDto(request.body);
  const item = await itemService.createItem(dto);
  return reply.code(201).send(toItemResponseDto(item));
}

export async function list(request, reply) {
  const items = await itemService.listItems(request.query.type);
  return reply.send(items.map(toItemResponseDto));
}

export async function getById(request, reply) {
  const item = await itemService.getItemById(request.params.id);
  if (!item) return reply.code(404).send({ message: 'Item não encontrado' });
  return reply.send(toItemResponseDto(item));
}

export async function update(request, reply) {
  const item = await itemService.updateItem(request.params.id, request.body);
  return reply.send(toItemResponseDto(item));
}

export async function remove(request, reply) {
  await itemService.deleteItem(request.params.id);
  return reply.code(204).send();
}