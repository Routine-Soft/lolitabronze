// Item Controller - Lógica de gerenciamento de itens
import ItemService from '../item/item.service.js'
import { validateItem, ITEM_TYPE } from '../item/item.dto.js'

export class ItemController {
  constructor() {
    this.items = []
    this.products = []
    this.services = []
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

  // Criar item
  async create(name, description, type, price, quantity, discount) {
    this.loading = true
    this.error = null

    try {
      const validation = validateItem({ name, description, type, price, quantity })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const item = await ItemService.create(name, description, type, price, quantity, discount)
      this.items.push(item)

      // Atualizar listas específicas
      if (type === ITEM_TYPE.PRODUCT) {
        this.products.push(item)
      } else if (type === ITEM_TYPE.SERVICE) {
        this.services.push(item)
      }

      this.notify()
      return item
    } catch (error) {
      this.error = error.message || 'Erro ao criar item'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Listar todos os itens
  async list() {
    this.loading = true
    this.error = null

    try {
      this.items = await ItemService.list()
      this.products = this.items.filter(i => i.type === ITEM_TYPE.PRODUCT)
      this.services = this.items.filter(i => i.type === ITEM_TYPE.SERVICE)
      this.notify()
      return this.items
    } catch (error) {
      this.error = error.message || 'Erro ao listar itens'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Listar apenas produtos
  async listProducts() {
    this.loading = true
    this.error = null

    try {
      this.products = await ItemService.listProducts()
      this.notify()
      return this.products
    } catch (error) {
      this.error = error.message || 'Erro ao listar produtos'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Listar apenas serviços
  async listServices() {
    this.loading = true
    this.error = null

    try {
      this.services = await ItemService.listServices()
      this.notify()
      return this.services
    } catch (error) {
      this.error = error.message || 'Erro ao listar serviços'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Buscar item por ID
  async getById(id) {
    this.loading = true
    this.error = null

    try {
      return await ItemService.getById(id)
    } catch (error) {
      this.error = error.message || 'Erro ao buscar item'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Atualizar item
  async update(id, name, description, type, price, quantity, discount) {
    this.loading = true
    this.error = null

    try {
      const validation = validateItem({ name, description, type, price, quantity })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const updated = await ItemService.update(id, name, description, type, price, quantity, discount)

      // Atualizar em todas as listas
      const generalIndex = this.items.findIndex(i => i.id === id)
      if (generalIndex !== -1) {
        this.items[generalIndex] = updated
      }

      const productIndex = this.products.findIndex(i => i.id === id)
      if (productIndex !== -1) {
        this.products[productIndex] = updated
      }

      const serviceIndex = this.services.findIndex(i => i.id === id)
      if (serviceIndex !== -1) {
        this.services[serviceIndex] = updated
      }

      this.notify()
      return updated
    } catch (error) {
      this.error = error.message || 'Erro ao atualizar item'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Deletar item
  async delete(id) {
    this.loading = true
    this.error = null

    try {
      await ItemService.delete(id)
      this.items = this.items.filter(i => i.id !== id)
      this.products = this.products.filter(i => i.id !== id)
      this.services = this.services.filter(i => i.id !== id)
      this.notify()
    } catch (error) {
      this.error = error.message || 'Erro ao deletar item'
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

export default new ItemController()
