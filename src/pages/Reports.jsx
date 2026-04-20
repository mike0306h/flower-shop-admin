import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import api from '../services/api'
import { getSalesReport, getSalesByCategory, getTopProducts, getCustomerStats, getSalesComparison } from '../services/api'

const CATEGORY_LABELS = {
  'bouquet': 'category_bouquet',
  'rose': 'category_rose',
  'tulip': 'category_tulip',
  'tropical': 'category_tropical',
  'other': 'category_other'
}

const BAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']

export default function Reports() {
  const { t } = useI18n()
  const [period, setPeriod] = useState('daily')
  const [salesData, setSalesData] = useState([])
  const [summary, setSummary] = useState({})
  const [categoryData, setCategoryData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [customerStats, setCustomerStats] = useState({})
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [period])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [salesRes, categoryRes, productsRes, customerRes, comparisonRes] = await Promise.all([
        getSalesReport(period),
        getSalesByCategory(30),
        getTopProducts(30, 10),
        getCustomerStats(),
        getSalesComparison()
      ])
      setSalesData(salesRes.data || [])
      setSummary(salesRes.summary || {})
      setCategoryData(categoryRes.data || [])
      setTopProducts(productsRes.data || [])
      setCustomerStats(customerRes || {})
      setComparison(comparisonRes || null)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  // 渲染单个柱状条
  const renderBar = (value, max, color = 'bg-blue-500') => {
    const percent = max > 0 ? (value / max) * 100 : 0
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-medium w-24 text-right">฿{value.toLocaleString()}</span>
      </div>
    )
  }

  // 渲染涨跌幅徽章
  const renderChangeBadge = (change) => {
    if (change === null || change === undefined) return null
    const isUp = change > 0
    const isDown = change < 0
    return (
      <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
        isUp ? 'bg-green-100 text-green-700' :
        isDown ? 'bg-red-100 text-red-700' :
        'bg-slate-100 text-slate-600'
      }`}>
        {isUp ? '↑' : isDown ? '↓' : '–'}{Math.abs(change)}%
      </span>
    )
  }

  const maxSales = Math.max(...salesData.map(d => d.sales), 1)
  const maxCategory = Math.max(...categoryData.map(d => d.sales), 1)
  const maxProduct = Math.max(...topProducts.map(d => d.sales), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📊 {t('reports_title')}</h1>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p === 'daily' ? t('period_daily') : p === 'weekly' ? t('period_weekly') : t('period_monthly')}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Comparison Cards */}
      {comparison && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* This Week */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{t('this_week')}</span>
              {renderChangeBadge(comparison.this_week_change)}
            </div>
            <p className="text-2xl font-bold text-blue-600">฿{(comparison.this_week.sales || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{comparison.this_week.orders} {t('order_unit')}</p>
          </div>
          {/* Last Week */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <span className="text-xs text-slate-500">{t('last_week')}</span>
            <p className="text-2xl font-bold text-slate-400">฿{(comparison.last_week.sales || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{comparison.last_week.orders} {t('order_unit')}</p>
          </div>
          {/* This Month */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{t('this_month')}</span>
              {renderChangeBadge(comparison.this_month_change)}
            </div>
            <p className="text-2xl font-bold text-green-600">฿{(comparison.this_month.sales || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{comparison.this_month.orders} {t('order_unit')}</p>
          </div>
          {/* Last Month */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <span className="text-xs text-slate-500">{t('last_month')}</span>
            <p className="text-2xl font-bold text-slate-400">฿{(comparison.last_month.sales || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{comparison.last_month.orders} {t('order_unit')}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">{t('total_orders_count')}</p>
          <p className="text-3xl font-bold text-blue-600">{summary.total_orders || 0}</p>
          <p className="text-xs text-slate-400 mt-1">{t('total_orders_unit')}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">{t('total_sales_amount')}</p>
          <p className="text-3xl font-bold text-green-600">฿{(summary.total_sales || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{t('total_sales_currency')}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">{t('avg_order_value')}</p>
          <p className="text-3xl font-bold text-purple-600">฿{(summary.avg_order_value || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{t('avg_order_unit')}</p>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">👥 {t('customer_stats')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{customerStats.total_customers || 0}</p>
            <p className="text-sm text-slate-500">{t('total_customers')}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">{customerStats.new_this_month || 0}</p>
            <p className="text-sm text-slate-500">{t('new_this_month')}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">{customerStats.repeat_customers || 0}</p>
            <p className="text-sm text-slate-500">{t('repeat_customers')}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-600">{customerStats.repeat_rate || 0}%</p>
            <p className="text-sm text-slate-500">{t('repeat_rate')}</p>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">💰 {t('sales_trend')}</h3>
        {salesData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `฿${value.toLocaleString()}`,
                    name === 'sales' ? t('total_sales_amount') : t('order_unit')
                  ]}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: 13,
                  }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="sales" name="sales" radius={[4, 4, 0, 0]}>
                  {salesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sales > 0 ? '#3b82f6' : '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">{t('no_data')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4">📦 {t('category_sales')}</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t(CATEGORY_LABELS[item.category] || item.category)}</span>
                    <span className="text-slate-500">{item.item_count}{t('item_unit')}</span>
                  </div>
                  {renderBar(item.sales, maxCategory, BAR_COLORS[i % BAR_COLORS.length])}
                </div>
              ))}
              <div className="pt-2 border-t mt-4">
                <div className="flex justify-between font-medium">
                  <span>{t('grand_total')}</span>
                  <span className="text-green-600">฿{categoryData.reduce((s, d) => s + d.sales, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">{t('no_data')}</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4">🏆 {t('top_products')}</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-400 text-yellow-800' :
                    i === 1 ? 'bg-slate-300 text-slate-700' :
                    i === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <span className="text-xs text-slate-400">{item.quantity}{t('item_unit')}</span>
                  <span className="text-sm font-medium text-green-600">฿{item.sales.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">{t('no_data')}</p>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const headers = [t('csv_date'), t('csv_order_count'), t('csv_sales'), t('csv_avg_price')]
            const rows = salesData.map(d => [d.date, d.orders, d.sales, d.avg_value])
            const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `sales-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          📥 {t('export_csv')}
        </button>
      </div>
    </div>
  )
}
