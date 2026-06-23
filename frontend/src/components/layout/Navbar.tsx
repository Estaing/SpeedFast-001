import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Car, LogOut, Menu, X, ChevronDown, User2, Shield } from 'lucide-react'
import { Logo } from './Logo'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import { toast } from '@/components/ui/Toast'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles',  label: 'My Fleet',  icon: Car },
]

export function Navbar() {
  const { user, refreshToken, logout } = useAuthStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      logout()
      toast.success('Signed out successfully')
      navigate('/login')
    }
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/dashboard" className={styles.logoLink}><Logo size="sm" /></Link>

        {/* Desktop links */}
        <div className={styles.links}>
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`${styles.link} ${pathname.startsWith(to) ? styles.active : ''}`}>
              <Icon size={16} aria-hidden />{label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className={styles.right}>
          <div className={styles.userMenu}>
            <button className={styles.userBtn} onClick={() => setUserMenu(p => !p)}>
              <div className={styles.avatar}>
                <User2 size={16} />
              </div>
              <span className={styles.email}>{user?.email}</span>
              <ChevronDown size={14} className={userMenu ? styles.rotated : ''} />
            </button>
            {userMenu && (
              <div className={styles.dropdown} role="menu">
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropEmail}>{user?.email}</span>
                  <Badge variant={user?.role === 'ADMIN' ? 'orange' : 'info'}>
                    {user?.role === 'ADMIN' && <Shield size={10} />}
                    {user?.role}
                  </Badge>
                </div>
                <hr className={styles.divider} />
                <button className={styles.dropItem} onClick={handleLogout} role="menuitem">
                  <LogOut size={15} />Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className={styles.burger} onClick={() => setOpen(p => !p)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={styles.mobile}>
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`${styles.mobileLink} ${pathname.startsWith(to) ? styles.active : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={18} />{label}
            </Link>
          ))}
          <hr className={styles.divider} />
          <button className={styles.mobileLink} style={{ color: 'var(--red)' }} onClick={handleLogout}>
            <LogOut size={18} />Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
