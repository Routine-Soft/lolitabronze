import httpClient from "@/services/httpClient";

export async function getAllCustomers({ search = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ search, page, limit }).toString();
  const response = await httpClient.get(`/customers?${params}`);
  return response; // { data: [...], pagination: {...} }
}

export async function getCustomerById(id) {
  const response = await httpClient.get(`/customers/${id}`);
  return response; // { data: {...} }
}

export async function createCustomer(newCustomer) {
  const response = await httpClient.post('/customers', newCustomer);
  return response; // { data: {...}, message: '...' }
}

export async function updateCustomer(id, customerData) {
  const response = await httpClient.patch(`/customers/${id}`, customerData);
  return response; // { data: {...}, message: '...' }
}

export async function deleteCustomer(id) {
  const response = await httpClient.delete(`/customers/${id}`);
  return response; // { message: '...' }
}