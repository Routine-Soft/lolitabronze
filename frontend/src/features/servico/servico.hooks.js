import { useState, useEffect, useCallback } from "react";
import {
  getAllServicos,
  createServico,
  updateServico,
  deleteServico,
} from "./servico.api";

export function useServicos(limit = 10) {
  const [servicos, setServicos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchServicos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, pagination: p } = await getAllServicos({ search, page, limit });
      setServicos(data);
      setPagination(p);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    const fechData = async () => {
      await fetchServicos();
    };
    fechData();
  }, [fetchServicos]);

  function updateSearch(value) {
    setSearch(value);
    setPage(1); // toda busca nova volta pra página 1
  }

  async function addServico(newServico) {
    try {
      const response = await createServico(newServico);
      setSuccessMessage(response.message);
      await fetchServicos();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editServico(id, updatedServico) {
    try {
      const response = await updateServico(id, updatedServico);
      setSuccessMessage(response.message);
      await fetchServicos();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removeServico(id) {
    try {
      const response = await deleteServico(id);
      setSuccessMessage(response.message);
      await fetchServicos();
    } catch (err) {
      setError(err);
    }
  }

  return {
    servicos,
    pagination,
    search,
    page,
    setPage,
    updateSearch,
    loading,
    error,
    successMessage,
    addServico,
    editServico,
    removeServico,
    fetchServicos,
  };
}