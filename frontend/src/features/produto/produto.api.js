import httpClient from "@/services/httpClient";

export async function getAllProdutos({ search = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ search, page, limit }).toString();
  const response = await httpClient.get(`/produtos?${params}`);
  return response; // { data: [...], pagination: {...} }
}

export async function getProdutoById(id) {
  const response = await httpClient.get(`/produtos/${id}`);
  return response; // { data: {...} }
}

export async function createProduto(newProduto) {
  const response = await httpClient.post('/produtos', newProduto);
  return response; // { data: {...}, message }
}

export async function updateProduto(id, produtoData) {
  const response = await httpClient.patch(`/produtos/${id}`, produtoData);
  return response; // { data: {...}, message }
}

export async function deleteProduto(id) {
  const response = await httpClient.delete(`/produtos/${id}`);
  return response; // { message }
}