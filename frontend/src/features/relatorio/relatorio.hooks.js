import { useState } from "react";
import { getRelatorioCaixa, getRelatorioFaturamento, getRankingVendas } from "./relatorio.api";

export function useRelatorio() {
  const [caixa, setCaixa] = useState(null);
  const [faturamento, setFaturamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function buscarRelatorio(inicio, fim) {
    try {
      setLoading(true);
      setError(null);
      const [resCaixa, resFaturamento] = await Promise.all([
        getRelatorioCaixa(inicio, fim),
        getRelatorioFaturamento(inicio, fim),
      ]);
      setCaixa(resCaixa.data);
      setFaturamento(resFaturamento.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return { caixa, faturamento, loading, error, buscarRelatorio};
}

export function useRankingVendas() {
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]); // novo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function buscarRanking(inicio, fim) {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getRankingVendas(inicio, fim);
      setProdutos(data.produtos);
      setServicos(data.servicos);
      setClientes(data.clientes);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return { produtos, servicos, clientes, loading, error, buscarRanking };
}