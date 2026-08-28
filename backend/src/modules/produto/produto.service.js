// modules/produto/produto.service.js
import { ProdutoModel } from './produto.model.js';

export async function createProduto(dto) {
  return ProdutoModel.create(dto);
}

export async function listProdutos({ search = '', page = 1, limit = 10 } = {}) {
  const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ProdutoModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    ProdutoModel.countDocuments(filter),
  ]);

  return { items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

export async function getProdutoById(id) {
  return ProdutoModel.findById(id);
}

export async function updateProduto(id, dto) {
  return ProdutoModel.findByIdAndUpdate(id, dto, { new: true });
}

export async function deleteProduto(id) {
  return ProdutoModel.findByIdAndDelete(id);
}