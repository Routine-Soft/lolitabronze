import { useState, useEffect, useCallback } from "react";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  addProduto,
  addServico,
  updateItemProduto,
  updateItemServico,
  removerItem,
  fecharOrder,
  cancelarOrder,
  getSlotAvailability,
} from "./order.api";
import { notifyDashboardRefresh, onDashboardRefresh } from "../shared/events/dashboardEvents";

// ====== LISTA DE COMANDAS ======

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filtros, setFiltros] = useState({});
  const [filtroPagamento, setFiltroPagamento] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAllOrders(filtros);
      setOrders(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!ignore) await fetchOrders();
    }
    run();
    return () => { ignore = true; };
  }, [fetchOrders]);

  // se qualquer parte do app avisar que algo mudou, a lista se atualiza sozinha
  useEffect(() => {
    return onDashboardRefresh(fetchOrders);
  }, [fetchOrders]);

  async function novaOrder(customerId, observacao) {
    try {
      const response = await createOrder({ customerId, observacao });
      setSuccessMessage(response.message);
      await fetchOrders();
      notifyDashboardRefresh();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editarOrder(id, data) {
    try {
      const response = await updateOrder(id, data);
      setSuccessMessage(response.message);
      await fetchOrders();
      notifyDashboardRefresh();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function excluirOrder(id) {
    try {
      const response = await deleteOrder(id);
      setSuccessMessage(response.message);
      await fetchOrders();
      notifyDashboardRefresh();
    } catch (err) {
      setError(err);
    }
  }

  const ordersFiltradas = orders.filter((o) => {
    if (!filtroPagamento) return true;
    if (filtroPagamento === 'PENDENTE') return o.totalPendente > 0;
    if (filtroPagamento === 'COMPLETO') return o.totalPendente === 0;
    return true;
  });

  return {
    orders: ordersFiltradas,
    loading,
    error,
    successMessage,
    filtros,
    setFiltros,
    filtroPagamento,
    setFiltroPagamento,
    novaOrder,
    editarOrder,
    excluirOrder,
    fetchOrders,
  };
}

// ====== UMA COMANDA ESPECÍFICA (tela de atendimento) ======

export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const { data } = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!ignore) await fetchOrder();
    }
    run();
    return () => { ignore = true; };
  }, [fetchOrder]);

  async function adicionarProduto(produtoId, quantidade) {
    try {
      const response = await addProduto(orderId, { produtoId, quantidade });
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function adicionarServico(dto) {
    try {
      const response = await addServico(orderId, dto);
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editarItemProduto(itemId, quantidade) {
    try {
      const response = await updateItemProduto(orderId, itemId, { quantidade });
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
    } catch (err) {
      setError(err);
    }
  }

  async function editarItemServico(itemId, agenda) {
    try {
      const response = await updateItemServico(orderId, itemId, { agenda });
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
    } catch (err) {
      setError(err);
    }
  }

  async function removerItemDaOrder(itemId, estorno) {
    try {
      const response = await removerItem(orderId, itemId, estorno ? { estorno } : {});
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
    } catch (err) {
      setError(err);
    }
  }

  async function fechar(pagamentos) {
    try {
      const response = await fecharOrder(orderId, { pagamentos });
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function cancelar() {
    try {
      const response = await cancelarOrder(orderId);
      setSuccessMessage(response.message);
      await fetchOrder();
      notifyDashboardRefresh();
    } catch (err) {
      setError(err);
    }
  }

  async function excluir() {
    try {
      const response = await deleteOrder(orderId);
      setSuccessMessage(response.message);
      notifyDashboardRefresh();
    } catch (err) {
      setError(err);
    }
  }

  async function checkSlotAvailability(date) {
    try {
      const { data } = await getSlotAvailability(date);
      return data;
    } catch (err) {
      setError(err);
    }
  }

  return {
    order,
    loading,
    error,
    successMessage,
    adicionarProduto,
    adicionarServico,
    editarItemProduto,
    editarItemServico,
    removerItem: removerItemDaOrder,
    fechar,
    cancelar,
    excluir,
    checkSlotAvailability,
    refresh: fetchOrder,
  };
}