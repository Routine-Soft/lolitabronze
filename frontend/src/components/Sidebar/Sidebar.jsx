import { useAuthContext } from '@/hooks/useAuthContext'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'
import lolitaLogo from '../../assets/lolita.png';

export function Sidebar({ isOpen, onClose }) {
  const { hasRole, user, logout } = useAuthContext()

  const handleLogout = async () => {
    await logout()
  }

  const menuItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      path: '/home-recepcionista',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Caixa ADM',
      icon: '👥',
      path: '/cash-adm',
      roles: ['super_admin'],
    },
    {
      label: 'Serviços ADM',
      icon: '🛍️',
      path: '/servico-adm',
      roles: ['super_admin'],
    },
    {
      label: 'Produtos ADM',
      icon: '🛍️',
      path: '/produto-adm',
      roles: ['super_admin'],
    },
    {
      label: 'Relatório ADM',
      icon: '📊',
      path: '/relatorio-adm',
      roles: ['super_admin'],
    },
    {
      label: 'Relatório de Vendas ADM',
      icon: '📊',
      path: '/relatorio-vendas-adm',
      roles: ['super_admin'],
    },
    {
      label: 'Comanda ADM',
      icon: '📝',
      path: '/comanda-adm',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Impressora',
      icon: '🖨️',
      path: '/print',
      roles: ['recepcionista', 'super_admin'],
    }
  ]

  const availableItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  )

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

        <div className="sidebar-header">

          <img
            src={lolitaLogo}
            alt="Lolita Bronze"
            style={{
              width: '130px',
              height: 'auto'
            }}
          />

          <button
            className="sidebar-close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <nav className="sidebar-nav">

          {availableItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
              onClick={handleItemClick}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span className="sidebar-label">
                {item.label}
              </span>
            </NavLink>
          ))}

        </nav>

        <div className="sidebar-footer">

          <div className="sidebar-user-section">

            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="sidebar-user-info">

              <div className="sidebar-user-name">
                {user?.name}
              </div>

              <div className="sidebar-user-email">
                {user?.email}
              </div>

              <div className="sidebar-user-roles">
                {user?.roles?.join(', ')}
              </div>

            </div>

          </div>

          <hr className="sidebar-footer-divider" />

          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
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