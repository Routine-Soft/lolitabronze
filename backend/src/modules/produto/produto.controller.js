// modules/produto/produto.controller.js
import * as produtoService from './produto.service.js';
import { toCreateProdutoDto, toProdutoResponseDto } from './produto.dto.js';

export async function create(request, reply) {
  const dto = toCreateProdutoDto(request.body);
  const produto = await produtoService.createProduto(dto);
  return reply.code(201).send({
    data: toProdutoResponseDto(produto),
    message: 'Produto criado com sucesso',
  });
}

export async function list(request, reply) {
  const { search = '', page = 1, limit = 10 } = request.query;
  const { items, pagination } = await produtoService.listProdutos({ search, page: Number(page), limit: Number(limit) });
  return reply.send({ data: items.map(toProdutoResponseDto), pagination });
}

export async function getById(request, reply) {
  const produto = await produtoService.getProdutoById(request.params.id);
  if (!produto) return reply.code(404).send({ message: 'Produto não encontrado' });
  return reply.send({ data: toProdutoResponseDto(produto) });
}

export async function update(request, reply) {
  const produto = await produtoService.updateProduto(request.params.id, request.body);
  return reply.send({
    data: toProdutoResponseDto(produto),
    message: 'Produto atualizado com sucesso',
  });
}

export async function remove(request, reply) {
  await produtoService.deleteProduto(request.params.id);
  return reply.send({ message: 'Produto removido com sucesso' });
}