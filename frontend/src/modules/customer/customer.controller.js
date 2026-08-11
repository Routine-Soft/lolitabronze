// Customer Controller - Lógica de gerenciamento de clientes
import CustomerService from '../customer/customer.service.js'
import { validateCustomer } from '../customer/customer.dto.js'

export class CustomerController {
  constructor() {
    this.customers = []
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

  // Criar cliente
  async create(name, phone) {
    this.loading = true
    this.error = null

    try {
      const validation = validateCustomer({ name, phone })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const customer = await CustomerService.create(name, phone)
      this.customers.push(customer)
      this.notify()
      return customer
    } catch (error) {
      this.error = error.message || 'Erro ao criar cliente'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Listar clientes
  async list(search = '') {
    this.loading = true
    this.error = null

    try {
      this.customers = await CustomerService.list(search)
      this.notify()
      return this.customers
    } catch (error) {
      this.error = error.message || 'Erro ao listar clientes'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Buscar cliente por ID
  async getById(id) {
    this.loading = true
    this.error = null

    try {
      return await CustomerService.getById(id)
    } catch (error) {
      this.error = error.message || 'Erro ao buscar cliente'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Atualizar cliente
  async update(id, name, phone) {
    this.loading = true
    this.error = null

    try {
      const validation = validateCustomer({ name, phone })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const updated = await CustomerService.update(id, name, phone)
      const index = this.customers.findIndex(c => c.id === id)
      if (index !== -1) {
        this.customers[index] = updated
      }
      this.notify()
      return updated
    } catch (error) {
      this.error = error.message || 'Erro ao atualizar cliente'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Deletar cliente
  async delete(id) {
    this.loading = true
    this.error = null

    try {
      await CustomerService.delete(id)
      this.customers = this.customers.filter(c => c.id !== id)
      this.notify()
    } catch (error) {
      this.error = error.message || 'Erro ao deletar cliente'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  clearError() {
    this.error = null
    this.notify()
  }
}

export default new CustomerController()
