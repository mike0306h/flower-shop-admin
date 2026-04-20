import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { getUsers, getUserAddresses, getUser, updateUser, adjustUserPoints, resetUserPassword, createAddress, updateAddress, deleteAddress, getUserOrders } from '../services/api'

const LEVEL_COLORS = {
  normal: 'bg-slate-100 text-slate-600',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  diamond: 'bg-purple-100 text-purple-700',
}
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  banned: 'bg-red-100 text-red-700',
  suspended: 'bg-orange-100 text-orange-700',
}
const SOURCE_COLORS = {
  wechat: 'bg-green-100 text-green-700',
  line: 'bg-blue-100 text-blue-700',
  phone: 'bg-purple-100 text-purple-700',
  manual: 'bg-slate-100 text-slate-600',
}

const STATUS_MAP = { active: 'active', banned: 'banned', suspended: 'suspended' }
const LEVEL_MAP = { normal: 'normal', silver: 'silver', gold: 'gold', diamond: 'diamond' }
const SOURCE_MAP = { wechat: 'wechat', line: 'line', phone: 'phone', manual: 'manual' }

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-orange-100 text-orange-700',
}

export default function Users() {
  const { t, lang } = useI18n()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)

  // 筛选
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(1)

  // 详情抽屉
  const [detailUser, setDetailUser] = useState(null)
  const [detailOrders, setDetailOrders] = useState([])
  const [detailAddresses, setDetailAddresses] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  // 订单历史弹窗
  const [ordersModal, setOrdersModal] = useState(null)
  const [ordersList, setOrdersList] = useState([])
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [ordersPages, setOrdersPages] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(false)

  // 编辑弹窗
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // 积分弹窗
  const [pointsModal, setPointsModal] = useState(null)
  const [pointsDelta, setPointsDelta] = useState('')
  const [pointsReason, setPointsReason] = useState('')

  // 重置密码弹窗
  const [resetPwdModal, setResetPwdModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetPwdSaving, setResetPwdSaving] = useState(false)

  // 地址弹窗
  const [addrModal, setAddrModal] = useState(null)
  const [addrForm, setAddrForm] = useState({ name: '', phone: '', full_address: '', is_default: false })
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrDeleting, setAddrDeleting] = useState(null)

  useEffect(() => { loadUsers() }, [tab, page, search, levelFilter, sourceFilter])

  const loadUsers = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, page_size: 20 }
      if (search) params.search = search
      if (tab !== 'all') params.status = tab
      if (levelFilter !== 'all') params.level = levelFilter
      if (sourceFilter !== 'all') params.source = sourceFilter
      const res = await getUsers(params)
      setUsers(res.items)
      setPagination({ page: res.page, pages: res.pages, total: res.total })
    } catch (error) { console.error('Failed to load users:', error) }
    finally { setLoading(false) }
  }

  const handleTab = (v) => { setTab(v); setPage(1) }
  const handleSearch = (e) => { e.preventDefault(); loadUsers(1) }

  const openDetail = async (userId) => {
    setDetailLoading(true)
    try {
      const [user, addrs] = await Promise.all([getUser(userId), getUserAddresses(userId)])
      setDetailUser(user)
      setDetailOrders(user.recent_orders || [])
      setDetailAddresses(addrs)
    } catch (e) { console.error(e) }
    finally { setDetailLoading(false) }
  }

  const openOrdersModal = async (userId) => {
    setOrdersLoading(true)
    setOrdersModal(userId)
    try {
      const res = await getUserOrders(userId, { page: 1, page_size: 20 })
      setOrdersList(res.items)
      setOrdersTotal(res.total)
      setOrdersPages(res.pages)
      setOrdersPage(1)
    } catch (e) { console.error(e) }
    finally { setOrdersLoading(false) }
  }

  const loadOrdersPage = async (p) => {
    setOrdersLoading(true)
    try {
      const res = await getUserOrders(ordersModal, { page: p, page_size: 20 })
      setOrdersList(res.items)
      setOrdersPage(p)
    } catch (e) { console.error(e) }
    finally { setOrdersLoading(false) }
  }

  const openEdit = (user) => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      level: user.level || 'normal',
      status: user.status || 'active',
      source: user.source || 'manual',
      email_notifications: user.email_notifications,
      line_notifications: user.line_notifications,
    })
    setEditModal(user)
  }

  const saveEdit = async () => {
    setEditSaving(true)
    try {
      await updateUser(editModal.id, editForm)
      setEditModal(null)
      loadUsers(page)
      if (detailUser) openDetail(detailUser.id)
    } catch (e) { console.error(e) }
    finally { setEditSaving(false) }
  }

  const savePoints = async () => {
    const delta = parseInt(pointsDelta)
    if (isNaN(delta)) return
    try {
      await adjustUserPoints(pointsModal.id, delta, pointsReason)
      setPointsModal(null)
      setPointsDelta('')
      setPointsReason('')
      openDetail(pointsModal.id)
    } catch (e) { console.error(e) }
  }

  const saveResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return
    setResetPwdSaving(true)
    try {
      await resetUserPassword(resetPwdModal.id, newPassword)
      setResetPwdModal(null)
      setNewPassword('')
    } catch (e) { console.error(e) }
    finally { setResetPwdSaving(false) }
  }

  const openAddAddress = (userId) => {
    setAddrForm({ name: '', phone: '', full_address: '', is_default: false })
    setAddrModal({ mode: 'create', userId })
  }

  const openEditAddress = (addr) => {
    setAddrForm({ name: addr.name || '', phone: addr.phone || '', full_address: addr.full_address || '', is_default: addr.is_default || false })
    setAddrModal({ mode: 'edit', addressId: addr.id, userId: addr.user_id })
  }

  const saveAddress = async () => {
    setAddrSaving(true)
    try {
      if (addrModal.mode === 'create') await createAddress({ user_id: addrModal.userId, ...addrForm })
      else await updateAddress(addrModal.addressId, addrForm)
      setAddrModal(null)
      openDetail(detailUser.id)
    } catch (e) { console.error(e) }
    finally { setAddrSaving(false) }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm(t('confirm_delete_address') || '确定删除该地址？')) return
    setAddrDeleting(addressId)
    try {
      await deleteAddress(addressId)
      openDetail(detailUser.id)
    } catch (e) { console.error(e) }
    finally { setAddrDeleting(null) }
  }

  // 辅助：带语言标签的等级/状态/来源
  const levelLabel = (lv) => t(`level_${lv}`) || t('level_normal')
  const statusLabel = (s) => t(`status_${s}`) || t('status_active')
  const sourceLabel = (s) => t(`source_${s}`) || t('source_manual')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{t('user_management')}</h2>
        <div className="text-sm text-slate-500">
          {t('total_users')}: {pagination.total || 0}
        </div>
      </div>

      {/* 状态 Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit">
        {[
          { key: 'all', label: t('all') },
          { key: 'active', label: t('active_users') },
          { key: 'banned', label: t('banned_users') },
          { key: 'suspended', label: t('suspended_users') },
        ].map(item => (
          <button key={item.key} onClick={() => handleTab(item.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === item.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{t('search')}</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); loadUsers(1) }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm">{t('clear_search')}</button>
          )}
        </form>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-slate-500">{t('level')}:</span>
          {['all', 'normal', 'silver', 'gold', 'diamond'].map(lv => (
            <button key={lv} onClick={() => { setLevelFilter(lv); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${levelFilter === lv ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {lv === 'all' ? t('all') : levelLabel(lv)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-slate-500">{t('source')}:</span>
          {['all', 'wechat', 'line', 'phone', 'manual'].map(src => (
            <button key={src} onClick={() => { setSourceFilter(src); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sourceFilter === src ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {src === 'all' ? t('all') : sourceLabel(src)}
            </button>
          ))}
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('user_name')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('email')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('level')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('account_status')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('source')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('points')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('total_spent')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('order_count')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('registered_at')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                <div className="flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"/></div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">{t('no_data')}</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{user.avatar || '👤'}</div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{user.name || <span className="text-slate-400">{t('no_data')}</span>}</p>
                      <p className="text-xs text-slate-400">{user.phone || '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{user.email || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_COLORS[user.level] || LEVEL_COLORS.normal}`}>{levelLabel(user.level)}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status] || STATUS_COLORS.active}`}>{statusLabel(user.status)}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${SOURCE_COLORS[user.source] || SOURCE_COLORS.manual}`}>{sourceLabel(user.source)}</span></td>
                <td className="px-4 py-3 text-sm font-medium text-amber-600">{user.points?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-slate-600">฿{(user.order_total || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openOrdersModal(user.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(user.order_count || 0) > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-slate-100 text-slate-400 cursor-default'}`}
                  >
                    {user.order_count || 0} {t('orders_unit')}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN') : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(user.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('view_detail')}</button>
                    <button onClick={() => openEdit(user)} className="text-slate-500 hover:text-slate-700 text-xs">{t('edit')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadUsers(p) }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">{t('prev_page')}</button>
          <span className="px-4 py-2 text-sm text-slate-600">{t('page_of').replace('%s', page).replace('%s', pagination.pages)}</span>
          <button disabled={page >= pagination.pages} onClick={() => { const p = page + 1; setPage(p); loadUsers(p) }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50">{t('next_page')}</button>
        </div>
      )}

      {/* 用户详情抽屉 */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetailUser(null)}>
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* 抽屉头部 */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">{detailUser.avatar || '👤'}</div>
                <div>
                  <h3 className="font-bold text-slate-800">{detailUser.name || t('no_data')}</h3>
                  <p className="text-sm text-slate-400">ID: {detailUser.id}</p>
                </div>
              </div>
              <button onClick={() => setDetailUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">✕</button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"/></div>
            ) : (
              <div className="p-6 space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('total_spent'), value: `฿${(detailUser.order_total || 0).toLocaleString()}`, color: 'text-green-600' },
                    { label: t('order_count'), value: detailUser.order_count || 0, color: 'text-blue-600' },
                    { label: t('current_points'), value: (detailUser.points || 0).toLocaleString(), color: 'text-amber-600' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* 基本信息 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-700">{t('user_info')}</h4>
                    <div className="flex gap-3">
                      <button onClick={() => setResetPwdModal(detailUser)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">{t('reset_password')}</button>
                      <button onClick={() => openEdit(detailUser)} className="text-xs text-blue-600 hover:text-blue-800">{t('edit')}</button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                    {[
                      { label: t('email'), value: detailUser.email || '-' },
                      { label: t('contact_phone'), value: detailUser.phone || '-' },
                      { label: t('member_level'), value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[detailUser.level]}`}>{levelLabel(detailUser.level)}</span> },
                      { label: t('account_status'), value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[detailUser.status]}`}>{statusLabel(detailUser.status)}</span> },
                      { label: t('registration_source'), value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[detailUser.source]}`}>{sourceLabel(detailUser.source)}</span> },
                      { label: t('registered_at'), value: detailUser.created_at ? new Date(detailUser.created_at).toLocaleString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN') : '-' },
                      { label: t('last_login'), value: detailUser.last_login ? new Date(detailUser.last_login).toLocaleString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN') : t('never_logged_in') },
                      { label: t('line_notifications'), value: detailUser.line_notifications ? t('enabled') : t('disabled') },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-slate-800 font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 积分管理 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-700">{t('points_management')}</h4>
                    <button onClick={() => { setPointsModal(detailUser); setPointsDelta(''); setPointsReason('') }}
                      className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium">{t('adjust_points')}</button>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-700">{t('current_points')}</span>
                      <span className="text-xl font-bold text-amber-600">{detailUser.points?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 收货地址 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-700">{t('shipping_address')}</h4>
                    <button onClick={() => openAddAddress(detailUser.id)}
                      className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium">+ {t('add_address')}</button>
                  </div>
                  {detailAddresses.length === 0 ? (
                    <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4">{t('no_address_yet')}</p>
                  ) : (
                    <div className="space-y-2">
                      {detailAddresses.map(addr => (
                        <div key={addr.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{addr.name}</span>
                              <span className="text-slate-500">{addr.phone}</span>
                              {addr.is_default && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">{t('set_as_default')}</span>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEditAddress(addr)} className="text-xs text-blue-600 hover:text-blue-800">{t('edit')}</button>
                              <button onClick={() => handleDeleteAddress(addr.id)} disabled={addrDeleting === addr.id}
                                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40">{addrDeleting === addr.id ? '...' : t('delete')}</button>
                            </div>
                          </div>
                          <p className="text-slate-600 mt-1">{addr.full_address || addr.address}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 订单历史弹窗 */}
      {ordersModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOrdersModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-800">{t('recent_orders')}</h3>
                <p className="text-sm text-slate-500">{t('total_users')}: {ordersTotal}</p>
              </div>
              <button onClick={() => setOrdersModal(null)} className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"/></div>
              ) : ordersList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">{t('no_orders_yet')}</div>
              ) : ordersList.map(order => (
                <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* 订单头 */}
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                        {t(order.status) || order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{order.user_email || order.user_name || '-'}</span>
                      <span>฿{order.total?.toLocaleString()}</span>
                      <span>{order.created_at ? new Date(order.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN') : '-'}</span>
                    </div>
                  </div>
                  {/* 商品列表 */}
                  {order.items && order.items.length > 0 && (
                    <div className="p-4 flex gap-3 overflow-x-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-24">
                          {item.image ? (
                            <img src={item.image} alt={item.name || t('product')} className="w-24 h-24 object-cover rounded-lg bg-slate-100" />
                          ) : (
                            <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">🌸</div>
                          )}
                          <p className="text-xs text-slate-700 mt-1.5 text-center font-medium truncate">{item.name || t('product')}</p>
                          <p className="text-xs text-slate-400 text-center">x{item.quantity || 1}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {ordersPages > 1 && (
              <div className="p-4 border-t flex justify-center gap-2 flex-shrink-0">
                <button disabled={ordersPage <= 1} onClick={() => loadOrdersPage(ordersPage - 1)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-200">{t('prev_page')}</button>
                <span className="px-4 py-2 text-sm text-slate-600">{t('page_of').replace('%s', ordersPage).replace('%s', ordersPages)}</span>
                <button disabled={ordersPage >= ordersPages} onClick={() => loadOrdersPage(ordersPage + 1)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-200">{t('next_page')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 编辑用户弹窗 */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{t('edit')} #{editModal.id}</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {[{ key: 'name', label: t('user_name'), type: 'text' }, { key: 'email', label: t('email'), type: 'email' }, { key: 'phone', label: t('contact_phone'), type: 'text' }].map(f => (
                <div key={f.key}>
                  <label className="block text-slate-600 mb-1">{f.label}</label>
                  <input type={f.type} value={editForm[f.key] || ''} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-slate-600 mb-1">{t('member_level')}</label>
                <select value={editForm.level || 'normal'} onChange={e => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(LEVEL_MAP).map(([k]) => <option key={k} value={k}>{levelLabel(k)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{t('account_status')}</label>
                <select value={editForm.status || 'active'} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(STATUS_MAP).map(([k]) => <option key={k} value={k}>{statusLabel(k)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{t('registration_source')}</label>
                <select value={editForm.source || 'manual'} onChange={e => setEditForm(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(SOURCE_MAP).map(([k]) => <option key={k} value={k}>{sourceLabel(k)}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">{t('cancel')}</button>
              <button onClick={saveEdit} disabled={editSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-60">{editSaving ? t('saving') : t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 积分调整弹窗 */}
      {pointsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPointsModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="font-bold text-slate-800">{t('adjust_points')}</h3>
              <p className="text-sm text-slate-500 mt-1">{pointsModal.name || t('user_name')} ({t('current_points')}: {pointsModal.points?.toLocaleString()})</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">{t('points_adjustment')}</label>
                <input type="number" value={pointsDelta} onChange={e => setPointsDelta(e.target.value)} placeholder={t('positive_increases')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                <p className="text-xs text-slate-400 mt-1">{t('positive_increases')}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">{t('adjustment_reason')}（{t('all')}）</label>
                <input type="text" value={pointsReason} onChange={e => setPointsReason(e.target.value)} placeholder={t('optional_reason')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setPointsModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">{t('cancel')}</button>
              <button onClick={savePoints} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm">{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {resetPwdModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setResetPwdModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="font-bold text-slate-800">{t('reset_password')}</h3>
              <p className="text-sm text-slate-500 mt-1">{resetPwdModal.name || resetPwdModal.email || t('user_name')} (ID: {resetPwdModal.id})</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">{t('new_password')} <span className="text-red-500">*</span></label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('new_password')}
                  minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                <p className="text-xs text-red-400 mt-1">{newPassword.length > 0 && newPassword.length < 6 ? t('password_too_short') : ''}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-xs text-red-600">{t('reset_warning')}</div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setResetPwdModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">{t('cancel')}</button>
              <button onClick={saveResetPassword} disabled={resetPwdSaving || newPassword.length < 6}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50">{resetPwdSaving ? t('resetting') : t('confirm_reset')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 地址编辑弹窗 */}
      {addrModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAddrModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="font-bold text-slate-800">{addrModal.mode === 'create' ? t('add_address') : t('edit_address')}</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-slate-600 mb-1">{t('receiver_name')} <span className="text-red-500">*</span></label>
                <input type="text" value={addrForm.name} onChange={e => setAddrForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('receiver_name')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{t('contact_phone')} <span className="text-red-500">*</span></label>
                <input type="text" value={addrForm.phone} onChange={e => setAddrForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('contact_phone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{t('detailed_address')} <span className="text-red-500">*</span></label>
                <textarea value={addrForm.full_address} onChange={e => setAddrForm(prev => ({ ...prev, full_address: e.target.value }))}
                  placeholder={t('detailed_address')} rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="addr_default" checked={addrForm.is_default}
                  onChange={e => setAddrForm(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="addr_default" className="text-slate-600">{t('set_as_default')}</label>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setAddrModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">{t('cancel')}</button>
              <button onClick={saveAddress} disabled={addrSaving || !addrForm.name || !addrForm.phone || !addrForm.full_address}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">{addrSaving ? t('saving') : t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
