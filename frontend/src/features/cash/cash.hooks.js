import { useState, useEffect, useCallback } from "react";
import {
  openSession,
  getCurrentSession,
  getAllSessions,
  closeSession,
  deleteSession,
  addMovement,
  addDespesa,
  getAllMovements,
  updateMovement,
  deleteMovement,
} from "./cash.api";

export function useCash() {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const refreshSessions = useCallback(async () => {
    const [current, all] = await Promise.all([
      getCurrentSession().catch(() => ({ data: null })), // sem caixa aberto não é erro
      getAllSessions(),
    ]);
    setCurrentSession(current.data);
    setSessions(all.data);
  }, []);

  const refreshMovements = useCallback(async (filtros = {}) => {
    const { data } = await getAllMovements(filtros);
    setMovements(data);
  }, []);

  // refresh combinado: sempre que mexe em movimentação, a sessão também precisa atualizar
  // (o resumo com totalEntradas/totalSaidas/lucro é calculado em cima dos movimentos)
  const refreshAll = useCallback(async (filtros = {}) => {
    await Promise.all([refreshSessions(), refreshMovements(filtros)]);
  }, [refreshSessions, refreshMovements]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        await refreshAll();
      } catch (err) {
        if (!ignore) setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadInitialData();

    return () => { ignore = true; };
  }, [refreshAll]);

  // ====== SESSÕES ======

  async function openCashSession(valorAbertura) {
    try {
      const response = await openSession({ valorAbertura });
      setSuccessMessage(response.message);
      await refreshSessions();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function closeCashSession(id, valorFechamentoContado) {
    try {
      const response = await closeSession(id, { valorFechamentoContado });
      setSuccessMessage(response.message);
      await refreshSessions();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removeSession(id) {
    try {
      const response = await deleteSession(id);
      setSuccessMessage(response.message);
      await refreshSessions();
    } catch (err) {
      setError(err);
    }
  }

  // ====== MOVIMENTAÇÕES ======
  // toda mutação de movimento chama refreshAll, não só refreshMovements —
  // é isso que resolve o "preciso apertar F5"

  async function addCashMovement(movementData) {
    try {
      const response = await addMovement(movementData);
      setSuccessMessage(response.message);
      await refreshAll();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function addCashDespesa(despesaData) {
    try {
      const response = await addDespesa(despesaData);
      setSuccessMessage(response.message);
      await refreshAll();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editMovement(id, updatedData) {
    try {
      const response = await updateMovement(id, updatedData);
      setSuccessMessage(response.message);
      await refreshAll();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removeMovement(id) {
    try {
      const response = await deleteMovement(id);
      setSuccessMessage(response.message);
      await refreshAll();
    } catch (err) {
      setError(err);
    }
  }

  return {
    currentSession,
    sessions,
    movements,
    loading,
    error,
    successMessage,
    openCashSession,
    closeCashSession,
    removeSession,
    addCashMovement,
    addCashDespesa,
    editMovement,
    removeMovement,
    refreshMovements, // exposto separado, útil pro filtro de movimentações não mexer na sessão à toa
  };
}