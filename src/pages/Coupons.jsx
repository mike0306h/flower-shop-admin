import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/api'

export default function Coupons() {
  const { t } = useI18n()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    min_amount: 0,
    max_uses: 0,
    expires_at: '',
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const res = await getCoupons({ page_size: 100 })
      setCoupons(res.items)
    } catch (error) {
      console.error('Failed to load coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await getCoupons({ search, page_size: 100 })
      setCoupons(res.items)
    } catch (error) {
      console.error('Failed to search:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: '',
      min_amount: 0,
      max_uses: 0,
      expires_at: '',
    })
    setShowModal(true)
  }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percent',
      discount_value: coupon.discount_value || '',
      min_amount: coupon.min_amount || 0,
      max_uses: coupon.max_uses || 0,
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_amount: parseFloat(formData.min_amount),
        max_uses: parseInt(formData.max_uses) || 0,
      }

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, data)
      } else {
        await createCoupon(data)
      }
      setShowModal(false)
      loadCoupons()
    } catch (error) {
      console.error('Failed to save:', error)
      alert(error.response?.data?.detail || 'Failed to save coupon')
    }
  }

  const handleToggleActive = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { active: !coupon.active })
      loadCoupons()
    } catch (error) {
      console.error('Failed to toggle:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await deleteCoupon(id)
        loadCoupons()
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('search')}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{t('search')}</button>
        <button onClick={openAddModal} className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg">+ {t('add_coupon')}</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('coupon_code')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('discount_type')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('discount_value')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('min_amount')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('used_count')}/{t('max_uses')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('coupon_status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('no_data')}</td></tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-blue-600">{coupon.code}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.discount_type === 'percent' ? t('percent') : t('fixed')}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `฿${coupon.discount_value}`}
                  </td>
                  <td className="px-4 py-3 text-sm">฿{coupon.min_amount}</td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.used_count} / {coupon.max_uses || '∞'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {coupon.active ? t('coupon_enable') : t('coupon_disable')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEditModal(coupon)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">{t('edit')}</button>
                    <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-800 text-sm">{t('delete')}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between">
              <h3 className="text-lg font-bold">{editingCoupon ? t('edit_coupon') : t('add_coupon')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">{t('coupon_code')}</label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className={inputClass}
                  disabled={!!editingCoupon}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('discount_type')}</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                  className={inputClass}
                >
                  <option value="percent">{t('percent')}</option>
                  <option value="fixed">{t('fixed')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('discount_value')}</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">{t('min_amount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({...formData, min_amount: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">{t('max_uses')}</label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                    className={inputClass}
                    placeholder={`0 = ${t('unlimited')}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">{t('expires_at')}</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">{t('cancel')}</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
