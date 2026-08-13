// Order History Controller - Lógica de gerenciamento de pedidos
import OrderHistoryService from '../orderHistory/orderHistory.service.js'
import { validateOrder } from '../orderHistory/orderHistory.dto.js'

export class OrderHistoryController {
  constructor() {
    this.orders = []
    this.loading = false
    this.error = null
    this.observers = []
  }

  subscribe(callback) {
    this.observers.push(callback)
  }

  notify() {
    this.observers.forEach(callback => callback())
  }

  // Criar pedido
  async create(customerId, items, userId, observacao = '', sinal = true, typePayment, agenda) {
    this.loading = true
    this.error = null

    try {
      const validation = validateOrder({ customerId, items, userId, sinal, typePayment, agenda })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const order = await OrderHistoryService.create(customerId, items, userId, observacao, sinal, typePayment, agenda)
      this.orders.push(order)
      this.notify()
      return order
    } catch (error) {
      this.error = error.message || 'Erro ao criar pedido'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Listar pedidos
  async list() {
    this.loading = true
    this.error = null

    try {
      this.orders = await OrderHistoryService.list()
      this.notify()
      return this.orders
    } catch (error) {
      this.error = error.message || 'Erro ao listar pedidos'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Buscar pedido por ID
  async getById(id) {
    this.loading = true
    this.error = null

    try {
      return await OrderHistoryService.getById(id)
    } catch (error) {
      this.error = error.message || 'Erro ao buscar pedido'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Calcular total do pedido
  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.precoUnitario * item.quantidade)
    }, 0)
  }

  // Obter resumo do pedido
  getOrderSummary(order) {
    return {
      id: order.id,
      numeroAtendimento: order.numeroAtendimento,
      customer: order.customer,
      itemsCount: order.items.length,
      total: order.total,
      typePayment: order.typePayment,
      agenda: order.agenda,
      date: new Date(order.createdAt).toLocaleDateString('pt-BR'),
      time: new Date(order.createdAt).toLocaleTimeString('pt-BR'),
    }
  }

  clearError() {
    this.error = null
    this.notify()
  }
}

export default new OrderHistoryController()
