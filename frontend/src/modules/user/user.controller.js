// User Controller - Lógica de autenticação e gerenciamento de usuários
import UserService from '../user/user.service.js'
import { validateCreateUser, validateLogin } from '../user/user.dto.js'

export class UserController {
  constructor() {
    this.currentUser = null
    this.users = []
    this.loading = false
    this.error = null
    this.observers = []
  }

  // Observer pattern para atualizar componentes quando dados mudam
  subscribe(callback) {
    this.observers.push(callback)
  }

  notify() {
    this.observers.forEach(callback => callback())
  }

  // Login
  async login(email, password) {
    this.loading = true
    this.error = null

    try {
      const validation = validateLogin({ email, password })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const result = await UserService.login(email, password)
      this.currentUser = result.user
      
      // Salvar tokens
      UserService.apiService?.tokenManager?.setTokens(result.accessToken, result.refreshToken)

      this.notify()
      return result
    } catch (error) {
      this.error = error.message || 'Erro ao fazer login'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Logout
  async logout() {
    this.loading = true
    this.error = null

    try {
      await UserService.logout()
      this.currentUser = null
      this.notify()
    } catch (error) {
      this.error = error.message || 'Erro ao fazer logout'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Criar usuário
  async create(name, email, password, roles = ['recepcionista']) {
    this.loading = true
    this.error = null

    try {
      const validation = validateCreateUser({ name, email, password })
      if (!validation.isValid) {
        throw { message: 'Validação falhou', errors: validation.errors }
      }

      const user = await UserService.create(name, email, password, roles)
      this.users.push(user)
      this.notify()
      return user
    } catch (error) {
      this.error = error.message || 'Erro ao criar usuário'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Obter todos os usuários
  async getAll() {
    this.loading = true
    this.error = null

    try {
      this.users = await UserService.getAll()
      this.notify()
      return this.users
    } catch (error) {
      this.error = error.message || 'Erro ao listar usuários'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Obter usuário por ID
  async getById(id) {
    this.loading = true
    this.error = null

    try {
      return await UserService.getById(id)
    } catch (error) {
      this.error = error.message || 'Erro ao buscar usuário'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Atualizar usuário
  async update(id, name, email) {
    this.loading = true
    this.error = null

    try {
      const updated = await UserService.update(id, name, email)
      
      // Atualizar currentUser se for o mesmo
      if (this.currentUser?.id === id) {
        this.currentUser = updated
      }

      // Atualizar na lista
      const index = this.users.findIndex(u => u.id === id)
      if (index !== -1) {
        this.users[index] = updated
      }

      this.notify()
      return updated
    } catch (error) {
      this.error = error.message || 'Erro ao atualizar usuário'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Deletar usuário
  async delete(id) {
    this.loading = true
    this.error = null

    try {
      await UserService.delete(id)
      this.users = this.users.filter(u => u.id !== id)
      this.notify()
    } catch (error) {
      this.error = error.message || 'Erro ao deletar usuário'
      this.notify()
      throw error
    } finally {
      this.loading = false
    }
  }

  // Verificar se usuário está logado
  isLoggedIn() {
    return this.currentUser !== null
  }

  // Verificar se usuário tem role específico
  hasRole(role) {
    return this.currentUser?.roles?.includes(role) || false
  }

  // Limpar erro
  clearError() {
    this.error = null
    this.notify()
  }
}

export default new UserController()
