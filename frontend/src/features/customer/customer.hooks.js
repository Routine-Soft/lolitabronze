import { useState, useEffect, useCallback } from "react";
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from "./customer.api";

export function useCustomers(limit = 10) {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, pagination: p } = await getAllCustomers({ search, page, limit });
      setCustomers(data);
      setPagination(p);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => { 
    const fechData = async () => {
      await fetchCustomers();
    };
    fechData();
  }, [fetchCustomers]);

  function updateSearch(value) {
    setSearch(value);
    setPage(1); // toda busca nova volta pra página 1
  }

  async function addCustomer(newCustomer) {
    try {
      const response = await createCustomer(newCustomer);
      setSuccessMessage(response.message);
      await fetchCustomers();
      return response.data;
    } catch (err) { setError(err); }
  }

  async function editCustomer(id, updatedCustomer) {
    try {
      const response = await updateCustomer(id, updatedCustomer);
      setSuccessMessage(response.message);
      await fetchCustomers();
      return response.data;
    } catch (err) { setError(err); }
  }

  async function removeCustomer(id) {
    try {
      const response = await deleteCustomer(id);
      setSuccessMessage(response.message);
      await fetchCustomers();
    } catch (err) { setError(err); }
  }

  return {
    customers, pagination, search, page,
    setPage, updateSearch,
    loading, error, successMessage,
    addCustomer, editCustomer, removeCustomer,
  };
}