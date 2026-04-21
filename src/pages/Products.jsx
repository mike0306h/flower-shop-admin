/* TEST_BUILD_MARKER_12345 */ import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../context/I18nContext'
import { getProducts, createProduct, updateProduct, deleteProduct, uploadImage, getCategories } from '../services/api'

// ============================================================================
// 富文本编辑组件 — 基于原生 textarea + HTML 格式化按钮，稳定可靠
// ============================================================================
function RichTextArea({ value, onChange, placeholder, labels = {} }) {
  const { t } = useI18n()
  const {
    bold = '粗体', italic = '斜体', underline = '下划线',
    unordered_list = '无序列表', ordered_list = '有序列表',
    insert_link = '插入链接', link_url_placeholder = '输入链接地址:',
    red_emphasis = '红色强调', green_emphasis = '绿色强调',
    clear_content = '清空内容'
  } = labels
  const textareaRef = useRef(null)

  const wrapSelection = (before, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = ta.value.substring(start, end)
    const newText = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end)
    onChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-300 flex-wrap">
        <button type="button" onClick={() => wrapSelection('<b>', '</b>')} title={bold} className="px-2 py-1 text-sm font-bold text-slate-700 hover:bg-slate-200 rounded">B</button>
        <button type="button" onClick={() => wrapSelection('<i>', '</i>')} title={italic} className="px-2 py-1 text-sm italic text-slate-700 hover:bg-slate-200 rounded">I</button>
        <button type="button" onClick={() => wrapSelection('<u>', '</u>')} title={underline} className="px-2 py-1 text-sm underline text-slate-700 hover:bg-slate-200 rounded">U</button>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <button type="button" onClick={() => wrapSelection('<ul>\n  <li>', '</li>\n</ul>')} title={unordered_list} className="px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 rounded">• {unordered_list}</button>
        <button type="button" onClick={() => wrapSelection('<ol>\n  <li>', '</li>\n</ol>')} title={ordered_list} className="px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 rounded">1. {ordered_list}</button>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <button type="button" onClick={() => { const url = window.prompt(link_url_placeholder) || ''; wrapSelection(`<a href="${url}" target="_blank">`, '</a>') }} title={insert_link} className="px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 rounded">🔗 {insert_link}</button>
        <button type="button" onClick={() => wrapSelection('<span class="text-red-500">', '</span>')} title={red_emphasis} className="px-2 py-1 text-sm text-red-500 hover:bg-slate-200 rounded">🔴 {red_emphasis}</button>
        <button type="button" onClick={() => wrapSelection('<span class="text-green-500">', '</span>')} title={green_emphasis} className="px-2 py-1 text-sm text-green-500 hover:bg-slate-200 rounded">🟢 {green_emphasis}</button>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <button type="button" onClick={() => onChange('')} title={clear_content} className="px-2 py-1 text-sm text-red-400 hover:bg-slate-200 rounded">🗑 {clear_content}</button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full px-3 py-2 text-sm resize-y focus:outline-none"
      />
    </div>
  )
}

