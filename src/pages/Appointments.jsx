import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { getAppointments, updateAppointment, deleteAppointment } from '../services/api'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Appointments() {
  const { t, lang } = useI18n()
  const [appointments, setAppointments] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadAppointments()
  }, [filterStatus, page])

  const loadAppointments = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, page_size: 20 }
      if (filterStatus) params.status = filterStatus
      if (search) params.search = search
      const res = await getAppointments(params)
      setAppointments(res.items)
      setPagination({ page: res.page, pages: res.pages, total: res.total })
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadAppointments(1)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAppointment(id, { status: newStatus })
      loadAppointments(page)
      if (selectedApp) {
        const updated = appointments.find(a => a.id === id)
        if (updated) setSelectedApp({ ...selectedApp, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete') || '确定删除?')) {
      try {
        await deleteAppointment(id)
        loadAppointments(page)
        if (selectedApp?.id === id) setSelectedApp(null)
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  const statusList = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t('appointment_management')}</h2>
        <div className="text-sm text-slate-500">{t('total')}: {pagination.total || 0}</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{t('search')}</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); loadAppointments(1) }}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm">{t('clear_search')}</button>
          )}
        </form>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setFilterStatus(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!filterStatus ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t('all')}
          </button>
          {statusList.map(status => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {t(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('images')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('appointment_no')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('customer_name')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('occasion')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('budget')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('delivery_date')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('status')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                <div className="flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"/></div>
              </td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">{t('no_data')}</td></tr>
            ) : (
              appointments.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    {app.reference_images && app.reference_images.length > 0 ? (
                      <div className="flex gap-1.5">
                        {app.reference_images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ))}
                        {app.reference_images.length > 3 && (
                          <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                            +{app.reference_images.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <span className="text-slate-300 text-lg">📷</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{app.appointment_no}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-slate-800">{app.customer_name}</div>
                    <div className="text-xs text-slate-400">{app.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t(app.occasion)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{app.budget}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{app.delivery_date ? (
                    <div>{new Date(app.delivery_date).toLocaleDateString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN')}</div>
                  ) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t(app.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedApp(app)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">{t('view_detail')}</button>
                    <button onClick={() => handleDelete(app.id)} className="text-red-600 hover:text-red-800 text-sm">{t('delete')}</button>
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
          <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadAppointments(p) }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">{t('prev_page')}</button>
          <span className="px-4 py-2 text-sm text-slate-600">{t('page_of').replace('%s', page).replace('%s', pagination.pages)}</span>
          <button disabled={page >= pagination.pages} onClick={() => { const p = page + 1; setPage(p); loadAppointments(p) }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">{t('next_page')}</button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">📅</div>
                <div>
                  <h3 className="font-bold text-slate-800">{t('appointment_detail')}</h3>
                  <p className="text-sm text-slate-400 font-mono">{selectedApp.appointment_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {statusList.map(s => <option key={s} value={s}>{t(s)}</option>)}
                </select>
                <button onClick={() => handleDelete(selectedApp.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete')}</button>
                <button onClick={() => setSelectedApp(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* 客户信息 */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-700 mb-3">{t('customer_info')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: t('customer_name'), value: selectedApp.customer_name },
                    { label: t('phone'), value: selectedApp.customer_phone },
                    { label: t('occasion'), value: t(selectedApp.occasion) },
                    { label: t('budget'), value: selectedApp.budget },
                  ].map(row => (
                    <div key={row.label}>
                      <span className="text-slate-500">{row.label}:</span>
                      <span className="ml-2 text-slate-800 font-medium">{row.value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 参考图片 */}
              {selectedApp.reference_images && selectedApp.reference_images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">{t('reference_images')}{t('photo_count', '').replace('{n}', selectedApp.reference_images.length)}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedApp.reference_images.map((img, i) => (
                      <div key={i} onClick={() => setPreviewImage(img)}
                        className="block rounded-xl overflow-hidden border-2 border-slate-200 hover:border-pink-400 transition-colors group cursor-zoom-in">
                          <img
                            src={img}
                            alt={`${t('reference_images')} ${i + 1}`}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class='w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-400 text-xs'>${t('image_n', `图片${i+1}`).replace('{n}', i+1)}</div>` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 配送信息 */}
              {(selectedApp.delivery_date || selectedApp.delivery_address || selectedApp.recipient_name) && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-3">{t('delivery_info')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedApp.delivery_date && (
                      <div>
                        <span className="text-slate-500">{t('delivery_date')}:</span>
                        <span className="ml-2 text-slate-800 font-medium">
                          {new Date(selectedApp.delivery_date).toLocaleDateString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN')}
                          {selectedApp.delivery_time ? ` ${selectedApp.delivery_time}` : ''}
                        </span>
                      </div>
                    )}
                    {selectedApp.recipient_name && (
                      <div>
                        <span className="text-slate-500">{t('recipient')}:</span>
                        <span className="ml-2 text-slate-800 font-medium">{selectedApp.recipient_name}</span>
                      </div>
                    )}
                    {selectedApp.recipient_phone && (
                      <div>
                        <span className="text-slate-500">{t('contact_phone')}:</span>
                        <span className="ml-2 text-slate-800 font-medium">{selectedApp.recipient_phone}</span>
                      </div>
                    )}
                    {selectedApp.delivery_address && (
                      <div className="col-span-2">
                        <span className="text-slate-500">{t('delivery_address')}:</span>
                        <span className="ml-2 text-slate-800 font-medium">{selectedApp.delivery_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 贺卡 */}
              {selectedApp.blessing_card && (
                <div className="bg-pink-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">{t('blessing_card')}</h4>
                  <p className="text-slate-700 italic text-sm">"{selectedApp.blessing_card}"</p>
                </div>
              )}

              {/* 需求备注 */}
              {(selectedApp.requirements || selectedApp.note) && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">{t('requirements')}</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">{selectedApp.requirements || selectedApp.note || '-'}</p>
                </div>
              )}

              {/* 包装 */}
              {selectedApp.packaging && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{t('packaging')}:</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700">{selectedApp.packaging}</span>
                </div>
              )}

              {/* 时间 */}
              <div className="text-xs text-slate-400 text-right">
                {t('created_at')}: {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN') : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览 Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-pink-300 text-2xl font-bold z-10">✕</button>
            <img src={previewImage} alt={t('preview')}
              className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
