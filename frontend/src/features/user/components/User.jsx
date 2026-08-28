import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../user.hooks";
import "./User.css";

export default function User() {
  const { loading, error, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // se já está logado, pula direto pra home
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/home');
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
    }
  }

return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <h2>Login</h2>
          <p className="login-subtitle">Entre com suas credenciais para acessar</p>
        </header>

        {error && <p className="login-alert-error">{error.message}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label className="login-label">E-mail</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Senha</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn-primary" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}