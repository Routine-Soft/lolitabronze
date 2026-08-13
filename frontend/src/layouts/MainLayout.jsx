import React, { useState } from 'react'
import Sidebar from '@/components/Sidebar/Sidebar'
import './MainLayout.css'

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="layout">
      <div className="layout-container">
        <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} onToggleSidebar={handleToggleSidebar} />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout

