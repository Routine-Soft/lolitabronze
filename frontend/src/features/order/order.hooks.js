import { useState, useEffect } from "react";
import {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  pagarRestante,
  getSlotAvailability,
  cancelOrder,
} from "./order.api";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // filtros de banco (tipo, status, dia)
  const [filtros, setFiltros] = useState({});
  // filtro derivado, aplicado em memória (não vai pro backend)
  const [filtroPagamento, setFiltroPagamento] = useState(''); // '' | 'PENDENTE' | 'COMPLETO'

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      try {
        setLoading(true);
        const { data } = await getAllOrders(filtros);
        if (!ignore) setOrders(data);
      } catch (err) {
        if (!ignore) setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOrders();

    return () => { ignore = true; };
  }, [filtros]);

  async function refreshOrders(filtros = {}) {
    try {
      setLoading(true);
      const { data } = await getAllOrders(filtros);
      setOrders(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function addOrder(newOrder) {
    try {
      const response = await createOrder(newOrder);
      setSuccessMessage(response.data.message);
      await refreshOrders();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editOrder(id, updatedOrder) {
    try {
      const response = await updateOrder(id, updatedOrder);
      setSuccessMessage(response.data.message);
      await refreshOrders();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removeOrder(id) {
    try {
      const response = await deleteOrder(id);
      setSuccessMessage(response.data.message);
      await refreshOrders();
    } catch (err) {
      setError(err);
    }
  }

  // troca o status do pedido (AGENDADO -> FINALIZADO / CANCELADO)
  // não mexe em dinheiro, só muda o estado do pedido
  async function changeStatus(id, status) {
    try {
      const response = await updateOrderStatus(id, status);
      setSuccessMessage(response.data.message);
      await refreshOrders();
      return response;
    } catch (err) {
      setError(err);
    }
  }

  // registra o pagamento do valor restante de um serviço que só teve sinal pago
  // lança o COMPLEMENTO no caixa, não mexe no status
  async function payRemaining(id, typePayment) {
    try {
      const response = await pagarRestante(id, typePayment);
      setSuccessMessage(response.data.message);
      await refreshOrders();
      return response;
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

  // aplica o filtro derivado por cima da lista que já veio filtrada do backend
  const ordersFiltrados = orders.filter((order) => {
    if (!filtroPagamento) return true;
    if (order.tipo !== 'SERVICO') return true; // produto sempre é pago total, não entra nesse filtro
    if (filtroPagamento === 'PENDENTE') return order.valorRestante > 0;
    if (filtroPagamento === 'COMPLETO') return order.valorRestante === 0;
    return true;
  });

  async function cancelOrderRequest(id, reembolso) {
    try {
      const response = await cancelOrder(id, reembolso);

      setSuccessMessage(response.data.message);

      await refreshOrders();

    } catch (error) {
      setError(error);
    }
  }

  return {
    orders: ordersFiltrados,
    loading,
    error,
    successMessage,
    filtros,
    setFiltros,
    filtroPagamento,
    setFiltroPagamento,
    addOrder,
    editOrder,
    removeOrder,
    changeStatus,
    payRemaining,
    checkSlotAvailability,
    cancelOrder: cancelOrderRequest,
    refreshOrders,
  };
}