import { useState, useEffect, useCallback } from "react";
import {
  abrirComanda,
  getAllComandas,
  getComandaById,
  addProdutoComanda,
  addServicoComanda,
  removerItemComanda,
  fecharComanda,
  cancelarComanda,
  getSlotAvailabilityComanda,
} from "./comanda.api";

export function useComandas() {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('ABERTA'); // padrão: mostra as comandas abertas

  const fetchComandas = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAllComandas({ status: filtroStatus || undefined });
      setComandas(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    async function fetch() {
      await fetchComandas();
    }
    fetch();
  }, [fetchComandas]);

  async function novaComanda(customerId, observacao) {
    try {
      const response = await abrirComanda({ customerId, observacao });
      setSuccessMessage(response.message);
      await fetchComandas();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removerComandaDaLista(id) {
    // não existe delete físico de comanda ainda — placeholder caso você queira no futuro
  }

  return {
    comandas,
    loading,
    error,
    successMessage,
    filtroStatus,
    setFiltroStatus,
    novaComanda,
    fetchComandas,
  };
}

// hook separado, para trabalhar dentro de UMA comanda específica (tela de detalhe)
export function useComanda(comandaId) {
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchComanda = useCallback(async () => {
    if (!comandaId) return;
    try {
      setLoading(true);
      const { data } = await getComandaById(comandaId);
      setComanda(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [comandaId]);

  useEffect(() => {
    async function fetch() {
      await fetchComanda();
    }
    fetch();
  }, [fetchComanda]);

  async function addProduto(produtoId, quantidade) {
    try {
      const response = await addProdutoComanda(comandaId, { produtoId, quantidade });
      setSuccessMessage(response.message);
      await fetchComanda();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function addServico(dto) {
    try {
      const response = await addServicoComanda(comandaId, dto);
      setSuccessMessage(response.message);
      await fetchComanda();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removerItem(itemId) {
    try {
      const response = await removerItemComanda(comandaId, itemId);
      setSuccessMessage(response.message);
      await fetchComanda();
    } catch (err) {
      setError(err);
    }
  }

  async function fechar(typePayment) {
    try {
      const response = await fecharComanda(comandaId, { typePayment });
      setSuccessMessage(response.message);
      await fetchComanda();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function cancelar() {
    try {
      const response = await cancelarComanda(comandaId);
      setSuccessMessage(response.message);
      await fetchComanda();
    } catch (err) {
      setError(err);
    }
  }

  async function checkSlotAvailability(date) {
    try {
      const { data } = await getSlotAvailabilityComanda(date);
      return data;
    } catch (err) {
      setError(err);
    }
  }

  return {
    comanda,
    loading,
    error,
    successMessage,
    addProduto,
    addServico,
    removerItem,
    fechar,
    cancelar,
    checkSlotAvailability,
    refresh: fetchComanda,
  };
}