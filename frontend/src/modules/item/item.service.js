// Item Service - Chamadas à API de itens
import apiService from '../../services/api.js'
import { createItemDTO, updateItemDTO, itemResponseDTO } from './item.dto.js'

export const ItemService = {
  // Criar item - Protegido
  async create(name, description, type, price, quantity, discount) {
    const dto = createItemDTO({ name, description, type, price, quantity, discount })
    const response = await apiService.post('/items', dto)
    // Backend retorna o item direto, não em response.data
    return itemResponseDTO(response.data || response)
  },

  // Listar itens - Protegido
  async list(type = '') {
    const url = type ? `/items?type=${type}` : '/items'
    const response = await apiService.get(url)
    // Backend pode retorrer array direto ou em response.data
    const items = Array.isArray(response) ? response : (response.data || [])
    return items.map(item => itemResponseDTO(item))
  },

  // Listar apenas produtos - Protegido
  async listProducts() {
    return this.list('PRODUCT')
  },

  // Listar apenas serviços - Protegido
  async listServices() {
    return this.list('SERVICE')
  },

  // Buscar item por ID - Protegido
  async getById(id) {
    const response = await apiService.get(`/items/${id}`)
    return itemResponseDTO(response.data || response)
  },

  // Atualizar item - Protegido
  async update(id, name, description, type, price, quantity, discount) {
    const dto = updateItemDTO({ name, description, type, price, quantity, discount })
    const response = await apiService.patch(`/items/${id}`, dto)
    return itemResponseDTO(response.data || response)
  },

  // Deletar item - Protegido
  async delete(id) {
    const response = await apiService.delete(`/items/${id}`)
    return response.data || response
  },
}

export default ItemService
