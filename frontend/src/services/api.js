// API Service Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Helper para gerenciar tokens
class TokenManager {
  getAccessToken() {
    return localStorage.getItem('accessToken')
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken')
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  isTokenExpired(token) {
    if (!token) return true
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
}

const tokenManager = new TokenManager()

// Interceptor para adicionar token nos headers
async function makeRequest(url, options = {}) {
  const headers = {
    ...options.headers,
  }

  // Adiciona Content-Type apenas se houver body
  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  // Adiciona token de autenticação se existir
  const accessToken = tokenManager.getAccessToken()
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    })

    // Se token expirou, tenta renovar
    if (response.status === 401) {
      const refreshToken = tokenManager.getRefreshToken()
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/users/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })

          if (refreshResponse.ok) {
            const data = await refreshResponse.json()
            tokenManager.setTokens(data.data.accessToken, refreshToken)

            // Retenta requisição original com novo token
            headers['Authorization'] = `Bearer ${data.data.accessToken}`
            return fetch(`${API_BASE_URL}${url}`, {
              ...options,
              headers,
            })
          } else {
            // Refresh token inválido, faz logout
            tokenManager.clearTokens()
            window.location.href = '/login'
          }
        } catch (error) {
          console.error('Erro ao renovar token:', error)
          tokenManager.clearTokens()
          window.location.href = '/login'
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP Error: ${response.status}`,
      }))
      throw {
        status: response.status,
        message: errorData.message || 'Erro na requisição',
        data: errorData,
      }
    }

    // Status 204 (No Content) não tem body JSON
    if (response.status === 204) {
      return {}
    }

    return response.json()
  } catch (error) {
    console.error('Erro na requisição:', error)
    throw error
  }
}

export const apiService = {
  // Método genérico para GET
  get: (url) => makeRequest(url, { method: 'GET' }),

  // Método genérico para POST
  post: (url, body) =>
    makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Método genérico para PATCH
  patch: (url, body) =>
    makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  // Método genérico para PUT
  put: (url, body) =>
    makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // Método genérico para DELETE
  delete: (url) => makeRequest(url, { method: 'DELETE' }),

  tokenManager,
}

export default apiService
