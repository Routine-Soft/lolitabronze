// Order History Service - Chamadas à API de pedidos
import apiService from '../../services/api.js'
import { createOrderDTO, orderResponseDTO } from './orderHistory.dto.js'

export const OrderHistoryService = {
  // Criar pedido - Protegido
  // IMPORTANTE: sinal SEMPRE deve ser true
  // typePayment: 'pix' | 'dinheiro' | 'cartao'
  // agenda: ISO date string (data/hora em formato 9:00-18:30, slots de 30 min)
  async create(customerId, items, userId, observacao = '', sinal = true, typePayment, agenda) {
    const dto = createOrderDTO({
      customerId,
      items,
      userId,
      observacao,
      sinal,
      typePayment,
      agenda,
    })
    const response = await apiService.post('/orders', dto)
    return orderResponseDTO(response.data || response)
  },

  // Listar pedidos - Protegido
  async list() {
    const response = await apiService.get('/orders')
    return (Array.isArray(response) ? response : (response.data || [])).map(order => orderResponseDTO(order))
  },

  // Buscar pedido por ID - Protegido
  async getById(id) {
    const response = await apiService.get(`/orders/${id}`)
    return orderResponseDTO(response.data || response)
  },
}

export default OrderHistoryService
