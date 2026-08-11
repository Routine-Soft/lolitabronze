import React from 'react'
import { useAuthContext } from '@/hooks/useAuthContext'
import './Sidebar.css'

export function Sidebar({ isOpen, onClose }) {
  const { hasRole } = useAuthContext()

  // Itens de menu baseados em roles
  const menuItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      path: '/home',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Clientes',
      icon: '👥',
      path: '/customers',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Produtos e Serviços',
      icon: '🛍️',
      path: '/items',
      roles: ['super_admin'],
    },
    {
      label: 'Ver Produtos/Serviços',
      icon: '👀',
      path: '/items-view',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Pedidos',
      icon: '📋',
      path: '/orders',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Caixa',
      icon: '💰',
      path: '/cash',
      roles: ['recepcionista', 'super_admin'],
    },
    {
      label: 'Gerenciar Usuários',
      icon: '🔐',
      path: '/users',
      roles: ['super_admin'],
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
          <h2 className="sidebar-logo">LB</h2>
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
          <div className="sidebar-footer-text">
            <small>v1.0.0</small>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

