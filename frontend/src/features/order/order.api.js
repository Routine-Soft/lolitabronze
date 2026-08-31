import httpClient from "@/services/httpClient";

export async function createOrder(data) {
  const response = await httpClient.post('/orders', data);
  return response;
}

export async function getAllOrders(filtros = {}) {
  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(([, value]) => value !== undefined && value !== '')
  );
  const params = new URLSearchParams(filtrosLimpos).toString();
  const response = await httpClient.get(`/orders${params ? `?${params}` : ''}`);
  return response;
}

export async function getOrderById(id) {
  const response = await httpClient.get(`/orders/${id}`);
  return response;
}

export async function updateOrder(id, data) {
  const response = await httpClient.patch(`/orders/${id}`, data);
  return response;
}

export async function deleteOrder(id) {
  const response = await httpClient.delete(`/orders/${id}`);
  return response;
}

export async function addProduto(orderId, { produtoId, quantidade }) {
  const response = await httpClient.post(`/orders/${orderId}/produtos`, { produtoId, quantidade });
  return response;
}

export async function addServico(orderId, dto) {
  const response = await httpClient.post(`/orders/${orderId}/servicos`, dto);
  return response;
}

export async function updateItemProduto(orderId, itemId, { quantidade }) {
  const response = await httpClient.patch(`/orders/${orderId}/itens/${itemId}`, { quantidade });
  return response;
}

export async function updateItemServico(orderId, itemId, { agenda }) {
  const response = await httpClient.patch(`/orders/${orderId}/itens/${itemId}`, { agenda });
  return response;
}

export async function removerItem(orderId, itemId, body = {}) {
  const response = await httpClient.delete(`/orders/${orderId}/itens/${itemId}`, body);
  return response;
}

export async function fecharOrder(orderId, { pagamentos }) {
  const response = await httpClient.post(`/orders/${orderId}/fechar`, { pagamentos });
  return response;
}

export async function cancelarOrder(orderId) {
  const response = await httpClient.post(`/orders/${orderId}/cancelar`);
  return response;
}

export async function getSlotAvailability(date) {
  const response = await httpClient.get(`/orders-availability?date=${date}`);
  return response;
}