// ============================================================================
// 商品弹窗子组件
// ============================================================================
function ProductModal({ editingProduct, onClose, onSaved }) {
  const { t, lang } = useI18n()
  const [formData, setFormData] = useState({
    name: '', name_th: '', name_en: '',
    price: '', original_price: '',
    images: [],
    stock: '', stock_threshold: '10',
    notify_low_stock: true,
    category: '', tags: [],
  })
  const [categories, setCategories] = useState([])
  const [flowerOptions, setFlowerOptions] = useState([{ count: 11, price: 0 }])
  const [description, setDescription] = useState({ zh: '', th: '', en: '' })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        name_th: editingProduct.name_th || '',
        name_en: editingProduct.name_en || '',
        price: editingProduct.price || '',
        original_price: editingProduct.original_price || '',
        images: editingProduct.images || [],
        stock: editingProduct.stock || '',
        stock_threshold: String(editingProduct.stock_threshold || 10),
        notify_low_stock: editingProduct.notify_low_stock !== false,
        category: editingProduct.category || '',
        tags: editingProduct.tags || [],
      })
      setFlowerOptions(editingProduct.flower_options && editingProduct.flower_options.length > 0
        ? editingProduct.flower_options
        : [{ count: 11, price: editingProduct.price || 0 }]
      )
      setDescription({
        zh: editingProduct.description || '',
        th: editingProduct.description_th || '',
        en: editingProduct.description_en || '',
      })
    } else {
      setFormData({ name: '', name_th: '', name_en: '', price: '', original_price: '', images: [], stock: '', stock_threshold: '10', notify_low_stock: true, category: '', tags: [] })
      setFlowerOptions([{ count: 11, price: 0 }])
      setDescription({ zh: '', th: '', en: '' })
    }
  }, [editingProduct])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock: parseInt(formData.stock) || 0,
        stock_threshold: parseInt(formData.stock_threshold) || 10,
        description: description.zh,
        description_th: description.th,
        description_en: description.en,
        flower_options: flowerOptions.filter(o => o.count > 0),
      }
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
      } else {
        await createProduct(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      alert(editingProduct ? t('update_failed', '更新失败') : t('create_failed', '创建失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadingImages(true)
    try {
      const uploaded = await Promise.all(files.map(f => uploadImage(f)))
      const urls = uploaded.map(r => r.url).filter(Boolean)
      setFormData(p => ({ ...p, images: [...p.images, ...urls] }))
    } catch {
      alert(t('image_upload_failed', '图片上传失败'))
    } finally {
      setUploadingImages(false)
    }
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))
  }

  const addFlowerOption = () => {
    setFlowerOptions(opts => [...opts, { count: 11, price: 0 }])
  }

  const updateFlowerOption = (idx, field, val) => {
    setFlowerOptions(opts => opts.map((o, i) => i === idx ? { ...o, [field]: field === 'count' ? parseInt(val) || 0 : parseFloat(val) || 0 } : o))
  }

  const removeFlowerOption = (idx) => {
    setFlowerOptions(opts => opts.filter((_, i) => i !== idx))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-xl font-bold">{editingProduct ? t('edit_product', '编辑商品') : t('add_product', '添加商品')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('product_name_zh', '商品名称 (中文)')} *</label>
              <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder={t('name_zh_placeholder', '如：玫瑰花束')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อสินค้า (ไทย)</label>
              <input value={formData.name_th} onChange={e => setFormData(p => ({ ...p, name_th: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder="ชื่อภาษาไทย" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name (EN)</label>
              <input value={formData.name_en} onChange={e => setFormData(p => ({ ...p, name_en: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder="Product name" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('price_th', '价格 (฿)')} *</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder="299" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('original_price', '原价 (฿)')}</label>
              <input type="number" step="0.01" value={formData.original_price} onChange={e => setFormData(p => ({ ...p, original_price: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder={t('original_price_placeholder', '留空则不显示原价')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('category', '分类')}</label>
            <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
              <option value="">— {t('select_category', '选择分类')} —</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>
                  {cat.emoji || '📂'} {cat.name_zh || cat.slug}
                  {cat.name_th ? ` / ${cat.name_th}` : ''}
                  {cat.name_en ? ` / ${cat.name_en}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('stock_quantity', '库存数量')}</label>
              <input type="number" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder="50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('low_stock_threshold', '低库存警告阈值')}</label>
              <input type="number" value={formData.stock_threshold} onChange={e => setFormData(p => ({ ...p, stock_threshold: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" placeholder="10" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="notify_low_stock" checked={formData.notify_low_stock} onChange={e => setFormData(p => ({ ...p, notify_low_stock: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="notify_low_stock" className="text-sm">{t('low_stock_notification', '库存低于阈值时发送低库存提醒')}</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">{t('flower_specs', '花材规格')}</label>
              <button type="button" onClick={addFlowerOption} className="text-sm text-blue-600 hover:text-blue-700">{t('add_spec', '+ 添加规格')}</button>
            </div>
            <div className="space-y-2">
              {flowerOptions.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 w-20">{t('spec_n', '规格 %d').replace('%d', index + 1)}</span>
                  <input
                    type="number"
                    value={opt.count}
                    onChange={e => updateFlowerOption(index, 'count', e.target.value)}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder={t('quantity_placeholder', '数量')}
                  />
                  <span className="text-sm text-slate-500">{t('flowers_unit', '朵')}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={opt.price}
                    onChange={e => updateFlowerOption(index, 'price', e.target.value)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="299"
                  />
                  <span className="text-sm text-slate-500">฿</span>
                  {flowerOptions.length > 1 && (
                    <button type="button" onClick={() => removeFlowerOption(index)} className="ml-2 text-red-500 hover:text-red-700 text-sm">{t('delete', '删除')}</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('description_zh', '描述 (中文)')}</label>
              <RichTextArea
                value={description.zh}
                onChange={val => setDescription(d => ({ ...d, zh: val }))}
                placeholder={t('description_placeholder_zh', '输入商品描述... 支持 HTML 格式：<b>粗体</b> <i>斜体</i> <ul><li>列表项</li></ul>')}
                labels={{
                  bold: t('bold', '粗体'), italic: t('italic', '斜体'), underline: t('underline', '下划线'),
                  unordered_list: t('unordered_list', '无序列表'), ordered_list: t('ordered_list', '有序列表'),
                  insert_link: t('insert_link', '插入链接'), link_url_placeholder: t('link_url_placeholder', '输入链接地址:'),
                  red_emphasis: t('red_emphasis', '红色强调'), green_emphasis: t('green_emphasis', '绿色强调'),
                  clear_content: t('clear_content', '清空内容'),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('description_th', '描述 (ไทย)')}</label>
              <RichTextArea
                value={description.th}
                onChange={val => setDescription(d => ({ ...d, th: val }))}
                placeholder="คำอธิบายสินค้า (ภาษาไทย)..."
                labels={{
                  bold: t('bold', '粗体'), italic: t('italic', '斜体'), underline: t('underline', '下划线'),
                  unordered_list: t('unordered_list', '无序列表'), ordered_list: t('ordered_list', '有序列表'),
                  insert_link: t('insert_link', '插入链接'), link_url_placeholder: t('link_url_placeholder', '输入链接地址:'),
                  red_emphasis: t('red_emphasis', '红色强调'), green_emphasis: t('green_emphasis', '绿色强调'),
                  clear_content: t('clear_content', '清空内容'),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('description_en', 'Description (EN)')}</label>
              <RichTextArea
                value={description.en}
                onChange={val => setDescription(d => ({ ...d, en: val }))}
                placeholder="Product description in English..."
                labels={{
                  bold: t('bold', '粗体'), italic: t('italic', '斜体'), underline: t('underline', '下划线'),
                  unordered_list: t('unordered_list', '无序列表'), ordered_list: t('ordered_list', '有序列表'),
                  insert_link: t('insert_link', '插入链接'), link_url_placeholder: t('link_url_placeholder', '输入链接地址:'),
                  red_emphasis: t('red_emphasis', '红色强调'), green_emphasis: t('green_emphasis', '绿色强调'),
                  clear_content: t('clear_content', '清空内容'),
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('product_image', '商品图片')}</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input type="file" id="image-upload-modal" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <label htmlFor="image-upload-modal" className="cursor-pointer">
                <div className="text-slate-500">
                  {uploadingImages ? (
                    <span>{t('uploading', '上传中...')}</span>
                  ) : (
                    <>
                      <span className="text-blue-600 hover:text-blue-700">{t('click_to_upload_image', '点击上传图片')}</span>
                      <span className="text-sm text-slate-400 ml-2">{t('upload_image_hint', '支持 JPG/PNG/GIF/WebP，单张不超过 5MB')}</span>
                    </>
                  )}
                </div>
              </label>
            </div>
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.images.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">{t('cancel', '取消')}</button>
            <button type="submit" disabled={saving || !formData.name || !formData.price} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? t('saving', '保存中...') : (editingProduct ? t('save_changes', '保存修改') : t('create_product', '创建商品'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// 商品管理主页面
// ============================================================================
export default function Products() {
  const { t, lang } = useI18n()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // 加载商品列表
  const loadProducts = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getProducts({ page, page_size: 20 })
      setProducts(res.items || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  // 加载分类列表（用于表格分类列显示）
  const loadCategories = async () => {
    try {
      const res = await getCategories()
      setCategories(res.items || res || [])
    } catch {
      // silent
    }
  }

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { loadCategories() }, [])

  const handleSaved = () => { loadProducts() }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProduct(deleteId)
      setDeleteId(null)
      loadProducts()
    } catch {
      alert(t('delete_failed', '删除失败'))
    }
  }

  // 根据 slug 从 categories 查找分类的显示名称
  const categoryLabel = (catSlug) => {
    if (!catSlug) return '—'
    const cat = categories.find(c => c.slug === catSlug)
    if (cat) {
      const name = cat.name_zh || cat.name_th || cat.name_en || cat.slug
      return `${cat.emoji || '📂'} ${name}`
    }
    return catSlug
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('product_management', '💐 商品管理')}</h1>
        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + {t('add_product', '添加商品')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">{t('loading', '加载中...')}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">{t('no_products', '暂无商品，点击上方按钮添加')}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">{t('id', 'ID')}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">{t('product_name', '商品名称')}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">{t('category', '分类')}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">{t('price', '价格')}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">{t('stock', '库存')}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">{t('actions', '操作')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{product.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{product.name}</span>
                    {product.name_th && <span className="text-slate-400 text-xs ml-1">({product.name_th})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{categoryLabel(product.category)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-blue-600">฿{product.price}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-slate-400 line-through text-xs ml-1">฿{product.original_price}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock <= (product.stock_threshold || 10) ? 'text-red-500' : 'text-green-600'}>
                      {product.stock <= (product.stock_threshold || 10) ? '⚠️ ' : '✅ '}{product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-700 text-sm mr-3">{t('edit', '编辑')}</button>
                    <button onClick={() => setDeleteId(product.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete', '删除')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          editingProduct={editingProduct}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">{t('confirm_delete', '确认删除')}</h3>
            <p className="text-slate-600 mb-6">{t('confirm_delete_product', '确定要删除这件商品吗？此操作无法撤销。')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">{t('cancel', '取消')}</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{t('confirm', '确认删除')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
