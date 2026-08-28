import httpClient from "@/services/httpClient";

export async function testPrinter(texto) {
  const response = await httpClient.post('/print/test', { texto });
  return response; // { data: { message }, message }
}

export async function printOrder(orderId) {
  const response = await httpClient.post(`/print/order/${orderId}`);
  return response; // { data: { message }, message }
}