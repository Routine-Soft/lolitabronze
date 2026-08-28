import { useState, useEffect, useCallback } from "react";
import {
  getAllProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
} from "./produto.api";

export function useProdutos(limit = 10) {
  const [produtos, setProdutos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, pagination: p } = await getAllProdutos({ search, page, limit });
      setProdutos(data);
      setPagination(p);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    const fechData = async () => {
      await fetchProdutos();
    };
    fechData();
  }, [fetchProdutos]);

  function updateSearch(value) {
    setSearch(value);
    setPage(1); // toda busca nova volta pra página 1
  }

  async function addProduto(newProduto) {
    try {
      const response = await createProduto(newProduto);
      setSuccessMessage(response.message);
      await fetchProdutos();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editProduto(id, updatedProduto) {
    try {
      const response = await updateProduto(id, updatedProduto);
      setSuccessMessage(response.message);
      await fetchProdutos();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removeProduto(id) {
    try {
      const response = await deleteProduto(id);
      setSuccessMessage(response.message);
      await fetchProdutos();
    } catch (err) {
      setError(err);
    }
  }

  return {
    produtos,
    pagination,
    search,
    page,
    setPage,
    updateSearch,
    loading,
    error,
    successMessage,
    addProduto,
    editProduto,
    removeProduto,
    fetchProdutos,
  };
}