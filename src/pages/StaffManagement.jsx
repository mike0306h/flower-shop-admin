import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

const ROLE_OPTIONS = [
  { value: 'admin', label_zh: '管理员', label_th: 'ผู้ดูแล', label_en: 'Admin' },
  { value: 'staff', label_zh: '店员', label_th: 'พนักงาน', label_en: 'Staff' },
  { value: 'viewer', label_zh: '查看者', label_th: 'ผู้ชม', label_en: 'Viewer' },
]

function getRoleLabel(role, lang = 'zh') {
  const r = ROLE_OPTIONS.find(r => r.value === role)
  return r ? r[`label_${lang}`] || r.label_zh : role
}

export default function StaffManagement() {
  const { t, lang } = useI18n()
  const { token } = useAuth()
  const [staffList, setStaffList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // 筛选
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [keyword, setKeyword] = useState('')

  // 弹窗
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // 新建/编辑表单
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    department: '',
    role: 'staff',
  })

  // 重置密码弹窗
  const [resetPwdStaff, setResetPwdStaff] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [resetPwdLoading, setResetPwdLoading] = useState(false)

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        page_size: pageSize,
      })
      if (filterRole) params.append('role', filterRole)
      if (filterActive !== '') params.append('is_active', filterActive)
      if (keyword) params.append('keyword', keyword)

      const res = await fetch(`/api/admin-users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setStaffList(data.items)
        setTotal(data.total)
      } else {
        console.error('获取店员列表失败:', data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [page, filterRole, filterActive, keyword])

  const openCreate = () => {
    setEditingStaff(null)
    setForm({ username: '', password: '', name: '', phone: '', department: '', role: 'staff' })
    setModalError('')
    setShowModal(true)
  }

  const openEdit = (staff) => {
    setEditingStaff(staff)
    setForm({
      username: staff.username,
      password: '',
      name: staff.name || '',
      phone: staff.phone || '',
      department: staff.department || '',
      role: staff.role,
    })
    setModalError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setModalLoading(true)
    setModalError('')
    try {
      const isEdit = !!editingStaff
      const url = isEdit
        ? `/api/admin-users/${editingStaff.id}`
        : '/api/admin-users'
      const body = isEdit
        ? { role: form.role, name: form.name, phone: form.phone, department: form.department }
        : { ...form }

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setShowModal(false)
        fetchStaff()
      } else {
        setModalError(data.detail || '保存失败')
      }
    } catch (e) {
      setModalError('网络错误')
    } finally {
      setModalLoading(false)
    }
  }

  const handleDelete = async (staff) => {
    if (!confirm(`确认删除店员 "${staff.name || staff.username}" 吗？`)) return
    try {
      const res = await fetch(`/api/admin-users/${staff.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchStaff()
      } else {
        const data = await res.json()
        alert(data.detail || '删除失败')
      }
    } catch (e) {
      alert('网络错误')
    }
  }

  const handleToggleActive = async (staff) => {
    try {
      const res = await fetch(`/api/admin-users/${staff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !staff.is_active }),
      })
      if (res.ok) fetchStaff()
    } catch (e) {
      console.error(e)
    }
  }

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 8) {
      alert('密码至少8位，需包含字母和数字')
      return
    }
    setResetPwdLoading(true)
    try {
      const res = await fetch(`/api/admin-users/${resetPwdStaff.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPwd }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('密码已重置')
        setResetPwdStaff(null)
        setNewPwd('')
      } else {
        alert(data.detail || '重置失败')
      }
    } catch (e) {
      alert('网络错误')
    } finally {
      setResetPwdLoading(false)
    }
  }

  const roleColor = (role) => {
    if (role === 'super_admin') return 'bg-purple-100 text-purple-700'
    if (role === 'admin') return 'bg-blue-100 text-blue-700'
    if (role === 'staff') return 'bg-green-100 text-green-700'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">👤 {t('staff_management') || '店员管理'}</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 人
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
        >
          + {t('add_staff') || '添加店员'}
        </button>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4 flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(1) }}
          placeholder={t('search_placeholder') || '搜索用户名/姓名/手机号...'}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
        <select
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="staff">店员</option>
          <option value="viewer">查看者</option>
        </select>
        <select
          value={filterActive}
          onChange={e => { setFilterActive(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
        >
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
        <button
          onClick={fetchStaff}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
        >
          🔍 搜索
        </button>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-medium">姓名</th>
              <th className="text-left px-4 py-3 font-medium">用户名</th>
              <th className="text-left px-4 py-3 font-medium">角色</th>
              <th className="text-left px-4 py-3 font-medium">部门</th>
              <th className="text-left px-4 py-3 font-medium">手机号</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">最后登录</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  {t('loading') || '加载中...'}
                </td>
              </tr>
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  {t('no_data') || '暂无数据'}
                </td>
              </tr>
            ) : staffList.map(staff => (
              <tr key={staff.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{staff.name || '-'}</td>
                <td className="px-4 py-3 text-slate-500">{staff.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${roleColor(staff.role)}`}>
                    {staff.role === 'super_admin' ? '超级管理员'
                      : staff.role === 'admin' ? '管理员'
                      : staff.role === 'staff' ? '店员'
                      : '查看者'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{staff.department || '-'}</td>
                <td className="px-4 py-3 text-slate-500">{staff.phone || '-'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(staff)}
                    className={`px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors ${
                      staff.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {staff.is_active ? '✅ 启用' : '🚫 禁用'}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {staff.last_login_at
                    ? new Date(staff.last_login_at).toLocaleString('zh-CN', { hour12: false })
                    : '从未登录'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(staff)}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => { setResetPwdStaff(staff); setNewPwd('') }}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                    >
                      重置密码
                    </button>
                    {staff.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDelete(staff)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              第 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} 条，共 {total} 条
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40"
              >
                上一页
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold">
                {editingStaff ? '✏️ 编辑店员' : '➕ 添加店员'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  disabled={!!editingStaff}
                  placeholder="登录用户名"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  required
                />
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">
                    密码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="至少8位，含字母和数字"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-600 mb-1">姓名</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="店员真实姓名"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">部门</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="如：销售部"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">手机号</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="081-xxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">角色</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'admin', label: '管理员', desc: '除店员管理和系统设置外所有权限' },
                    { value: 'staff', label: '店员', desc: '订单、商品、预约等日常业务' },
                    { value: 'viewer', label: '查看者', desc: '仅查看，不允许修改' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        form.role === opt.value
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={modalLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {modalLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {resetPwdStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold">🔑 重置密码</h3>
              <p className="text-sm text-slate-500 mt-1">
                为 {resetPwdStaff.name || resetPwdStaff.username} 重置密码
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">新密码</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="至少8位，需包含字母和数字"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setResetPwdStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleResetPwd}
                disabled={resetPwdLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {resetPwdLoading ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
