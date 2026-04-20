import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import { getOrders, updateOrder, deleteOrder } from '../services/api'
import api from '../services/api'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

// 配送时间段映射 - 使用函数以便访问 t()
const getTimeSlotLabels = (t) => ({
  'am': t('time_slot_am') || '上午 9:00-12:00',
  'pm': t('time_slot_pm') || '下午 12:00-18:00',
  'evening': t('time_slot_evening') || '傍晚 18:00-21:00',
  'morning': t('time_slot_morning') || '上午 9:00-12:00',
  'afternoon': t('time_slot_afternoon') || '下午 12:00-18:00',
  'all_day': t('time_slot_all_day') || '全天'
})

export default function Orders() {
  const { t } = useI18n()
  const { hasPermission } = useAuth()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [filterStatus])

  const loadOrders = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (filterStatus) params.status = filterStatus
      if (search) params.search = search

      const res = await getOrders(params)
      setOrders(res.items)
      setPagination({ page: res.page, pages: res.pages, total: res.total })
    } catch (error) {
      console.error('Failed to load orders:', error)
      alert(t('load_orders_failed') || '加载订单列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus, extraData = {}) => {
    const statusLabels = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      in_progress: t('in_progress'),
      preparing: t('preparing'),
      shipped: t('shipped'),
      delivered: t('delivered'),
      cancelled: t('cancelled')
    }
    if (newStatus === 'cancelled' && !extraData.cancel_reason) {
      // 取消订单已经在prompt里输入原因了，直接使用
    } else if (!window.confirm(t('confirm_order_status_change') || `确定将订单状态修改为「${statusLabels[newStatus] || newStatus}」？`)) {
      return
    }
    try {
      // updateOrder 返回完整的更新后订单对象，直接使用即可
      // 不需要额外调用 getOrder（避免 Vite tree-shaking 误删）
      const updated = await updateOrder(orderId, { status: newStatus, ...extraData })
      loadOrders()
      if (selectedOrder) {
        setSelectedOrder(updated)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      const msg = error?.response?.data?.detail || t('update_order_status_failed') || '更新订单状态失败'
      alert(msg)
    }
  }

  const handleDelete = async (orderId) => {
    if (window.confirm(t('confirm_delete') || '确定删除此订单？')) {
      try {
        await deleteOrder(orderId)
        loadOrders()
        setSelectedOrder(null)
      } catch (error) {
        console.error('Failed to delete order:', error)
        alert(t('delete_order_failed') || '删除订单失败')
      }
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadOrders(1)
  }

  // 格式化时间显示
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr)
    const dateStr2 = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr2} ${timeStr}`
  }

  const statusList = ['pending', 'confirmed', 'in_progress', 'preparing', 'shipped', 'delivered', 'cancelled']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search') || '搜索...'}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('search')}
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !filterStatus ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('all') || '全部'}
          </button>
          {statusList.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filterStatus === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
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
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('order_no')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('customer')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('phone')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('total_amount')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('created_at')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('no_data')}</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{order.order_no}</td>
                  <td className="px-4 py-3 text-sm">{order.user_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{order.phone}</td>
                  <td className="px-4 py-3 text-sm font-semibold">฿{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {t(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                    >
                      {t('view_detail')}
                    </button>
                    {hasPermission('orders', 'delete') && (
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('delete')}
                    </button>
                    )}
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
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => loadOrders(page)}
              className={`w-10 h-10 rounded-lg transition-colors ${
                pagination.page === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          statusList={statusList}
        />
      )}
    </div>
  )
}

// 图片放大组件
function ImageLightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center cursor-zoom-out"
      onClick={onClose}
    >
      <img
        src={src}
        alt={t('zoom_image') || '放大图片'}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl"
      >
        ✕
      </button>
    </div>
  )
}

// 订单详情弹窗
function OrderDetailModal({ order, onClose, onStatusChange, statusList }) {
  const { t } = useI18n()
  const [lightboxImage, setLightboxImage] = useState(null)
  const [uploadingShipped, setUploadingShipped] = useState(false)
  const [uploadingDelivered, setUploadingDelivered] = useState(false)
  const shippedInputRef = useRef()

  // 状态流转规则：当前状态 -> 允许的目标状态
  const STATUS_TRANSITIONS = {
    pending:     ['confirmed', 'cancelled'],
    confirmed:    ['in_progress', 'preparing', 'cancelled'],
    in_progress: ['preparing', 'shipped'],
    preparing:    ['shipped'],
    shipped:      ['delivered'],
    delivered:    [],
    cancelled:    [],
  }
  const getNextStatuses = (s) => STATUS_TRANSITIONS[s] || []
  const deliveredInputRef = useRef()
  const [shippedLink, setShippedLink] = useState(order.shipped_link || '')
  const [savingLink, setSavingLink] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  // 复制到剪贴板
  const handleCopy = (text, field) => {
    if (!text) return
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    })
  }

  // 从 items 获取商品图片
  const productImages = []
  order.items?.forEach(item => {
    if (item.image) {
      productImages.push({ src: item.image, label: item.name })
    }
  })

  // 发货相关显示逻辑
  const isShipped = order.status === 'shipped'
  const isDelivered = order.status === 'delivered'

  // 配送时间段显示
  const getTimeSlotLabel = (slot) => {
    if (!slot) return null
    return getTimeSlotLabels(t)[slot] || slot
  }

  // 格式化时间
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr)
    const dateStr2 = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr2} ${timeStr}`
  }

  // 检查备注是否需要高亮（包含特殊关键词）
  const isNoteImportant = (note) => {
    if (!note) return false
    const keywords = [t('urgent'), t('rush'), t('must'), t('important'), t('careful'), t('attention'), t('birthday'), t('anniversary'), t('wedding'), t('proposal')]
    return keywords.some(kw => note.includes(kw))
  }

  const handleShippedImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingShipped(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await updateOrder(order.id, { shipped_image: res.url })
      onStatusChange(order.id, order.status)
    } catch (err) {
      console.error('Upload failed:', err)
      alert(t('upload_failed') || '上传失败')
    } finally {
      setUploadingShipped(false)
    }
  }

  const handleDeliveredImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingDelivered(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await updateOrder(order.id, { delivered_image: res.url })
      onStatusChange(order.id, order.status)
    } catch (err) {
      console.error('Upload failed:', err)
      alert(t('upload_failed') || '上传失败')
    } finally {
      setUploadingDelivered(false)
    }
  }

  const handleSaveShippedLink = async () => {
    if (!shippedLink.trim()) {
      alert(t('enter_delivery_link') || '请输入配送链接')
      return
    }
    setSavingLink(true)
    try {
      await updateOrder(order.id, { shipped_link: shippedLink })
      onStatusChange(order.id, order.status)
    } catch (err) {
      console.error('Save link failed:', err)
      alert(t('save_failed') || '保存失败')
    } finally {
      setSavingLink(false)
    }
  }

  return (
    <>
      {lightboxImage && (
        <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
            <h3 className="text-lg font-bold">{t('order_items')}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
          <div className="p-6 space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">{t('order_no')}:</span>
                <button
                  onClick={() => handleCopy(order.order_no, 'order_no')}
                  className="ml-2 font-mono text-blue-600 hover:text-blue-800 underline decoration-dotted"
                  title={t('click_to_copy') || '点击复制'}
                >
                  {order.order_no}
                  {copiedField === 'order_no' && <span className="ml-1 text-green-500 text-xs">{t('copied') || '✓已复制'}</span>}
                </button>
              </div>
              <div>
                <span className="text-slate-500">{t('status')}:</span>
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  className="ml-2 px-2 py-1 border rounded"
                >
                  {/* 当前状态作为选中项 */}
                  <option key={order.status} value={order.status}>{t(order.status)}</option>
                  {getNextStatuses(order.status).map(s => (
                    <option key={s} value={s}>{t(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-slate-500">{t('customer')}:</span>
                <button
                  onClick={() => handleCopy(order.user_name, 'name')}
                  className="ml-2 hover:text-blue-800 underline decoration-dotted"
                  title={t('click_to_copy') || '点击复制'}
                >
                  {order.user_name || '-'}
                  {copiedField === 'name' && <span className="ml-1 text-green-500 text-xs">{t('copied') || '✓已复制'}</span>}
                </button>
              </div>
              <div>
                <span className="text-slate-500">{t('phone')}:</span>
                <button
                  onClick={() => handleCopy(order.phone, 'phone')}
                  className="ml-2 hover:text-blue-800 underline decoration-dotted"
                  title={t('click_to_copy') || '点击复制'}
                >
                  {order.phone}
                  {copiedField === 'phone' && <span className="ml-1 text-green-500 text-xs">{t('copied') || '✓已复制'}</span>}
                </button>
              </div>
              <div>
                <span className="text-slate-500">{t('order_time') || '下单时间'}:</span>
                <span className="ml-2">{formatDateTime(order.created_at)}</span>
              </div>
              {order.time_slot && (
                <div>
                  <span className="text-slate-500">{t('delivery_time_slot') || '配送时段'}:</span>
                  <span className="ml-2 font-medium text-indigo-600">{getTimeSlotLabel(order.time_slot)}</span>
                </div>
              )}
            </div>

            {/* 优惠券信息 */}
            {(order.coupon_code || order.discount > 0) && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎟️</span>
                  <span className="font-medium text-green-800">{t('discount_info') || '优惠信息'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {order.coupon_code && (
                    <div>
                      <span className="text-green-600">{t('coupon') || '优惠券'}:</span>
                      <span className="ml-2 font-mono bg-green-100 px-2 py-0.5 rounded">{order.coupon_code}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div>
                      <span className="text-green-600">{t('discount_amount') || '优惠金额'}:</span>
                      <span className="ml-2 font-bold text-green-700">-฿{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div>
              <span className="text-slate-500 text-sm">{t('delivery_address')}:</span>
              <button
                onClick={() => handleCopy(order.address, 'address')}
                className="mt-1 text-sm text-left w-full hover:text-blue-800 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                title={t('click_to_copy_address') || '点击复制地址'}
              >
                {order.address}
                {copiedField === 'address' && <span className="ml-2 text-green-500 text-xs">{t('copied') || '✓ 已复制'}</span>}
              </button>
            </div>

            {/* Product Images - 可点击放大 */}
            {productImages.length > 0 && (
              <div>
                <span className="text-slate-500 text-sm">{t('product_images') || '商品图片'}:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {productImages.map((img, i) => (
                    <img
                      key={i}
                      src={img.src}
                      alt={img.label}
                      title={`${t('click_to_zoom') || '点击放大'} - ${img.label}`}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                      onClick={() => setLightboxImage(img.src)}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <span className="text-slate-500 text-sm">{t('order_items')}:</span>
              <div className="mt-2 space-y-2">
                {order.items?.map((item, i) => {
                  const itemTotal = (item.price || 0) * (item.quantity || 1)
                  return (
                    <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            title={t('click_to_zoom') || '点击放大'}
                            className="w-10 h-10 object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-400"
                            onClick={() => setLightboxImage(item.image)}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <button
                          onClick={() => handleCopy(item.name, `item_name_${i}`)}
                          className="hover:text-blue-800 underline decoration-dotted"
                          title={t('click_to_copy_item_name') || '点击复制商品名称'}
                        >
                          {item.name}
                          {copiedField === `item_name_${i}` && <span className="ml-1 text-green-500 text-xs">{t('copied') || '✓已复制'}</span>}
                        </button>
                        <span className="text-slate-400">x{item.quantity}</span>
                        <span className="text-slate-400">({item.flowers}朵)</span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-slate-400">@฿{item.price}/个</span>
                        )}
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => handleCopy(itemTotal, `item_total_${i}`)}
                          className="font-medium hover:text-green-700 underline decoration-dotted"
                          title={t('click_to_copy_subtotal') || '点击复制小计'}
                        >
                          ฿{itemTotal.toLocaleString()}
                          {copiedField === `item_total_${i}` && <span className="ml-1 text-green-500 text-xs">{t('copied') || '✓已复制'}</span>}
                        </button>
                        {item.quantity > 1 && (
                          <p className="text-xs text-slate-400">฿{item.price} x {item.quantity}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 客户备注 - 高亮样式 */}
            {order.note && (
              <div className={`rounded-xl p-4 ${
                isNoteImportant(order.note)
                  ? 'bg-amber-50 border-2 border-amber-300'
                  : 'bg-slate-50 border border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💬</span>
                  <span className={`font-medium ${isNoteImportant(order.note) ? 'text-amber-800' : 'text-slate-700'}`}>
                    {isNoteImportant(order.note) ? (t('important_note') || '重要备注') : (t('customer_note') || '客户备注')}
                  </span>
                  {isNoteImportant(order.note) && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{t('please_note') || '请注意'}</span>
                  )}
                </div>
                <p className={`text-sm ${isNoteImportant(order.note) ? 'text-amber-900' : 'text-slate-600'}`}>
                  {order.note}
                </p>
              </div>
            )}

            {/* 发货信息 - 仅「已发货」状态显示 */}
            {isShipped && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-indigo-700">{t('shipped_info') || '发货信息'}</span>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{t('shipped_info_hint') || '请上传发货图片并填写配送链接'}</span>
                </div>

                {/* 发货图片 */}
                <div>
                  <span className="text-slate-500 text-sm">{t('shipped_image') || '发货图片'}:</span>
                  {order.shipped_image ? (
                    <div className="mt-1 flex items-center gap-3">
                      <img
                        src={order.shipped_image}
                        alt={t('shipment_proof') || '发货凭证'}
                        title={t('click_to_zoom') || '点击放大'}
                        className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:shadow-md"
                        onClick={() => setLightboxImage(order.shipped_image)}
                        onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23f1f5f9" width="96" height="96"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">无图片</text></svg>'}
                      />
                      <label className="cursor-pointer">
                        <input
                          ref={shippedInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleShippedImageUpload}
                          disabled={uploadingShipped}
                        />
                        <span className={`px-4 py-2 text-sm rounded-lg ${uploadingShipped ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                          {uploadingShipped ? (t('uploading') || '上传中...') : (t('reupload') || '重新上传')}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <label className="cursor-pointer inline-block">
                        <input
                          ref={shippedInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleShippedImageUpload}
                          disabled={uploadingShipped}
                        />
                        <span className={`px-4 py-2 text-sm rounded-lg ${uploadingShipped ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                          {uploadingShipped ? (t('uploading') || '上传中...') : (t('upload_shipped_image') || '上传发货图片')}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 配送链接 */}
                <div>
                  <span className="text-slate-500 text-sm">{t('delivery_link') || '配送链接'}:</span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="url"
                      value={shippedLink}
                      onChange={(e) => setShippedLink(e.target.value)}
                      placeholder={t('delivery_link_placeholder') || 'https://...（物流追踪链接）'}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg"
                    />
                    <button
                      onClick={handleSaveShippedLink}
                      disabled={savingLink}
                      className={`px-4 py-2 text-sm rounded-lg ${savingLink ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {savingLink ? (t('saving') || '保存中...') : (t('save') || '保存')}
                    </button>
                  </div>
                  {order.shipped_link && (
                    <a
                      href={order.shipped_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block break-all"
                    >
                      {order.shipped_link}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 收货信息 - 仅「已送达」状态显示 */}
            {isDelivered && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-green-700">{t('delivered_info') || '收货信息'}</span>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{t('delivered_info_hint') || '上传收货凭证图片'}</span>
                </div>

                {/* 收货图片 */}
                <div>
                  <span className="text-slate-500 text-sm">{t('delivered_image') || '收货图片'}:</span>
                  {order.delivered_image ? (
                    <div className="mt-1 flex items-center gap-3">
                      <img
                        src={order.delivered_image}
                        alt={t('delivery_proof') || '收货凭证'}
                        title={t('click_to_zoom') || '点击放大'}
                        className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:shadow-md"
                        onClick={() => setLightboxImage(order.delivered_image)}
                        onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23f1f5f9" width="96" height="96"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">无图片</text></svg>'}
                      />
                      <label className="cursor-pointer">
                        <input
                          ref={deliveredInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDeliveredImageUpload}
                          disabled={uploadingDelivered}
                        />
                        <span className={`px-4 py-2 text-sm rounded-lg ${uploadingDelivered ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {uploadingDelivered ? (t('uploading') || '上传中...') : (t('reupload') || '重新上传')}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <label className="cursor-pointer inline-block">
                        <input
                          ref={deliveredInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDeliveredImageUpload}
                          disabled={uploadingDelivered}
                        />
                        <span className={`px-4 py-2 text-sm rounded-lg ${uploadingDelivered ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {uploadingDelivered ? (t('uploading') || '上传中...') : (t('upload_delivered_image') || '上传收货图片')}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 配送链接（只读） */}
                {order.shipped_link && (
                  <div>
                    <span className="text-slate-500 text-sm">{t('delivery_link') || '配送链接'}:</span>
                    <div className="mt-1">
                      <a
                        href={order.shipped_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {order.shipped_link}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-slate-500">{t('total_amount')}</span>
              <span className="text-xl font-bold text-blue-600">฿{order.total.toLocaleString()}</span>
            </div>

            {/* 订单金额明细 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm font-medium text-slate-600 mb-2">💰 {t('amount_details') || '金额明细'}</p>
              <div className="space-y-1 text-sm">
                {/* 商品小计 */}
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('subtotal') || '商品小计'}</span>
                  <span className="text-slate-700">฿{(order.items?.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0) || 0).toLocaleString()}</span>
                </div>
                {/* 优惠 */}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('discount') || '优惠折扣'}</span>
                    <span>-฿{order.discount.toLocaleString()}</span>
                  </div>
                )}
                {/* 配送费 */}
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('delivery_fee') || '配送费'}</span>
                  <span className="text-slate-700">฿{order.delivery_fee || 0}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-200">
                  <span>{t('total') || '总计'}</span>
                  <span className="text-blue-600">฿{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 取消/退款信息 - 如果有取消记录或退款记录才显示 */}
            {(order.cancel_reason || order.refund_status !== 'none' || order.status === 'cancelled') && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-red-700">{t('cancel_refund_info') || '取消/退款信息'}</span>
                </div>

                {/* 取消原因 */}
                {order.cancel_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🚫</span>
                      <span className="font-medium text-red-800">{t('cancel_reason') || '取消原因'}</span>
                      {order.cancelled_at && (
                        <span className="text-xs text-red-500">{t('cancelled_at') || '取消于'} {formatDateTime(order.cancelled_at)}</span>
                      )}
                    </div>
                    <p className="text-sm text-red-700">{order.cancel_reason}</p>
                  </div>
                )}

                {/* 退款状态 */}
                {order.refund_status !== 'none' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💰</span>
                      <span className="font-medium text-orange-800">{t('refund_processing') || '退款处理'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-orange-600">{t('refund_amount') || '退款金额'}:</span>
                        <span className="ml-2 font-bold text-orange-700">฿{order.refund_amount?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-orange-600">{t('refund_status') || '退款状态'}:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                          order.refund_status === 'approved' ? 'bg-green-100 text-green-700' :
                          order.refund_status === 'requested' ? 'bg-yellow-100 text-yellow-700' :
                          order.refund_status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.refund_status === 'approved' ? (t('refunded') || '已退款') :
                           order.refund_status === 'requested' ? (t('pending_process') || '待处理') :
                           order.refund_status === 'rejected' ? (t('rejected') || '已拒绝') : order.refund_status}
                        </span>
                      </div>
                    </div>
                    {order.refunded_at && (
                      <p className="text-xs text-orange-500 mt-1">{t('refunded_at') || '退款于'} {formatDateTime(order.refunded_at)} {t('completed') || '完成'}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 底部操作按钮 */}
            <div className="border-t pt-4 mt-4 flex gap-2 flex-wrap">
              {/* 复制订单 */}
              <button
                onClick={() => {
                  const items = order.items?.map(i => `${i.name} x${i.quantity} (${i.flowers}朵) - ฿${i.price}`).join('\n') || ''
                  const text = `${t('copy_order_label') || '📋 订单号'}: ${order.order_no}
${t('copy_customer_label') || '👤 客户'}: ${order.user_name || '-'}
${t('copy_phone_label') || '📞 电话'}: ${order.phone}
${t('copy_address_label') || '📍 地址'}: ${order.address}
${order.time_slot ? `${t('copy_time_slot_label') || '⏰ 时段'}: ${order.time_slot}` : ''}
${t('copy_items_label') || '📦 商品'}:\n${items}
${order.coupon_code ? `${t('copy_coupon_label') || '🎟️ 优惠券'}: ${order.coupon_code} (-฿${order.discount})` : ''}
${t('copy_total_label') || '💰 总计'}: ฿${order.total}
${order.note ? `${t('copy_note_label') || '📝 备注'}: ${order.note}` : ''}`
                  navigator.clipboard.writeText(text)
                  setCopiedField('all')
                  setTimeout(() => setCopiedField(null), 2000)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors flex items-center gap-1"
              >
                {t('copy_order') || '📋 复制订单'}
                {copiedField === 'all' && <span>{t('copied') || '✓ 已复制'}</span>}
              </button>

              {/* 取消订单 - 仅非取消状态可操作 */}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <button
                  onClick={() => {
                    const reason = window.prompt(t('enter_cancel_reason') || '请输入取消原因:')
                    if (reason) {
                      onStatusChange(order.id, 'cancelled', { cancel_reason: reason })
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm transition-colors"
                >
                  {t('cancel_order') || '取消订单'}
                </button>
              )}

              {/* 打印小票 */}
              <button
                onClick={() => {
                  const printContent = generateReceipt(order)
                  const printWindow = window.open('', '_blank')
                  printWindow.document.write(printContent)
                  printWindow.document.close()
                  printWindow.print()
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm transition-colors flex items-center gap-2"
              >
                {t('print_receipt') || '🖨️ 打印小票'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// HTML 转义，防止 XSS
function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 生成小票内容
function generateReceipt(order) {
  const items = order.items || []
  const total = order.total || 0
  const discount = order.discount || 0
  const date = new Date(order.created_at).toLocaleString('zh-CN')

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px dashed #ccc;">
        ${escapeHtml(item.name || '商品')} x${item.quantity || 1}
        <br><small style="color:#888">${item.flowers || 0}朵</small>
      </td>
      <td style="padding:8px;border-bottom:1px dashed #ccc;text-align:right;">
        ฿${(item.price || 0).toLocaleString()}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>花店小票 - ${escapeHtml(order.order_no)}</title>
  <style>
    body { font-family: 'TH Sarabun New', 'Arial Unicode MS', sans-serif; margin: 0; padding: 20px; width: 300px; font-size: 14px; }
    h2 { text-align: center; margin: 0 0 10px 0; }
    .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
    .info { margin-bottom: 10px; }
    .info p { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; }
    .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px dashed #333; font-size: 12px; color: #666; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h2>🌸 鲜花小店</h2>
    <p>ใบเสร็จรับเงิน / Receipt</p>
  </div>

  <div class="info">
    <p><strong>เลขที่ Order No:</strong> ${escapeHtml(order.order_no)}</p>
    <p><strong>วันที่ Date:</strong> ${escapeHtml(date)}</p>
    <p><strong>ลูกค้า Customer:</strong> ${escapeHtml(order.user_name) || '-'}</p>
    <p><strong>โทร Tel:</strong> ${escapeHtml(order.phone) || '-'}</p>
    ${order.time_slot ? `<p><strong>เวลาจัดส่ง Time Slot:</strong> ${escapeHtml(order.time_slot)}</p>` : ''}
    <p><strong>ที่อยู่ Address:</strong> ${escapeHtml(order.address) || '-'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:8px;border-bottom:2px solid #333;">รายการ / Items</th>
        <th style="text-align:right;padding:8px;border-bottom:2px solid #333;">ราคา / Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  ${discount > 0 ? `<p style="text-align:right;color:#e53e3e;">ส่วนลด Discount: -฿${discount.toLocaleString()}</p>` : ''}
  <p class="total">รวม Total: ฿${total.toLocaleString()}</p>

  ${order.note ? `<p style="margin-top:15px;padding:8px;background:#fffbea;border-radius:4px;"><strong>หมายเหตุ Note:</strong> ${escapeHtml(order.note)}</p>` : ''}

  <div class="footer">
    <p>ขอบคุณที่ใช้บริการค่ะ / Thank you!</p>
    <p>🌸 Flower Shop 🌸</p>
  </div>
</body>
</html>
  `
}
