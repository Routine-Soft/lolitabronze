import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuthContext'

// Componente para proteger rotas que requerem autenticação
export function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuthContext()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Se requer roles específicas, verificar
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user?.roles?.includes(role))
    if (!hasRequiredRole) {
      return <Navigate to="/home" replace />
    }
  }

  return children
}

export default ProtectedRoute
