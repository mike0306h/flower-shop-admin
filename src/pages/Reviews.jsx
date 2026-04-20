import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import api from '../services/api'

const RATING_COLORS = {
  5: 'bg-green-100 text-green-700',
  4: 'bg-lime-100 text-lime-700',
  3: 'bg-yellow-100 text-yellow-700',
  2: 'bg-orange-100 text-orange-700',
  1: 'bg-red-100 text-red-700',
}

export default function Reviews() {
  const { t } = useI18n()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filter, setFilter] = useState({ product_id: '', active: '' })
  const [products, setProducts] = useState([])

  useEffect(() => {
    loadReviews()
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const res = await api.get('/products?page_size=999')
      setProducts(res.items || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadReviews = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (filter.product_id) params.product_id = filter.product_id
      if (filter.active !== '') params.include_inactive = filter.active === 'false'

      const res = await api.get('/reviews', { params })
      setReviews(res.items || [])
      setPagination({ page: res.page, pages: res.pages, total: res.total })
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (reviewId, currentActive) => {
    try {
      await api.patch(`/reviews/${reviewId}/toggle`)
      loadReviews(pagination.page)
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm(t('confirm_delete_review'))) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      loadReviews(pagination.page)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('reviews_management')}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <select
          value={filter.product_id}
          onChange={(e) => setFilter({ ...filter, product_id: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('all_products')}</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filter.active}
          onChange={(e) => setFilter({ ...filter, active: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('all_status')}</option>
          <option value="true">{t('show')}</option>
          <option value="false">{t('hide')}</option>
        </select>

        <button
          onClick={() => loadReviews(1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('filter')}
        </button>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('product')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('user')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('rating')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('review_content')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('images')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('time')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">{t('no_reviews')}</td>
              </tr>
            ) : (
              reviews.map(review => (
                <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-slate-800">{review.product_name}</div>
                    <div className="text-xs text-slate-400">ID: {review.product_id}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{review.user_avatar || '👤'}</span>
                      <span>{review.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">{renderStars(review.rating)}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${RATING_COLORS[review.rating]}`}>
                        {review.rating}{t('star')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs">
                    <p className="truncate text-slate-600">{review.comment || t('no_text_review')}</p>
                  </td>
                  <td className="px-4 py-3">
                    {review.images && review.images.length > 0 ? (
                      <div className="flex gap-1">
                        {review.images.slice(0, 2).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-10 h-10 object-cover rounded border"
                          />
                        ))}
                        {review.images.length > 2 && (
                          <span className="text-xs text-slate-400">+{review.images.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">{t('none')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      review.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {review.active ? t('show') : t('hide')}
                    </span>
                    {review.is_verified && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">{t('purchased')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(review.id, review.active)}
                      className={`text-sm mr-2 ${review.active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {review.active ? t('hide') : t('show')}
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('delete')}
                    </button>
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
              onClick={() => loadReviews(page)}
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
    </div>
  )
}
