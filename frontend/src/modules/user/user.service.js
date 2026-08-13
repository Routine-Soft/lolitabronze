// User Service - Chamadas à API de usuários
import apiService from '../../services/api.js'
import {
  createUserDTO,
  loginUserDTO,
  updateUserDTO,
  updatePasswordDTO,
  userResponseDTO,
} from './user.dto.js'

export const UserService = {
  // Login - Público
  async login(email, password) {
    const dto = loginUserDTO({ email, password })
    const response = await apiService.post('/users/login', dto)
    // Formatar usuário com DTO para incluir ID
    return {
      user: userResponseDTO(response.data.user),
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    }
  },

  // Criar usuário - Público
  async create(name, email, password, roles = ['recepcionista']) {
    const dto = createUserDTO({ name, email, password, roles })
    const response = await apiService.post('/users', dto)
    return userResponseDTO(response.data)
  },

  // Listar todos os usuários - Protegido (super_admin)
  async getAll() {
    const response = await apiService.get('/users')
    return (response.data || []).map(user => userResponseDTO(user))
  },

  // Buscar usuário por ID - Protegido
  async getById(id) {
    const response = await apiService.get(`/users/${id}`)
    return userResponseDTO(response.data)
  },

  // Atualizar usuário - Protegido
  async update(id, name, email) {
    const dto = updateUserDTO({ name, email })
    const response = await apiService.patch(`/users/${id}`, dto)
    return userResponseDTO(response.data)
  },

  // Atualizar senha - Protegido
  async updatePassword(id, currentPassword, newPassword) {
    const dto = updatePasswordDTO({ currentPassword, newPassword })
    const response = await apiService.post(`/users/${id}/password`, dto)
    return response.data
  },

  // Deletar usuário - Protegido (super_admin)
  async delete(id) {
    const response = await apiService.delete(`/users/${id}`)
    return response.data
  },

  // Logout - Protegido
  async logout() {
    try {
      const response = await apiService.post('/users/logout', {})
      return response.data
    } finally {
      apiService.tokenManager.clearTokens()
    }
  },

  // Renovar token - Público
  async refreshToken(refreshToken) {
    const response = await apiService.post('/users/refresh', { refreshToken })
    return response.data
  },
}

export default UserService
