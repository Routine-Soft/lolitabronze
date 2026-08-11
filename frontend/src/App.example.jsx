// Exemplo de configuração do App.jsx com React Router e Auth

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Pages
import Login from '@/pages/Login/Login'
// import Home from '@/pages/Home/Home'
// import Customers from '@/pages/Customers/Customers'
// import Items from '@/pages/Items/Items'
// import Cash from '@/pages/Cash/Cash'
// import Orders from '@/pages/Orders/Orders'

// CSS Global
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          {/* <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          /> */}

          {/* Rotas que requerem super_admin */}
          {/* <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={['super_admin']}>
                <Users />
              </ProtectedRoute>
            }
          /> */}

          {/* Redirecionar raiz para home ou login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
