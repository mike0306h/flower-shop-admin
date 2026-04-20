import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import api from '../services/api'

const ACTION_COLORS = {
  'create': 'bg-green-100 text-green-700',
  'update': 'bg-blue-100 text-blue-700',
  'delete': 'bg-red-100 text-red-700',
  'login': 'bg-purple-100 text-purple-700',
  'other': 'bg-slate-100 text-slate-700'
}

const TARGET_TYPES = ['order', 'product', 'user', 'coupon', 'appointment', 'settings']

export default function AdminLogs() {
  const { t } = useI18n()
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ action: '', target_type: '' })

  useEffect(() => {
    loadLogs()
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await api.get('/admin-logs/stats?days=7')
      setStats(res)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const loadLogs = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, page_size: 30 }
      if (filter.action) params.action = filter.action
      if (filter.target_type) params.target_type = filter.target_type

      const res = await api.get('/admin-logs', { params })
      setLogs(res.items || [])
      setPagination({ page: res.page, pages: res.pages, total: res.total })
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async () => {
    if (!window.confirm(t('confirm_cleanup_logs'))) return
    try {
      const res = await api.delete('/admin-logs/cleanup?days=90')
      alert(t('logs_deleted').replace('{count}', res.deleted))
      loadLogs()
      loadStats()
    } catch (err) {
      console.error('Cleanup failed:', err)
      alert(t('cleanup_failed'))
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionLabel = (action) => {
    const labels = {
      'create': t('action_create'),
      'update': t('action_update'),
      'delete': t('action_delete'),
      'login': t('action_login'),
      'logout': t('action_logout')
    }
    return labels[action] || action
  }

  const getTargetLabel = (type) => {
    const labels = {
      'order': t('target_order'),
      'product': t('target_product'),
      'user': t('target_user'),
      'coupon': t('target_coupon'),
      'appointment': t('target_appointment'),
      'settings': t('target_settings')
    }
    return labels[type] || type
  }

  const getDetailText = (detail) => {
    if (!detail) return '-'
    try {
      const obj = typeof detail === 'string' ? JSON.parse(detail) : detail
      if (obj.key) {
        return t(obj.key, obj)
      }
      return detail
    } catch {
      return detail
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📋 {t('admin_logs_title')}</h1>
        <button
          onClick={handleCleanup}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
        >
          🗑️ {t('cleanup_old_logs')}
        </button>
      </div>

      {/* Stats */}
      {stats.action_stats && stats.action_stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{t('total_operations')}</p>
            <p className="text-2xl font-bold text-slate-700">
              {(stats.action_stats || []).reduce((s, a) => s + a.count, 0)}
            </p>
          </div>
          {(stats.action_stats || []).slice(0, 3).map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">{getActionLabel(item.action)}</p>
              <p className="text-2xl font-bold">{item.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-4">
        <select
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">{t('all_actions')}</option>
          <option value="create">{t('action_create')}</option>
          <option value="update">{t('action_update')}</option>
          <option value="delete">{t('action_delete')}</option>
          <option value="login">{t('action_login')}</option>
        </select>
        <select
          value={filter.target_type}
          onChange={(e) => setFilter({ ...filter, target_type: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">{t('all_types')}</option>
          {TARGET_TYPES.map(type => (
            <option key={type} value={type}>{getTargetLabel(type)}</option>
          ))}
        </select>
        <button
          onClick={() => loadLogs(1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('filter')}
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('time')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('admin')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('operation')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('object')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('detail')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('no_logs')}</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs">
                        {log.admin_name?.[0] || 'A'}
                      </span>
                      <span>{log.admin_name || t('system')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ACTION_COLORS[log.action] || ACTION_COLORS.other
                    }`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-blue-600">{getTargetLabel(log.target_type)}</span>
                    <span className="text-slate-400 ml-1">#{log.target_id}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                    {getDetailText(log.detail)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {(() => {
            const pages = []
            const total = pagination.pages
            const current = pagination.page
            const maxVisible = 10
            let start = Math.max(1, current - Math.floor(maxVisible / 2))
            let end = start + maxVisible - 1
            if (end > total) { end = total; start = Math.max(1, end - maxVisible + 1) }
            for (let i = start; i <= end; i++) pages.push(i)
            return pages.map(page => (
              <button
                key={page}
                onClick={() => loadLogs(page)}
                className={`w-10 h-10 rounded-lg ${
                  pagination.page === page ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
