import { useState, useRef, useEffect, useCallback } from "react";
import { getRelatorioCaixa, getRelatorioFaturamento, getRankingVendas } from "./relatorio.api";
import { onDashboardRefresh } from "../shared/events/dashboardEvents";

export function useRelatorio() {
  const [caixa, setCaixa] = useState(null);
  const [faturamento, setFaturamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const periodoRef = useRef(null); // guarda o último período buscado, pra reusar quando o evento disparar

  const buscarRelatorio = useCallback(async (inicio, fim) => {
    periodoRef.current = { inicio, fim };
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
  }, []);

  useEffect(() => {
    return onDashboardRefresh(() => {
      if (periodoRef.current) {
        buscarRelatorio(periodoRef.current.inicio, periodoRef.current.fim);
      }
    });
  }, [buscarRelatorio]);

  return { caixa, faturamento, loading, error, buscarRelatorio };
}

export function useRankingVendas() {
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const periodoRef = useRef(null);

  const buscarRanking = useCallback(async (inicio, fim) => {
    periodoRef.current = { inicio, fim };
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
  }, []);

  useEffect(() => {
    return onDashboardRefresh(() => {
      if (periodoRef.current) {
        buscarRanking(periodoRef.current.inicio, periodoRef.current.fim);
      }
    });
  }, [buscarRanking]);

  return { produtos, servicos, clientes, loading, error, buscarRanking };
}