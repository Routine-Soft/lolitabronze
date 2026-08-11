import MainLayout from '@/layouts/MainLayout'
import './Home.css'

export function Home() {
  return (
    <MainLayout>
      <div className="home-container">
        <div className="home-header">
          <h1>Dashboard</h1>
          <p>Bem-vindo ao Lolita Bronze!</p>
        </div>

        <div className="home-grid">
          <div className="home-card">
            <div className="card-icon">📊</div>
            <h3>Vendas</h3>
            <p className="card-value">0</p>
            <small>Pedidos este mês</small>
          </div>

          <div className="home-card">
            <div className="card-icon">💰</div>
            <h3>Faturamento</h3>
            <p className="card-value">R$ 0,00</p>
            <small>Total este mês</small>
          </div>

          <div className="home-card">
            <div className="card-icon">👥</div>
            <h3>Clientes</h3>
            <p className="card-value">0</p>
            <small>Clientes cadastrados</small>
          </div>

          <div className="home-card">
            <div className="card-icon">🛍️</div>
            <h3>Produtos</h3>
            <p className="card-value">0</p>
            <small>Produtos disponíveis</small>
          </div>
        </div>

        <div className="home-info">
          <p>🚀 Mais funcionalidades em breve...</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default Home

