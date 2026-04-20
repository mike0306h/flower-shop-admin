import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../context/I18nContext'
import { getStats, getSalesChart, getLowStockAlerts } from '../services/api'

export default function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [lowStock, setLowStock] = useState({ low_stock: [], out_of_stock: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, chartRes, lowStockRes] = await Promise.all([
        getStats(),
        getSalesChart(7),
        getLowStockAlerts()
      ])
      setStats(statsRes)
      setChartData(chartRes)
      setLowStock(lowStockRes)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{t('loading')}</div>
      </div>
    )
  }

  const statCards = [
    { label: 'today_orders', value: stats?.todayOrders || 0, icon: '📦', color: 'bg-blue-500', link: '/orders' },
    { label: 'today_sales', value: `฿${(stats?.todaySales || 0).toLocaleString()}`, icon: '💰', color: 'bg-green-500', link: '/orders' },
    { label: 'total_orders', value: stats?.totalOrders || 0, icon: '📋', color: 'bg-purple-500', link: '/orders' },
    { label: 'total_sales', value: `฿${(stats?.totalSales || 0).toLocaleString()}`, icon: '💵', color: 'bg-yellow-500', link: '/reports' },
    { label: 'total_products', value: stats?.totalProducts || 0, icon: '💐', color: 'bg-pink-500', link: '/products' },
    { label: 'total_users', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-indigo-500', link: '/users' },
  ]

  const pendingCards = [
    { label: 'pending_orders', value: stats?.pendingOrders || 0, icon: '⏳', link: '/orders?status=pending' },
    { label: 'pending_appointments', value: stats?.pendingAppointments || 0, icon: '📅', link: '/appointments?status=pending' },
    { label: 'pending_contacts', value: stats?.pendingContacts || 0, icon: '💬', link: '/contacts?status=pending' },
    { label: 'cancellation_requests', value: stats?.cancellationRequests || 0, icon: '🔴', link: '/orders?status=cancellation_requested', highlight: (stats?.cancellationRequests || 0) > 0, urgent: true },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 ${card.color} rounded-lg lg:rounded-xl flex items-center justify-center text-xl lg:text-2xl`}>
                {card.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-slate-500 truncate">{t(card.label)}</p>
                <p className="text-lg lg:text-xl font-bold text-slate-800 truncate">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pendingCards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className={`bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow ${
              card.urgent && card.value > 0
                ? 'border-red-300 ring-1 ring-red-100'
                : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                card.urgent && card.value > 0 ? 'bg-red-100' : 'bg-orange-100'
              }`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500">{t(card.label)}</p>
                <p className={`text-2xl font-bold ${
                  card.urgent && card.value > 0 ? 'text-red-600' : 'text-orange-600'
                }`}>{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {(lowStock.low_stock.length > 0 || lowStock.out_of_stock.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 shadow-sm border border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-semibold text-amber-800">{t('stock_alert')}</h3>
            {(lowStock.out_of_stock.length > 0) && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                {lowStock.out_of_stock.length}{t('out_of_stock_count')}
              </span>
            )}
            {(lowStock.low_stock.length > 0) && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                {lowStock.low_stock.length}{t('low_stock_count')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.out_of_stock.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/products?search=${encodeURIComponent(item.name)}`}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200"
              >
                ⚠️ {item.name} ({t('out_of_stock')})
              </Link>
            ))}
            {lowStock.low_stock.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/products?search=${encodeURIComponent(item.name)}`}
                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm hover:bg-amber-200"
              >
                📉 {item.name} ({item.stock}/{item.threshold})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sales Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📈 {t('total_sales')} (7 {t('page')})</h3>
        <div className="flex items-end gap-2 h-48">
          {chartData.map((day, i) => {
            const maxSales = Math.max(...chartData.map(d => d.sales), 1)
            const height = (day.sales / maxSales) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${height}%`, minHeight: day.sales > 0 ? '4px' : '0' }}
                  title={`฿${day.sales.toLocaleString()}`}
                />
                <span className="text-xs text-slate-500">{day.date}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/orders"
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center"
        >
          <span className="text-3xl block mb-2">📦</span>
          <span className="text-sm font-medium text-slate-700">{t('orders')}</span>
        </Link>
        <Link
          to="/products"
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center"
        >
          <span className="text-3xl block mb-2">💐</span>
          <span className="text-sm font-medium text-slate-700">{t('products')}</span>
        </Link>
        <Link
          to="/appointments"
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center"
        >
          <span className="text-3xl block mb-2">📅</span>
          <span className="text-sm font-medium text-slate-700">{t('appointments')}</span>
        </Link>
        <Link
          to="/users"
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center"
        >
          <span className="text-3xl block mb-2">👥</span>
          <span className="text-sm font-medium text-slate-700">{t('users')}</span>
        </Link>
      </div>
    </div>
  )
}
