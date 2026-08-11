import { useContext } from 'react'
import AuthContext from '@/context/AuthContext'

// Hook para usar o context de autenticação
export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider')
  }
  return context
}

export default useAuthContext
