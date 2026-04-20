import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'

// ============ 菜单权限配置 ============
// 每个菜单项需要哪个权限才显示
// 格式: module:action 或者 role 白名单
const MENU_PERMISSIONS = {
  '/': 'dashboard:read',
  '/orders': 'orders:read',
  '/products': 'products:read',
  '/categories': 'categories:read',
  '/coupons': 'coupons:read',
  '/reviews': 'reviews:read',
  '/reports': 'reports:read',
  '/admin-logs': 'admin_logs:read',
  '/export': 'export:read',
  '/notifications': 'notifications:read',
  '/users': 'users:read',
  '/appointments': 'appointments:read',
  '/contacts': 'contacts:read',
  '/settings': 'settings:read',
  // 店员管理仅 super_admin 可见（特殊处理）
}

const ALL_MENU_ITEMS = [
  { path: '/', icon: '📊', key: 'dashboard', label: 'dashboard' },
  { path: '/orders', icon: '📦', key: 'orders', label: 'orders' },
  { path: '/products', icon: '💐', key: 'products', label: 'products' },
  { path: '/categories', icon: '🏷️', key: 'categories', label: 'categories' },
  { path: '/coupons', icon: '🎫', key: 'coupons', label: 'coupons' },
  { path: '/reviews', icon: '⭐', key: 'reviews', label: 'reviews' },
  { path: '/reports', icon: '📈', key: 'reports', label: 'reports' },
  { path: '/admin-logs', icon: '📋', key: 'admin_logs', label: 'admin_logs' },
  { path: '/export', icon: '📥', key: 'export', label: 'export' },
  { path: '/notifications', icon: '🔔', key: 'notifications', label: 'notifications' },
  { path: '/users', icon: '👥', key: 'users', label: 'users' },
  { path: '/appointments', icon: '📅', key: 'appointments', label: 'appointments' },
  { path: '/contacts', icon: '💬', key: 'contacts', label: 'contacts' },
  { path: '/settings', icon: '⚙️', key: 'settings', label: 'settings' },
  { path: '/staff-management', icon: '👤', key: 'staff_management', label: 'staff_management' },
]

export default function Sidebar({ onNavigate }) {
  const { t } = useI18n()
  const { user, logout, hasPermission } = useAuth()
  const location = useLocation()

  // 根据权限过滤菜单
  const visibleMenus = ALL_MENU_ITEMS.filter(item => {
    // 店员管理只有 super_admin 能看到
    if (item.path === '/staff-management') {
      return user?.role === 'super_admin'
    }
    // 其他菜单按权限过滤
    const requiredPerm = MENU_PERMISSIONS[item.path]
    if (!requiredPerm) return true
    const [module, action] = requiredPerm.split(':')
    return hasPermission(module, action)
  })

  const handleNavClick = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <aside className="w-64 lg:w-64 bg-slate-800 text-white min-h-screen flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <span className="text-2xl">🌸</span>
          <div>
            <h1 className="font-bold">花店后台</h1>
            <p className="text-xs text-slate-400">Flower Shop Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleMenus.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              location.pathname === item.path
                ? 'bg-slate-700 border-r-4 border-blue-500'
                : 'hover:bg-slate-700/50'
            }`}
          >
            <span>{item.icon}</span>
            <span>{t(item.label)}</span>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-lg">
            {user?.name?.charAt(0) || user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-slate-400">
              {user?.role === 'super_admin' ? '超级管理员'
                : user?.role === 'admin' ? '管理员'
                : user?.role === 'staff' ? '店员'
                : user?.role === 'viewer' ? '查看者'
                : user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2 bg-slate-700 hover:bg-red-600 rounded transition-colors text-sm"
        >
          {t('logout')}
        </button>
      </div>
    </aside>
  )
}
