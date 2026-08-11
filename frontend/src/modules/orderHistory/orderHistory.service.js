// Order History Service - Chamadas à API de pedidos
import apiService from '../../services/api.js'
import { createOrderDTO, orderResponseDTO } from './orderHistory.dto.js'

export const OrderHistoryService = {
  // Criar pedido - Protegido
  // IMPORTANTE: sinal SEMPRE deve ser true
  async create(customerId, items, userId, observacao = '', sinal = true) {
    const dto = createOrderDTO({
      customerId,
      items,
      userId,
      observacao,
      sinal,
    })
    const response = await apiService.post('/orders', dto)
    return orderResponseDTO(response.data)
  },

  // Listar pedidos - Protegido
  async list() {
    const response = await apiService.get('/orders')
    return (response.data || []).map(order => orderResponseDTO(order))
  },

  // Buscar pedido por ID - Protegido
  async getById(id) {
    const response = await apiService.get(`/orders/${id}`)
    return orderResponseDTO(response.data)
  },
}

export default OrderHistoryService
