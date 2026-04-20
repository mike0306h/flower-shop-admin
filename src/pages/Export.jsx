import { useState } from 'react'
import { useI18n } from '../context/I18nContext'
import api from '../services/api'

export default function Export() {
  const { t } = useI18n()
  const [exporting, setExporting] = useState(null)
  const [options, setOptions] = useState({
    orderDays: 30,
    orderStatus: ''
  })

  const handleExport = async (type) => {
    setExporting(type)
    try {
      let url = `/export/${type}`
      const params = new URLSearchParams()

      if (type === 'orders') {
        if (options.orderDays) params.append('days', options.orderDays)
        if (options.orderStatus) params.append('status', options.orderStatus)
      }

      if (params.toString()) url += `?${params.toString()}`

      // 直接下载
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/)
        if (match) filename = match[1]
      }

      const url2 = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url2
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url2)
      document.body.removeChild(a)

    } catch (err) {
      console.error('Export failed:', err)
      alert(t('export_failed'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">📥 {t('export_title')}</h1>
        <p className="text-slate-500 mt-1">{t('export_desc')}</p>
      </div>

      {/* Quick Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ExportCard
          title={`📦 ${t('export_orders')}`}
          description={t('export_orders_desc')}
          buttonText={t('export_orders_btn')}
          exporting={exporting === 'orders'}
          onClick={() => handleExport('orders')}
        />
        <ExportCard
          title={`💐 ${t('export_products')}`}
          description={t('export_products_desc')}
          buttonText={t('export_products_btn')}
          exporting={exporting === 'products'}
          onClick={() => handleExport('products')}
        />
        <ExportCard
          title={`👥 ${t('export_customers')}`}
          description={t('export_customers_desc')}
          buttonText={t('export_customers_btn')}
          exporting={exporting === 'customers'}
          onClick={() => handleExport('customers')}
        />
        <ExportCard
          title={`🎫 ${t('export_coupons')}`}
          description={t('export_coupons_desc')}
          buttonText={t('export_coupons_btn')}
          exporting={exporting === 'coupons'}
          onClick={() => handleExport('coupons')}
        />
        <ExportCard
          title={`⭐ ${t('export_reviews')}`}
          description={t('export_reviews_desc')}
          buttonText={t('export_reviews_btn')}
          exporting={exporting === 'reviews'}
          onClick={() => handleExport('reviews')}
        />
        <ExportCard
          title={`💾 ${t('export_backup')}`}
          description={t('export_backup_desc')}
          buttonText={t('export_backup_btn')}
          exporting={exporting === 'backup'}
          onClick={() => handleExport('backup')}
          danger
        />
      </div>

      {/* Order Export Options */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4">{t('export_options')}</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-500 mb-1">{t('time_range')}</label>
            <select
              value={options.orderDays}
              onChange={(e) => setOptions({ ...options, orderDays: parseInt(e.target.value) })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="7">{t('last_7_days')}</option>
              <option value="30">{t('last_30_days')}</option>
              <option value="90">{t('last_90_days')}</option>
              <option value="180">{t('last_6_months')}</option>
              <option value="365">{t('last_1_year')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">{t('order_status')}</label>
            <select
              value={options.orderStatus}
              onChange={(e) => setOptions({ ...options, orderStatus: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">{t('all_status')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="confirmed">{t('confirmed')}</option>
              <option value="preparing">{t('preparing')}</option>
              <option value="shipped">{t('shipped')}</option>
              <option value="delivered">{t('delivered')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="text-blue-800 font-medium">{t('export_note_title')}</p>
            <ul className="text-blue-700 text-sm mt-1 space-y-1">
              <li>• {t('export_note_utf8')}</li>
              <li>• {t('export_note_json')}</li>
              <li>• {t('export_note_backup')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExportCard({ title, description, buttonText, exporting, onClick, danger }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-slate-500 text-sm mt-1 flex-1">{description}</p>
      <button
        onClick={onClick}
        disabled={exporting}
        className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          danger
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {exporting ? t('exporting') : buttonText}
      </button>
    </div>
  )
}
