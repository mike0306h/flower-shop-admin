import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../services/api'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/', label: 'dashboard', icon: '📊' },
  { path: '/products', label: 'products', icon: '🌸' },
  { path: '/categories', label: 'categories', icon: '📂' },
  { path: '/orders', label: 'orders', icon: '📦' },
  { path: '/coupons', label: 'coupons', icon: '🎫' },
  { path: '/reports', label: 'reports', icon: '📈' },
  { path: '/staff', label: 'staff', icon: '👥', roles: ['super_admin'] },
  { path: '/settings', label: 'settings', icon: '⚙️' },
]

export default function Sidebar({ onNavigate }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const location = useLocation()
  const [shopInfo, setShopInfo] = useState({ shop_name: '花店后台', logo_url: '' })

  useEffect(() => {
    api.get('/shop-info').then(res => {
      setShopInfo({ shop_name: res.shop_name || '花店后台', logo_url: res.logo_url || '' })
    }).catch(() => {})
  }, [])

  const handleNavClick = () => {
    if (onNavigate) onNavigate()
  }

  const filteredItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role)
  })

  return (
    <div className='w-64 bg-slate-800 text-white flex flex-col min-h-screen'>
      {/* Logo */}
      <div className='p-4 border-b border-slate-700'>
        <Link to='/' className='flex items-center gap-2' onClick={handleNavClick}>
          {shopInfo.logo_url ? (
            <img
              src={shopInfo.logo_url.startsWith('http') ? shopInfo.logo_url : '/api' + shopInfo.logo_url}
              alt='logo'
              className='w-8 h-8 object-contain'
            />
          ) : (
            <span className='text-2xl'>🌸</span>
          )}
          <div>
            <h1 className='font-bold'>{shopInfo.shop_name}</h1>
            <p className='text-xs text-slate-400'>Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className='flex-1 py-4'>
        {filteredItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{t(item.label)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-slate-700'>
        <div className='text-xs text-slate-400'>
          <p>🌸 Flower Shop</p>
          <p>Admin v1.0</p>
        </div>
      </div>
    </div>
  )
}
