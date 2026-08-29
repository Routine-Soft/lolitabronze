import httpClient from "@/services/httpClient";

export async function abrirComanda(data) {
  const response = await httpClient.post('/comandas', data);
  return response; // { data: {...}, message }
}

export async function getAllComandas(filtros = {}) {
  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(([, value]) => value !== undefined && value !== '')
  );
  const params = new URLSearchParams(filtrosLimpos).toString();
  const response = await httpClient.get(`/comandas${params ? `?${params}` : ''}`);
  return response; // { data: [...] }
}

export async function getComandaById(id) {
  const response = await httpClient.get(`/comandas/${id}`);
  return response; // { data: {...} }
}

export async function addProdutoComanda(comandaId, { produtoId, quantidade }) {
  const response = await httpClient.post(`/comandas/${comandaId}/produtos`, { produtoId, quantidade });
  return response; // { data: {...}, message }
}

export async function addServicoComanda(comandaId, dto) {
  const response = await httpClient.post(`/comandas/${comandaId}/servicos`, dto);
  return response; // { data: {...}, message }
}

export async function removerItemComanda(comandaId, itemId) {
  const response = await httpClient.delete(`/comandas/${comandaId}/itens/${itemId}`);
  return response; // { data: {...}, message }
}

export async function fecharComanda(comandaId, { typePayment }) {
  const response = await httpClient.post(`/comandas/${comandaId}/fechar`, { typePayment });
  return response; // { data: {...}, message }
}

export async function cancelarComanda(comandaId) {
  const response = await httpClient.post(`/comandas/${comandaId}/cancelar`);
  return response; // { data: {...}, message }
}

export async function getSlotAvailabilityComanda(date) {
  const response = await httpClient.get(`/comandas-availability?date=${date}`);
  return response; // { data: [...] }
}