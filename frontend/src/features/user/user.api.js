import httpClient from "@/services/httpClient";

// ====== AUTENTICAÇÃO ======

export async function loginUser(credentials) {
  const response = await httpClient.post('/users/login', credentials);
  return response; // { data: { accessToken, refreshToken, user }, message }
}

export async function logoutUser() {
  const response = await httpClient.post('/users/logout');
  return response; // { data: null, message }
}

// ====== CRUD ======

export async function getAllUsers() {
  const response = await httpClient.get('/users');
  return response; // { data: [...] }
}

export async function getUserById(id) {
  const response = await httpClient.get(`/users/${id}`);
  return response; // { data: {...} }
}

export async function createUser(newUser) {
  const response = await httpClient.post('/users', newUser);
  return response; // { data: {...}, message }
}

export async function updateUser(id, userData) {
  const response = await httpClient.patch(`/users/${id}`, userData);
  return response; // { data: {...}, message }
}

export async function deleteUser(id) {
  const response = await httpClient.delete(`/users/${id}`);
  return response; // { data: null, message }
}

export async function updatePassword(id, passwordData) {
  const response = await httpClient.post(`/users/${id}/password`, passwordData);
  return response; // { data: null, message }
}