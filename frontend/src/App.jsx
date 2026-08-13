import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Items from '@/pages/Items/Items'
import ItemsView from '@/pages/ItemsView/ItemsView'
import Customers from '@/pages/Customers/Customers'
import Orders from '@/pages/Orders/Orders'
import ServiceScheduling from '@/pages/ServiceScheduling/ServiceScheduling'
import CashReport from '@/pages/CashReport/CashReport'
import SalesReport from '@/pages/SalesReport/SalesReport'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rota protegida - Dashboard */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Dashboard />
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

          {/* Rota protegida - Customers (super_admin only) */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute requiredRoles={['super_admin']}>
                <Customers />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - Orders (recepcionista, super_admin) */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - Service Scheduling (recepcionista, super_admin) */}
          <Route
            path="/service-scheduling"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <ServiceScheduling />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - Cash Report (recepcionista, super_admin) */}
          <Route
            path="/cash-report"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <CashReport />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - Sales Report (recepcionista, super_admin) */}
          <Route
            path="/sales-report"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <SalesReport />
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
