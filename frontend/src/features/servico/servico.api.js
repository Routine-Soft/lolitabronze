import httpClient from "@/services/httpClient";

export async function getAllServicos({ search = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ search, page, limit }).toString();
  const response = await httpClient.get(`/servicos?${params}`);
  return response; // { data: [...], pagination: {...} }
}

export async function getServicoById(id) {
  const response = await httpClient.get(`/servicos/${id}`);
  return response; // { data: {...} }
}

export async function createServico(newServico) {
  const response = await httpClient.post('/servicos', newServico);
  return response; // { data: {...}, message }
}

export async function updateServico(id, servicoData) {
  const response = await httpClient.patch(`/servicos/${id}`, servicoData);
  return response; // { data: {...}, message }
}

export async function deleteServico(id) {
  const response = await httpClient.delete(`/servicos/${id}`);
  return response; // { message }
}