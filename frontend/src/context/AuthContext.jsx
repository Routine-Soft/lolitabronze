import { createContext } from 'react'
import useAuth from '@/hooks/useAuth'

// Criar context
const AuthContext = createContext(null)

// Provider component
export function AuthProvider({ children }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

