import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login/Login'
import Home from '@/pages/Home/Home'
import Items from '@/pages/Items/Items'
import ItemsView from '@/pages/ItemsView/ItemsView'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rota protegida - Home */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - Items (super_admin only) */}
          <Route
            path="/items"
            element={
              <ProtectedRoute requiredRoles={['super_admin']}>
                <Items />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - ItemsView (visualizar itens) */}
          <Route
            path="/items-view"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <ItemsView />
              </ProtectedRoute>
            }
          />

          {/* Redirecionar raiz para login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 - redirecionar para login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
