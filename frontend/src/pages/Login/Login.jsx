import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserController, validateLogin } from '@/modules/user'

import './Login.css'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  // Se já estiver logado, redirecionar para home
  useEffect(() => {
    if (UserController.isLoggedIn()) {
      navigate('/home')
    }
  }, [navigate])

  // Subscrever a mudanças no controller
  useEffect(() => {
    const handleControllerChange = () => {
      setLoading(UserController.loading)
      if (UserController.error) {
        setGeneralError(UserController.error)
      }
    }

    UserController.subscribe(handleControllerChange)

    return () => {
      // Cleanup se precisar desinscrever (não é necessário aqui, mas boa prática)
    }
  }, [])

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setEmail(value)
    } else if (field === 'password') {
      setPassword(value)
    }
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setErrors({})

    // Validar
    const validation = validateLogin({ email, password })
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      setLoading(true)
      UserController.clearError()

      // Chamar login
      const result = await UserController.login(email, password)

      // Salvar dados localmente no localStorage/Electron
      saveUserLocally(result.user, result.accessToken, result.refreshToken)

      // Redirecionar para home
      navigate('/home')
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      setGeneralError(error.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <img src="/src/assets/lolita.png" alt="" style={{ width: '130px', height: 'auto' }} />
          <p className="login-subtitle">Sistema de Gerenciamento</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Error Message */}
          {generalError && (
            <div className="login-error">
              <p>{generalError}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            © 2026 Lolita Bronze. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="login-bg-decoration"></div>
    </div>
  )
}

// Função para salvar dados do usuário localmente
// Em Electron, localStorage funciona normalmente no renderer process
function saveUserLocally(user, accessToken, refreshToken) {
  try {
    // Salvar tokens
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)

    // Salvar dados do usuário
    localStorage.setItem('currentUser', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      createdAt: user.createdAt,
    }))

    console.log('✅ Dados salvos localmente com sucesso')
  } catch (error) {
    console.error('❌ Erro ao salvar dados localmente:', error)
    // Em Electron, se localStorage falhar, pode ser necessário usar electron-store
    // Por enquanto, apenas log o erro
  }
}

export default Login
