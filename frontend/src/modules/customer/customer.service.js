// Customer Service - Chamadas à API de clientes
import apiService from '../../services/api.js'
import { createCustomerDTO, updateCustomerDTO, customerResponseDTO } from './customer.dto.js'

export const CustomerService = {
  // Criar cliente - Protegido
  async create(name, phone) {
    const dto = createCustomerDTO({ name, phone })
    const response = await apiService.post('/customers', dto)
    return customerResponseDTO(response.data)
  },

  // Listar clientes - Protegido
  async list(search = '') {
    const url = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers'
    const response = await apiService.get(url)
    return (response.data || []).map(customer => customerResponseDTO(customer))
  },

  // Buscar cliente por ID - Protegido
  async getById(id) {
    const response = await apiService.get(`/customers/${id}`)
    return customerResponseDTO(response.data)
  },

  // Atualizar cliente - Protegido
  async update(id, name, phone) {
    const dto = updateCustomerDTO({ name, phone })
    const response = await apiService.patch(`/customers/${id}`, dto)
    return customerResponseDTO(response.data)
  },

  // Deletar cliente - Protegido
  async delete(id) {
    const response = await apiService.delete(`/customers/${id}`)
    return response.data
  },
}

export default CustomerService
