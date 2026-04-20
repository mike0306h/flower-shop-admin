import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useI18n } from '../context/I18nContext'
import { useState } from 'react'

export default function Layout() {
  const { lang, changeLanguage, t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop: w-64, mobile: fixed drawer */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:block'}
      `}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between gap-4">
          {/* Mobile: hamburger + logo, Desktop: just logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo/Title */}
            <h2 className="text-lg lg:text-xl font-semibold text-slate-800 truncate">
              🌸 {t('dashboard')}
            </h2>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 sm:gap-2">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm flex items-center gap-1 transition-all whitespace-nowrap ${
                  lang === l.code
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{l.flag}</span>
                <span className="hidden sm:inline">{l.name}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
