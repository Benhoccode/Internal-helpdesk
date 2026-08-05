import { Bell, HelpCircle, LogOut, Menu, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { navigationItems } from '../../data/navigation'
import { useAuth } from '../../hooks/use-auth'
import { getInitials } from '../../utils/format'

interface AppShellProps {
  readonly appName?: string
}

export function AppShell({ appName = 'Helpdesk Pro' }: Readonly<AppShellProps>) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <span className="brand__mark">HP</span>
          <span>
            <strong>{appName}</strong>
            <small>Hỗ trợ nội bộ</small>
          </span>
          <button
            className="icon-button sidebar__close"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <button className="primary-button sidebar__cta" onClick={() => navigate('/tickets/new')}>
          <Plus size={18} /> Yêu cầu mới
        </button>

        <nav className="sidebar__nav" aria-label="Điều hướng chính">
          {navigationItems
            .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
        </nav>

        <button className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={20} /> Đăng xuất
        </button>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            aria-label="Mở menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          <strong className="topbar__title">Hỗ trợ nội bộ</strong>
          <div className="topbar__search" aria-hidden="true">
            Tìm kiếm yêu cầu, bài viết...
          </div>
          <div className="topbar__actions">
            <button className="icon-button" aria-label="Thông báo" disabled>
              <Bell size={21} />
            </button>
            <button className="icon-button" aria-label="Trợ giúp" disabled>
              <HelpCircle size={21} />
            </button>
            <div className="user-chip">
              <span className="avatar">{getInitials(user?.fullName ?? 'User')}</span>
              <span>
                <strong>{user?.fullName}</strong>
                <small>{user?.role === 'ADMIN' ? 'Quản trị hỗ trợ' : 'Nhân viên'}</small>
              </span>
            </div>
          </div>
        </header>
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
