import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useI18n } from '../context/I18nContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Layout() {
  const { lang, changeLanguage, t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shopInfo, setShopInfo] = useState({ shop_name: '', logo_url: '' })

  const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ]

  useEffect(() => {
    api.get('/shop-info').then(res => {
      setShopInfo({ shop_name: res.shop_name || '', logo_url: res.logo_url || '' })
    }).catch(() => {})
  }, [])

  const sidebarClass = sidebarOpen
    ? 'translate-x-0'
    : '-translate-x-full lg:translate-x-0 lg:block'

  const btnClass = (code) => {
    const base = 'px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm flex items-center gap-1 transition-all whitespace-nowrap '
    return base + (lang === code ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
  }

  return (
    <div className='flex min-h-screen'>
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={'fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ' + sidebarClass}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      <main className='flex-1 flex flex-col min-w-0'>
        <header className='bg-white border-b border-slate-200 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100'
            >
              <svg className='w-6 h-6 text-slate-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
            <h2 className='text-lg lg:text-xl font-semibold text-slate-800 truncate flex items-center gap-2'>
              {shopInfo.logo_url ? (
                <img
                  src={shopInfo.logo_url.startsWith('http') ? shopInfo.logo_url : '/api' + shopInfo.logo_url}
                  alt=''
                  className='w-6 h-6 object-contain'
                />
              ) : '🌸'}
              <span className='truncate'>{shopInfo.shop_name || t('dashboard')}</span>
            </h2>
          </div>
          <div className='flex items-center gap-1 sm:gap-2'>
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={btnClass(l.code)}
              >
                <span>{l.flag}</span>
                <span className='hidden sm:inline'>{l.name}</span>
              </button>
            ))}
          </div>
        </header>
        <div className='flex-1 p-4 lg:p-6 overflow-auto'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
