import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import api, { uploadImage } from '../services/api'

export default function Settings() {
  const { t } = useI18n()
  const { user, hasPermission } = useAuth()

  // 根据角色过滤可见的 Tab
  const tabs = [
    { id: 'profile', label: t('tab_profile') || '👤 个人信息', icon: '👤' },
    // 店铺信息和通知配置：仅 super_admin 和 admin 可见
    { id: 'shop', label: t('tab_shop') || '🏪 店铺信息', icon: '🏪',
      requires: ['super_admin', 'admin'] },
    { id: 'notification', label: t('tab_notification') || '📧 通知配置', icon: '📧',
      requires: ['super_admin', 'admin'] },
    // 系统设置：仅 super_admin 可见
    { id: 'system', label: t('tab_system') || 'ℹ️ 系统', icon: 'ℹ️',
      requires: ['super_admin'] },
  ].filter(tab => !tab.requires || tab.requires.includes(user?.role))
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // === SMTP state ===
  const [smtp, setSmtp] = useState({ host: '', port: 587, user: '', password: '', from_email: '' })
  const [smtpStatus, setSmtpStatus] = useState(null)
  const [smtpLoading, setSmtpLoading] = useState(false)
  const [smtpSaveLoading, setSmtpSaveLoading] = useState(false)
  const [smtpSaved, setSmtpSaved] = useState(false)

  // === Printer state ===
  const [printer, setPrinter] = useState({
    feieyun_user: '',
    feieyun_ukey: '',
    feieyun_sn: '',
    auto_print: false,
  })
  const [printerStatus, setPrinterStatus] = useState(null)
  const [printerSaveLoading, setPrinterSaveLoading] = useState(false)
  const [printerSaved, setPrinterSaved] = useState(false)
  const [printerTesting, setPrinterTesting] = useState(false)

  // === Shop Info state ===
  const [shopInfo, setShopInfo] = useState({
    address_zh: '', address_th: '', address_en: '',
    phone: '', hours_zh: '', hours_th: '', hours_en: '',
    line_qr_image: '', shop_name: '', logo_url: '',
  })
  const [shopInfoLoading, setShopInfoLoading] = useState(false)
  const [shopInfoSaved, setShopInfoSaved] = useState(false)
  const [shopInfoUploading, setShopInfoUploading] = useState(false)

  // 加载配置
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // SMTP
      const smtpData = await api.get('/notifications/system-settings')
      setSmtp({
        host: smtpData?.smtp?.host || '',
        port: smtpData?.smtp?.port || 587,
        user: smtpData?.smtp?.user || '',
        password: '',
        from_email: smtpData?.smtp?.from_email || '',
      })
      setSmtpStatus(smtpData?.smtp?.configured ? { ok: true, msg: t('channel_configured') } : null)

      // Printer
      const printerData = await api.get('/notifications/system-settings/printer')
      setPrinter({
        feieyun_user: printerData.feieyun_user || '',
        feieyun_ukey: '', // UKEY 不返回，只显示是否已配置
        feieyun_sn: printerData.feieyun_sn || '',
        auto_print: printerData.auto_print || false,
      })
      setPrinterStatus(printerData.configured ? { ok: true, msg: t('printer_configured') } : null)

      // Shop Info
      const shopData = await api.get('/shop-info')
      setShopInfo({
        address_zh: shopData.address_zh || '',
        address_th: shopData.address_th || '',
        address_en: shopData.address_en || '',
        phone: shopData.phone || '',
        hours_zh: shopData.hours_zh || '',
        hours_th: shopData.hours_th || '',
        hours_en: shopData.hours_en || '',
        line_qr_image: shopData.line_qr_image || '',
        shop_name: shopData.shop_name || '',
        logo_url: shopData.logo_url || '',
      })
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  // === 修改密码 ===
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: t('password_error') || '新密码与确认密码不匹配' })
      return
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: t('password_length_error') })
      return
    }
    if (!/[a-zA-Z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword)) {
      setPasswordMsg({ type: 'error', text: t('password_composition_error') })
      return
    }

    setPasswordLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      })
      setPasswordMsg({ type: 'success', text: t('password_changed') || '密码修改成功' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordMsg({ type: 'error', text: error.response?.data?.detail || t('password_error') || '密码修改失败' })
    } finally {
      setPasswordLoading(false)
    }
  }

  // === 保存 SMTP ===
  const saveSmtp = async () => {
    setSmtpSaveLoading(true)
    try {
      await api.put('/notifications/system-settings/smtp', {
        smtp_host: smtp.host,
        smtp_port: smtp.port,
        smtp_user: smtp.user,
        smtp_password: smtp.password || undefined,
        from_email: smtp.from_email,
      })
      setSmtpSaved(true)
      setSmtp(s => ({ ...s, password: '' }))
      setTimeout(() => setSmtpSaved(false), 3000)
    } catch (e) {
      setSmtpStatus({ ok: false, msg: e.response?.data?.detail || t('smtp_save_failed') })
    } finally {
      setSmtpSaveLoading(false)
    }
  }

  // === 测试 SMTP ===
  const testSmtp = async () => {
    if (!smtp.host || !smtp.user) {
      setSmtpStatus({ ok: false, msg: t('smtp_not_configured') || '请填写主机和用户名' })
      return
    }
    setSmtpLoading(true)
    setSmtpStatus(null)
    try {
      const res = await api.post('/notifications/system-settings/smtp/test')
      setSmtpStatus(res.data)
    } catch (e) {
      setSmtpStatus({ ok: false, msg: e.response?.data?.error || t('smtp_test_failed') })
    } finally {
      setSmtpLoading(false)
    }
  }

  // === 保存打印机配置 ===
  const savePrinter = async () => {
    setPrinterSaveLoading(true)
    try {
      await api.put('/notifications/system-settings/printer', {
        feieyun_user: printer.feieyun_user || undefined,
        feieyun_ukey: printer.feieyun_ukey || undefined,
        feieyun_sn: printer.feieyun_sn || undefined,
        feieyun_auto_print: printer.auto_print,
      })
      setPrinterSaved(true)
      setPrinter(p => ({ ...p, feieyun_ukey: '' })) // 清空 UKEY 字段
      setTimeout(() => setPrinterSaved(false), 3000)
    } catch (e) {
      setPrinterStatus({ ok: false, msg: e.response?.data?.detail || t('printer_save_failed') || '保存失败' })
    } finally {
      setPrinterSaveLoading(false)
    }
  }

  // === 上传 Line 二维码 ===
  const handleQrUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setShopInfoUploading(true)
    try {
      const res = await uploadImage(file)
      const url = res.url || ''
      setShopInfo(s => ({ ...s, line_qr_image: url }))
    } catch {
      alert(t('image_upload_failed', '图片上传失败'))
    } finally {
      setShopInfoUploading(false)
      e.target.value = ''
    }
  }

  const saveShopInfo = async () => {
    setShopInfoLoading(true)
    try {
      await api.put('/shop-info', shopInfo)
      setShopInfoSaved(true)
      setTimeout(() => setShopInfoSaved(false), 3000)
    } catch (e) {
      alert(e.response?.data?.detail || t('save_failed', '保存失败'))
    } finally {
      setShopInfoLoading(false)
    }
  }


  // === 上传 Logo ===
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setShopInfoUploading(true)
    try {
      const res = await uploadImage(file)
      setShopInfo(s => ({ ...s, logo_url: res.url || '' }))
    } catch {
      alert('图片上传失败')
    } finally {
      setShopInfoUploading(false)
      e.target.value = ''
    }
  }

  // === 测试打印 ===
  const testPrinter = async () => {
    if (!printer.feieyun_user || !printer.feieyun_sn) {
      setPrinterStatus({ ok: false, msg: t('printer_fill_required') || '请填写用户名和打印机编号' })
      return
    }
    setPrinterTesting(true)
    setPrinterStatus(null)
    try {
      const res = await api.post('/notifications/system-settings/printer/test')
      setPrinterStatus(res.data)
    } catch (e) {
      setPrinterStatus({ ok: false, msg: e.response?.data?.msg || e.response?.data?.detail || t('printer_test_failed') || '测试失败' })
    } finally {
      setPrinterTesting(false)
    }
  }

  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="max-w-2xl">
      {/* Tab Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-4 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">

        {/* === Tab: 个人信息 === */}
        {activeTab === 'profile' && (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4">👤 {t('user_name')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-sm">{t('user_name')}</span>
                  <p className="font-medium">{user?.username}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Role</span>
                  <p className="font-medium">{user?.role}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4">🔐 {t('change_password')}</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">{t('current_password')}</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">{t('new_password')}</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">{t('confirm_password')}</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                {passwordMsg.text && (
                  <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {passwordLoading ? t('loading') : t('save')}
                </button>
              </form>
            </div>
          </>
        )}

        {/* === Tab: 店铺信息 === */}
        {activeTab === 'shop' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-1">🏪 {t('shop_info') || '店铺信息'}</h3>
            <p className="text-xs text-slate-400 mb-5">{t('shop_info_hint') || '展示给顾客的店铺信息'}</p>

            <div className="space-y-4">
              {/* 电话 */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('shop_phone') || '联系电话'}</label>
                <input value={shopInfo.phone}
                  onChange={e => setShopInfo(s => ({ ...s, phone: e.target.value }))}
                  placeholder="02-xxx-xxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* 地址 - 三语 */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('address_zh') || '地址 (中文)'}</label>
                  <input value={shopInfo.address_zh}
                    onChange={e => setShopInfo(s => ({ ...s, address_zh: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('address_th') || '地址 (泰语)'}</label>
                  <input value={shopInfo.address_th}
                    onChange={e => setShopInfo(s => ({ ...s, address_th: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('address_en') || '地址 (英语)'}</label>
                  <input value={shopInfo.address_en}
                    onChange={e => setShopInfo(s => ({ ...s, address_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* 营业时间 - 三语 */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('hours_zh') || '营业时间 (中文)'}</label>
                  <input value={shopInfo.hours_zh}
                    onChange={e => setShopInfo(s => ({ ...s, hours_zh: e.target.value }))}
                    placeholder="周一至周六 09:00-18:00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('hours_th') || '营业时间 (泰语)'}</label>
                  <input value={shopInfo.hours_th}
                    onChange={e => setShopInfo(s => ({ ...s, hours_th: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('hours_en') || '营业时间 (英语)'}</label>
                  <input value={shopInfo.hours_en}
                    onChange={e => setShopInfo(s => ({ ...s, hours_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Line 二维码 */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('line_qr') || 'Line QR Code'}</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors">
                    {shopInfoUploading ? '...' : '📤'}{shopInfoUploading ? t('uploading') : t('upload_image')}
                    <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                  </label>
                  {shopInfo.line_qr_image && (
                    <span className="text-xs text-green-600">✓ {t('uploaded') || '已上传'}</span>
                  )}
                </div>
                {shopInfo.line_qr_image && (
                  <div className="mt-2">
                    <img
                      src={shopInfo.line_qr_image.startsWith('http') ? shopInfo.line_qr_image : `/api${shopInfo.line_qr_image}`}
                      alt="Line QR"
                      className="w-24 h-24 object-contain border rounded-lg bg-white"
                    />
                  </div>
                )}


              {/* 店名 */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">🏪 店铺名称</label>
                <input value={shopInfo.shop_name}
                  onChange={e => setShopInfo(s => ({ ...s, shop_name: e.target.value }))}
                  placeholder="例如：玫瑰花坊"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">🎨 店铺 Logo</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors">
                    {shopInfoUploading ? '...' : '📤'}{shopInfoUploading ? t('uploading') : t('upload_image')}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {shopInfo.logo_url && <span className="text-xs text-green-600">✓ 已上传</span>}
                </div>
                {shopInfo.logo_url && (
                  <div className="mt-2">
                    <img
                      src={shopInfo.logo_url.startsWith('http') ? shopInfo.logo_url : '/api' + shopInfo.logo_url}
                      alt="Logo"
                      className="w-16 h-16 object-contain border rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {shopInfoSaved && (
                <div className="p-2.5 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
                  ✓ {t('shop_info_saved') || '店铺信息已保存'}
                </div>
              )}

              <button onClick={saveShopInfo} disabled={shopInfoLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                {shopInfoLoading ? '...' : t('save')}
              </button>
            </div>
          </div>
        )}

        {/* === Tab: 通知配置 === */}
        {activeTab === 'notification' && (
          <>
            {/* SMTP */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-1">📧 {t('notification_config')}</h3>
              <p className="text-xs text-slate-400 mb-5">{t('notification_config_hint')}</p>

              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-slate-700">{t('smtp_settings')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${smtpStatus?.ok ? 'bg-green-100 text-green-700' : smtpStatus ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                  {smtpStatus?.ok ? t('channel_configured') : smtpStatus ? t('channel_not_configured') : t('smtp_not_configured')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('smtp_host')}</label>
                  <input value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('smtp_port')}</label>
                  <input value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('smtp_user')}</label>
                  <input value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {t('smtp_password')}
                    <span className="text-slate-400 ml-1">({t('smtp_password_hint')})</span>
                  </label>
                  <input type="password" value={smtp.password} onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">{t('from_email')}</label>
                <input value={smtp.from_email} onChange={e => setSmtp(s => ({ ...s, from_email: e.target.value }))}
                  placeholder="noreply@flowershop.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {smtpStatus && (
                <div className={`mb-3 p-2.5 rounded-lg text-sm ${smtpStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {smtpStatus.ok ? '✅ ' + smtpStatus.msg : '❌ ' + smtpStatus.msg}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={saveSmtp} disabled={smtpSaveLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {smtpSaveLoading ? '...' : smtpSaved ? '✓ ' + (t('success')) : t('save')}
                </button>
                <button onClick={testSmtp} disabled={smtpLoading}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm">
                  {smtpLoading ? '...' : t('smtp_test')}
                </button>
              </div>
            </div>

            {/* Printer */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-1">🖨️ {t('printer_config')}</h3>
              <p className="text-xs text-slate-400 mb-5">{t('printer_config_hint')}</p>

              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-slate-700">{t('feieyun_printer')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${printerStatus?.ok ? 'bg-green-100 text-green-700' : printerStatus ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                  {printerStatus?.ok ? t('printer_configured') : printerStatus ? t('printer_not_configured') : t('printer_unconfigured')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('feieyun_user')}</label>
                  <input
                    value={printer.feieyun_user}
                    onChange={e => setPrinter(p => ({ ...p, feieyun_user: e.target.value }))}
                    placeholder={t('feieyun_user_placeholder') || '飞鹅云用户名'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {t('feieyun_ukey')}
                    <span className="text-slate-400 ml-1">({t('feieyun_ukey_hint') || '不显示'})</span>
                  </label>
                  <input
                    type="password"
                    value={printer.feieyun_ukey}
                    onChange={e => setPrinter(p => ({ ...p, feieyun_ukey: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">{t('feieyun_sn')}</label>
                  <input
                    value={printer.feieyun_sn}
                    onChange={e => setPrinter(p => ({ ...p, feieyun_sn: e.target.value }))}
                    placeholder={t('feieyun_sn_placeholder') || '打印机 SN 编号'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printer.auto_print}
                    onChange={e => setPrinter(p => ({ ...p, auto_print: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-slate-700">{t('auto_print')}</span>
                  <p className="text-xs text-slate-400">{t('auto_print_hint')}</p>
                </div>
              </div>

              {printerStatus && (
                <div className={`mb-4 p-2.5 rounded-lg text-sm ${printerStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {printerStatus.ok ? '✅ ' + printerStatus.msg : '❌ ' + printerStatus.msg}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={savePrinter} disabled={printerSaveLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {printerSaveLoading ? '...' : printerSaved ? '✓ ' + t('success') : t('save')}
                </button>
                <button onClick={testPrinter} disabled={printerTesting}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm">
                  {printerTesting ? '...' : t('printer_test_print')}
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <p className="font-medium mb-1">{t('printer_help_title')}</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>{t('printer_help_step1')}</li>
                  <li>{t('printer_help_step2')}</li>
                  <li>{t('printer_help_step3')}</li>
                </ol>
              </div>
            </div>
          </>
        )}

        {/* === Tab: 系统 === */}
        {activeTab === 'system' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4">ℹ️ System Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Version</span>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <span className="text-slate-500">Database</span>
                <p className="font-medium">PostgreSQL</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
