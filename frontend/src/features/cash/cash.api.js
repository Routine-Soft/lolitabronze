import httpClient from "@/services/httpClient";

// ====== SESSÕES (CAIXA) ======

export async function openSession(data) {
  const response = await httpClient.post('/cash/open', data);
  return response; // { data: {...}, message }
}

export async function getCurrentSession() {
  const response = await httpClient.get('/cash/current');
  return response; // { data: {...} }
}

export async function getAllSessions() {
  const response = await httpClient.get('/cash/sessions');
  return response; // { data: [...] }
}

export async function getSessionById(id) {
  const response = await httpClient.get(`/cash/sessions/${id}`);
  return response; // { data: {...} }
}

export async function closeSession(id, data) {
  const response = await httpClient.patch(`/cash/sessions/${id}/close`, data);
  return response; // { data: {...}, message }
}

export async function deleteSession(id) {
  const response = await httpClient.delete(`/cash/sessions/${id}`);
  return response; // { message }
}

// ====== MOVIMENTAÇÕES ======

export async function addMovement(data) {
  const response = await httpClient.post('/cash/movement', data);
  return response; // { data: {...}, message }
}

export async function addDespesa(data) {
  const response = await httpClient.post('/cash/despesa', data);
  return response; // { data: {...}, message }
}

export async function getAllMovements(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const response = await httpClient.get(`/cash/movements${params ? `?${params}` : ''}`);
  return response; // { data: [...] }
}

export async function getMovementById(id) {
  const response = await httpClient.get(`/cash/movements/${id}`);
  return response; // { data: {...} }
}

export async function updateMovement(id, data) {
  const response = await httpClient.patch(`/cash/movements/${id}`, data);
  return response; // { data: {...}, message }
}

export async function deleteMovement(id) {
  const response = await httpClient.delete(`/cash/movements/${id}`);
  return response; // { message }
}