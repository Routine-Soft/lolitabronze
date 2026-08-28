import OrderADM from './features/order/components/orderADM';
import CustomerADM from './features/customer/components/customerADM';
import User from './features/user/components/User';
import ServicoADM from './features/servico/components/servicoADM';
import ProdutoADM from './features/produto/components/produtoADM';
import CashADM from './features/cash/components/cashADM';
import Print from './features/print/components/print';
import RelatorioADM from './features/relatorio/components/relatorioADM';
import RelatorioRecepcionista from './features/relatorio/components/relatorioRecepcionista';
import RelatorioVendasADM from './features/relatorio/components/relatorioVendasADM';
import CashRecepcionista from './features/cash/components/cashRecepcionista';
import Home from './pages/Home/Home';

import MainLayout from '@/layouts/MainLayout'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login/Login'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          <Route path="/user-login" element={<User />} />

          {/* Rota protegida - Dashboard */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/order-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <OrderADM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/cash-recepcionista"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <CashRecepcionista />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/relatorio-recepcionista"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <RelatorioRecepcionista />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/customers-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <CustomerADM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/servico-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <ServicoADM />
                </MainLayout>

              </ProtectedRoute>
            }
          />

          <Route 
            path="/produto-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <ProdutoADM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/cash-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <CashADM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/print"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <Print />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/relatorio-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <RelatorioADM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/relatorio-vendas-adm"
            element={
              <ProtectedRoute requiredRoles={['recepcionista', 'super_admin']}>
                <MainLayout>
                  <RelatorioVendasADM />
                </MainLayout>
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
