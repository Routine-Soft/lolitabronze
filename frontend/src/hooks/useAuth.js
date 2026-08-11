import { useEffect, useState } from 'react'
import { UserController } from '@/modules/user'

// Hook para gerenciar autenticação
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carregar dados salvos localmente ao montar
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        const accessToken = localStorage.getItem('accessToken')

        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setIsAuthenticated(true)
          UserController.currentUser = userData
        }
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error)
        localStorage.removeItem('currentUser')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
      }
    }

    loadStoredUser()
  }, [])

  // Subscrever a mudanças no UserController
  useEffect(() => {
    const handleUserChange = () => {
      if (UserController.isLoggedIn()) {
        setUser(UserController.currentUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    }

    UserController.subscribe(handleUserChange)

    return () => {
      // Cleanup se necessário
    }
  }, [])

  const logout = async () => {
    try {
      await UserController.logout()
      localStorage.removeItem('currentUser')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpar dados locais
      localStorage.removeItem('currentUser')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const hasRole = (role) => {
    return user?.roles?.includes(role) || false
  }

  return {
    isAuthenticated,
    user,
    loading,
    logout,
    hasRole,
  }
}

export default useAuth

