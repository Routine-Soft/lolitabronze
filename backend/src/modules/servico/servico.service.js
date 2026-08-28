// modules/servico/servico.service.js
import { ServicoModel } from './servico.model.js';

export async function createServico(dto) {
  return ServicoModel.create(dto);
}

export async function listServicos({ search = '', page = 1, limit = 10 } = {}) {
  const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ServicoModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    ServicoModel.countDocuments(filter),
  ]);

  return { items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

export async function getServicoById(id) {
  return ServicoModel.findById(id);
}

export async function updateServico(id, dto) {
  return ServicoModel.findByIdAndUpdate(id, dto, { new: true });
}

export async function deleteServico(id) {
  return ServicoModel.findByIdAndDelete(id);
}