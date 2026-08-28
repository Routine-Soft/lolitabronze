import httpClient from "@/services/httpClient";

// order.api.js
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

export async function createOrder(newOrder) {
  const response = await httpClient.post('/orders', newOrder);
  return response;
}

export async function updateOrder(id, orderData) {
  const response = await httpClient.patch(`/orders/${id}`, orderData);
  return response;
}

export async function deleteOrder(id) {
  const response = await httpClient.delete(`/orders/${id}`);
  return response;
}

export async function updateOrderStatus(id, status) {
  const response = await httpClient.patch(`/orders/${id}/status`, { status });
  return response;
}

export async function pagarRestante(id, typePayment) {
  const response = await httpClient.post(`/orders/${id}/pagamento`, { typePayment });
  return response;
}

export async function getSlotAvailability(date) {
  const response = await httpClient.get(`/orders-availability?date=${date}`);
  return response;
}

export async function cancelOrder(id, reembolso) {
  const response = await httpClient.patch(
    `/orders/${id}/cancelar`,
    { reembolso }
  );

  return response;
}