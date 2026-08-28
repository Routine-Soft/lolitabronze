import httpClient from "@/services/httpClient";

export async function getRelatorioCaixa(inicio, fim) {
  const response = await httpClient.get(`/cash/relatorio?inicio=${inicio}&fim=${fim}`);
  return response;
}

export async function getRelatorioFaturamento(inicio, fim) {
  const response = await httpClient.get(`/orders-faturamento?inicio=${inicio}&fim=${fim}`);
  return response;
}

export async function getRankingVendas(inicio, fim) {
  const response = await httpClient.get(`/orders-ranking?inicio=${inicio}&fim=${fim}`);
  return response;
}