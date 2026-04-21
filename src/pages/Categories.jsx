import React, { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { getCategories, createCategory, updateCategory, deleteCategory, uploadImage } from '../services/api'

export default function Categories() {
  const { t, lang } = useI18n()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    slug: '',
    name_zh: '',
    name_th: '',
    name_en: '',
    emoji: '🌸',
    image: '',
    sort_order: 0,
    active: true,
    show_on_home: true,
  })

  const loadCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(t('category_load_failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData({ slug: '', name_zh: '', name_th: '', name_en: '', emoji: '🌸', image: '', sort_order: 0, active: true, show_on_home: true })
    setShowModal(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      slug: cat.slug,
      name_zh: cat.name_zh,
      name_th: cat.name_th,
      name_en: cat.name_en,
      emoji: cat.emoji || '🌸',
      image: cat.image || '',
      sort_order: cat.sort_order,
      active: cat.active,
      show_on_home: cat.show_on_home !== false,
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const response = await uploadImage(file)
      setFormData(f => ({ ...f, image: response.url }))
    } catch (err) {
      alert(t('image_upload_failed'))
    } finally {
      setUploadingImage(false)
    }
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!formData.slug || !formData.name_zh || !formData.name_th || !formData.name_en) {
      alert(t('please_fill_required_fields'))
      return
    }
    // slug 格式校验：只能字母和下划线
    if (!/^[a-z_]+$/.test(formData.slug)) {
      alert(t('slug_format_error'))
      return
    }
    setSaving(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
      } else {
        await createCategory(formData)
      }
      setShowModal(false)
      loadCategories()
    } catch (err) {
      const msg = err?.response?.data?.detail || t('save_failed')
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete_category'))) return
    setDeletingId(id)
    try {
      await deleteCategory(id)
      loadCategories()
    } catch (err) {
      alert(t('delete_failed'))
    } finally {
      setDeletingId(null)
    }
  }

  const getName = (cat) => {
    if (lang === 'th') return cat.name_th
    if (lang === 'en') return cat.name_en
    return cat.name_zh
  }

  // 获取分类图片URL（处理 /static/ 前缀）
  const getImageUrl = (cat) => {
    if (!cat.image) return null
    if (cat.image.startsWith('http')) return cat.image
    return cat.image.startsWith('http') ? cat.image : `/api${cat.image}`
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('categories') || '商品分类'}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('category_management_desc')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
        >
          <span>＋</span> {t('add_category')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('category_image')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emoji
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sort_order')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name_zh')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ภาษาไทย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  English
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    {t('no_categories_yet')}
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {cat.image ? (
                      <img
                        src={getImageUrl(cat)}
                        alt={getName(cat)}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        {t('no_image')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-2xl">
                    {cat.emoji || '🌸'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-600 font-bold text-sm">
                      {cat.sort_order}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-800">
                    {cat.slug}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {cat.name_zh}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cat.name_th}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cat.name_en}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cat.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.active ? t('enabled') : t('disabled')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="px-3 py-1.5 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === cat.id ? t('deleting') : t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingCategory ? t('edit_category') : t('add_category')}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('category_image')}
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={getImageUrl({ image: formData.image })}
                          alt={t('preview')}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => setFormData(f => ({ ...f, image: '' }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                        {t('no_image')}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="category-image-upload"
                    />
                    <label
                      htmlFor="category-image-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg cursor-pointer hover:bg-pink-100 transition-colors text-sm ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? t('uploading') : `📷 ${t('upload_image')}`}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">{t('image_format_hint')}</p>
                  </div>
                </div>
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emoji_icon')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={e => setFormData(f => ({ ...f, emoji: e.target.value }))}
                    maxLength={10}
                    placeholder={t('emoji_placeholder')}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-2xl w-20 text-center"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {['🌸', '💐', '🌹', '🌷', '🌺', '🌻', '🪻', '🏵️'].map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, emoji: e }))}
                        className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                          formData.emoji === e ? 'bg-pink-100 ring-2 ring-pink-400 scale-110' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') }))}
                  placeholder={t('slug_placeholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none font-mono text-sm"
                  disabled={!!editingCategory}
                />
                <p className="text-xs text-gray-400 mt-1">{t('slug_description')}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name_zh')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_zh}
                    onChange={e => setFormData(f => ({ ...f, name_zh: e.target.value }))}
                    placeholder={t('name_zh_placeholder')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name_th')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_th}
                    onChange={e => setFormData(f => ({ ...f, name_th: e.target.value }))}
                    placeholder={t('name_th_placeholder') || t('name_zh_placeholder')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name_en')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={e => setFormData(f => ({ ...f, name_en: e.target.value }))}
                    placeholder={t('name_en_placeholder')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sort_order')} <span className="text-gray-400">({t('sort_order_hint')})</span>
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={e => setFormData(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('status')}
                  </label>
                  <select
                    value={formData.active ? 'true' : 'false'}
                    onChange={e => setFormData(f => ({ ...f, active: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-300 outline-none text-sm"
                  >
                    <option value="true">{t('enabled')}</option>
                    <option value="false">{t('disabled')}</option>
                  </select>
                </div>
              </div>

              {/* 前台使用开关 */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('show_on_home')}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">{t('show_on_home_hint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, show_on_home: !f.show_on_home }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.show_on_home ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      formData.show_on_home ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
