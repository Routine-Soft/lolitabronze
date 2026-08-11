# Login e Autenticação - Lolita Bronze Frontend

## 🎯 O que foi implementado

- ✅ Tela de Login com design profissional
- ✅ Integração com UserController
- ✅ Validação de dados
- ✅ Persistência de tokens e dados do usuário
- ✅ Hooks para autenticação (useAuth)
- ✅ Context para compartilhar dados (AuthProvider)
- ✅ Componente de rota protegida
- ✅ Redirecionamento automático

## 📁 Arquivos Criados/Modificados

### Tela de Login
- `src/pages/Login/Login.jsx` - Componente de login
- `src/pages/Login/Login.css` - Estilos com paleta oficial

### Hooks
- `src/hooks/useAuth.js` - Hook para gerenciar autenticação
- `src/hooks/useApi.js` - Hook para fazer requisições à API

### Context
- `src/context/AuthContext.jsx` - Context para compartilhar dados de autenticação

### Componentes
- `src/components/ProtectedRoute.jsx` - Componente para proteger rotas

### Exemplos
- `src/App.example.jsx` - Exemplo de configuração do App.jsx

## 🚀 Como Usar

### 1. Configurar App.jsx

Veja o arquivo `src/App.example.jsx` como referência e configure seu `src/App.jsx` com:

```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login/Login'
import Home from '@/pages/Home/Home'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
```

### 2. Usar em Componentes

```javascript
import { useAuthContext } from '@/context/AuthContext'

export function MyComponent() {
  const { isAuthenticated, user, logout, hasRole } = useAuthContext()

  if (!isAuthenticated) {
    return <div>Não autenticado</div>
  }

  return (
    <div>
      <h1>Olá, {user.name}!</h1>
      {hasRole('super_admin') && <AdminMenu />}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### 3. Proteger Rotas

```javascript
// Rota básica (qualquer usuário logado)
<Route
  path="/customers"
  element={
    <ProtectedRoute>
      <Customers />
    </ProtectedRoute>
  }
/>

// Rota com restrição de role
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={['super_admin']}>
      <Admin />
    </ProtectedRoute>
  }
/>

// Múltiplos roles (OR)
<Route
  path="/dashboard"
  element={
    <ProtectedRoute requiredRoles={['super_admin', 'recepcionista']}>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## 🔐 Fluxo de Autenticação

```
1. Usuário acessa /login
   ↓
2. Digita email e senha
   ↓
3. Clica em "Entrar"
   ↓
4. UserController.login() é chamado
   ↓
5. API retorna: { accessToken, refreshToken, user }
   ↓
6. Tokens e dados são salvos em localStorage
   ↓
7. Redireciona para /home
   ↓
8. useAuth hook carrega os dados salvos automaticamente
   ↓
9. ProtectedRoute verifica se está autenticado
   ↓
10. Home é renderizada com os dados do usuário
```

## 💾 Dados Salvos Localmente

Após login bem-sucedido, são salvos em localStorage:

```javascript
// Token de acesso (24h)
localStorage.accessToken = "eyJhbGc..."

// Token de renovação (7 dias)
localStorage.refreshToken = "eyJhbGc..."

// Dados do usuário
localStorage.currentUser = JSON.stringify({
  id: "507f1f77bcf86cd799439011",
  name: "João Silva",
  email: "joao@example.com",
  roles: ["recepcionista", "super_admin"],
  createdAt: "2026-08-10T12:00:00Z"
})
```

## 🔄 Refresh Automático

O API Service (`src/services/api.js`) gerencia automaticamente:

- ✅ Detecta quando token expirou (status 401)
- ✅ Usa refreshToken para obter novo accessToken
- ✅ Retenta a requisição original com novo token
- ✅ Se falhar, redireciona para login

## 🛡️ Segurança

- Tokens armazenados em localStorage (acessível apenas em Electron renderer)
- Senha nunca é salva localmente
- Validação no cliente antes de enviar
- Validação no servidor via JWT
- Logout limpa todos os dados

## 📱 Em Electron (Windows)

No Electron, localStorage funciona normalmente no renderer process:

- Dados salvos em: `%APPDATA%/Electron` (variável conforme perfil do usuário)
- Persiste entre sessões
- Sincroniza com os tokens do API Service

## 🎨 Design

A tela de login usa:
- **Cores:** Paleta roxo e dourado oficial
- **Animations:** Slide-up ao carregar
- **Responsividade:** Mobile, tablet, desktop
- **Acessibilidade:** Focus states, ARIA labels

## ⚙️ Configuração

### .env

Criar arquivo `src/.env` com:

```
VITE_API_URL=http://localhost:8080/api
```

### package.json

Verificar se tem as dependências:

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x"
  }
}
```

## 🐛 Troubleshooting

### "useAuthContext deve ser usado dentro de AuthProvider"
- Certifique-se que AuthProvider está envolvendo seus componentes no App.jsx

### Tokens não estão sendo salvos
- Verificar console para erros
- Tentar limpar localStorage manualmente
- Verificar se está no contexto de Electron/Browser

### Redireciona para login mesmo estando logado
- useAuth() não carregou dados locais ainda
- Usar `loading` state do useAuthContext
- Aguardar até que `loading` seja false

### localStorage não funciona
- Em Electron, usar electron-store como alternativa
- Implementar em: `src/services/storage.js`

## 📚 Próximos Passos

1. Criar página `/home` (Home.jsx)
2. Criar Sidebar com opções por role
3. Criar páginas para cada módulo
4. Implementar logout na Navbar
5. Testes de autenticação

---

**Última atualização:** 2026-08-10
