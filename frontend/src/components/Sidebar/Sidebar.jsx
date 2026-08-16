import { useAuthContext } from '@/hooks/useAuthContext'
import './Sidebar.css'

export function Sidebar({ isOpen, onClose, }) {
  const { hasRole, user, logout } = useAuthContext()

  const handleLogout = async () => {
    await logout()
  }

  // Itens de menu baseados em roles
  const menuItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      path: '/home',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Gestão de Clientes',
      icon: '👥',
      path: '/customers',
      roles: ['super_admin'],
    },
    {
      label: 'Gerenciar Produtos e Serviços',
      icon: '🛍️',
      path: '/items',
      roles: ['super_admin'],
    },
    {
      label: 'Lista de Produtos e Serviços',
      icon: '🛍️',
      path: '/items-view',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Venda de Produtos',
      icon: '🛍️',
      path: '/orders',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Agendamento de Serviços',
      icon: '🛍️',
      path: '/service-scheduling',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Relatório de Caixa',
      icon: '📊',
      path: '/cash-report',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Relatório de Vendas',
      icon: '📈',
      path: '/sales-report',
      roles: ['recepcionista', 'super_admin'],
    },
  ]

  // Filtrar itens por role
  const availableItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  )

  const handleItemClick = () => {
    // Fechar sidebar em mobile após clicar
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/src/assets/lolita.png" alt="" style={{ width: '130px', height: 'auto' }} />
          {/* <button className="sidebar-toggle" onClick={onToggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
              <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
            </svg>
          </button> */}
          <button className="sidebar-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {availableItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              className="sidebar-item"
              onClick={handleItemClick}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-section">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
              <div className="sidebar-user-roles">{user?.roles?.join(', ')}</div>
            </div>
          </div>
          <hr className="sidebar-footer-divider" />
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <div className="sidebar-footer-text">
            <small>v1.0.0</small>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

