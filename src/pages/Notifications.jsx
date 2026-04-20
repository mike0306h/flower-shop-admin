import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import {
  getNotificationChannels,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
  testNotificationChannel
} from '../services/api'

export default function Notifications() {
  const { t } = useI18n()
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState(null)
  const [formData, setFormData] = useState({
    value: '',
    name: '',
    recipient_name: '',
    enabled: true,
  })
  const [testResults, setTestResults] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    setLoading(true)
    try {
      const res = await getNotificationChannels({ page_size: 100 })
      setChannels(res.items)
    } catch (error) {
      console.error('Failed to load channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingChannel(null)
    setFormData({ value: '', name: '', recipient_name: '', enabled: true })
    setSubmitError('')
    setShowModal(true)
  }

  const openEditModal = (channel) => {
    setEditingChannel(channel)
    setFormData({
      value: channel.value || '',
      name: channel.name || '',
      recipient_name: channel.recipient_name || '',
      enabled: channel.enabled,
    })
    setSubmitError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSaving(true)
    try {
      if (!formData.value || !formData.recipient_name) {
        setSubmitError(t('please_fill_required') || '请填写邮箱地址和接收人姓名')
        return
      }
      if (!formData.value.includes('@')) {
        setSubmitError(t('invalid_email') || '请输入有效的邮箱地址')
        return
      }
      if (editingChannel) {
        await updateNotificationChannel(editingChannel.id, {
          name: formData.name,
          recipient_name: formData.recipient_name,
          enabled: formData.enabled,
          value: formData.value || '',
        })
      } else {
        await createNotificationChannel({
          type: 'email',
          value: formData.value,
          name: formData.name,
          recipient_name: formData.recipient_name,
        })
      }
      setShowModal(false)
      loadChannels()
    } catch (error) {
      console.error('Failed to save:', error)
      setSubmitError(error.response?.data?.detail || t('save_failed') || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (channel) => {
    try {
      await updateNotificationChannel(channel.id, { enabled: !channel.enabled })
      loadChannels()
    } catch (error) {
      console.error('Failed to toggle:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete_channel') || '确定要删除这个通知渠道吗？')) {
      try {
        await deleteNotificationChannel(id)
        loadChannels()
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  const handleTest = async (channel) => {
    const key = `testing_${channel.id}`
    setTestResults(prev => ({ ...prev, [key]: 'sending' }))
    try {
      const result = await testNotificationChannel(channel.id)
      setTestResults(prev => ({ ...prev, [key]: result }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [key]: { success: false, error: error.message || t('test_failed') || '测试失败' } }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 flex-wrap">
        <span className="text-sm text-slate-500">{t('total_channels') || '共'} {channels.length} {t('channels') || '个渠道'}</span>
        <button
          onClick={openAddModal}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <span>+ {t('add_channel')}</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <h3 className="font-semibold text-blue-800 mb-2">📢 {t('notification_guide') || '通知渠道说明'}</h3>
        <ul className="text-blue-700 space-y-1">
          <li>• {t('email_channel_desc') || '添加接收通知的邮箱地址，系统有新订单、预约时会发送邮件通知'}</li>
          <li>• {t('multi_channel_tip') || '支持同时配置多个邮箱，所有已启用的邮箱都会收到通知'}</li>
          <li>• {t('smtp_config_tip') || '发件邮箱凭证（ SMTP ）在「系统设置」页面配置'}</li>
        </ul>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('channel_type') || '类型'}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('recipients_line') || '接收人'}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('channel_alias') || '渠道别名'}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('email_address') || '邮箱地址'}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('channel_status') || '状态'}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('add_time') || '添加时间'}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('action') || '操作'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('loading') || '加载中...'}</td></tr>
            ) : channels.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('no_channels') || '暂无通知渠道，点击右上角添加'}</td></tr>
            ) : (
              channels.map(channel => {
                const testKey = `testing_${channel.id}`
                const testResult = testResults[testKey]
                return (
                  <tr key={channel.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        📧 {t('email_channel') || '邮箱'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {channel.recipient_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {channel.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {channel.value}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(channel)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          channel.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {channel.enabled ? '✅ ' + (t('enabled') || '启用') : '❌ ' + (t('disabled') || '禁用')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {channel.created_at ? new Date(channel.created_at).toLocaleDateString('zh-CN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTest(channel)}
                          disabled={testResult === 'sending'}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            testResult === 'sending'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {testResult === 'sending' ? (t('sending') || '发送中...') : '🧪 ' + (t('test') || '测试')}
                        </button>
                        <button
                          onClick={() => openEditModal(channel)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          {t('edit') || '编辑'}
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          {t('delete') || '删除'}
                        </button>
                      </div>
                      {testResult && !testResult.success && (
                        <p className="text-xs text-red-500 mt-1">{testResult.error || t('test_failed') || '测试失败'}</p>
                      )}
                      {testResult && testResult.success && (
                        <p className="text-xs text-green-600 mt-1">✅ {testResult.message || t('test_success') || '发送成功'}</p>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {editingChannel ? (t('edit_channel_title') || '编辑渠道') : (t('add_channel_title') || '添加通知渠道')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Recipient name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('recipient_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  placeholder={t('recipient_name_hint') || '如：店长 Sarah、店员小张'}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">{t('recipient_name_required') || '必填，用于标识通知发到谁'}</p>
              </div>

              {/* Channel alias */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('channel_alias')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('channel_alias_hint') || '方便识别此渠道（选填）'}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Email value */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('email_address')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="admin@flowershop.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">{t('email_notification_tip') || '用于接收订单、预约、联系表单通知'}</p>
              </div>

              {/* Status toggle in edit mode */}
              {editingChannel && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      formData.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {formData.enabled ? '✅ ' + (t('enabled') || '启用中') : '❌ ' + (t('disabled') || '已禁用')}
                  </button>
                  <span className="text-sm text-slate-500">{t('click_to_toggle_status') || '点击切换状态'}</span>
                </div>
              )}

              {/* Error message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('cancel') || '取消'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (t('saving') || '保存中...') : (t('save') || '保存')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
