import React, { useState } from 'react'
import { useAuthContext } from '@/hooks/useAuthContext'
import './Navbar.css'

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuthContext()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
            <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
          </svg>
        </button>
        <h1 className="navbar-title">LOLITA BRONZE</h1>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <span className="navbar-user-name">{user?.name}</span>
          <div className="navbar-dropdown-container">
            <button
              className="navbar-dropdown-toggle"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="navbar-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>

            {showDropdown && (
              <div className="navbar-dropdown">
                <div className="navbar-dropdown-item">
                  <span>{user?.email}</span>
                </div>
                <div className="navbar-dropdown-item">
                  <small>{user?.roles?.join(', ')}</small>
                </div>
                <hr className="navbar-dropdown-divider" />
                <button
                  className="navbar-dropdown-item logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

