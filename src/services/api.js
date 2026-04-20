import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 导出 api 实例供其他模块使用
export { api }

// 请求拦截器 - 添加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // 添加语言 header
  const lang = localStorage.getItem('admin_lang') || 'zh'
  config.headers['Accept-Language'] = lang
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      // 提示用户登录已过期
      if (window.location.pathname !== '/login') {
        alert('登录已过期，请重新登录')
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password })
export const getMe = () => api.get('/auth/me')

// Stats
export const getStats = () => api.get('/stats')
export const getSalesChart = (days = 7) => api.get(`/stats/sales-chart?days=${days}`)
export const getLowStockAlerts = () => api.get('/stats/low-stock')

// Reports
export const getSalesReport = (period) => api.get(`/reports/sales-report?period=${period}`)
export const getSalesByCategory = (days) => api.get(`/reports/sales-by-category?days=${days}`)
export const getTopProducts = (days, limit) => api.get(`/reports/top-products?days=${days}&limit=${limit}`)
export const getCustomerStats = () => api.get('/reports/customer-stats')
export const getSalesComparison = () => api.get('/reports/sales-comparison')

// Admin Logs
export const getAdminLogs = (params) => api.get('/admin-logs', { params })
export const getLogStats = (days) => api.get(`/admin-logs/stats?days=${days}`)
export const cleanupLogs = (days) => api.delete(`/admin-logs/cleanup?days=${days}`)

// Orders
export const getOrders = (params) => api.get('/orders', { params })
export const getOrder = (id) => api.get(`/orders/${id}`)
export const updateOrder = (id, data) => api.patch(`/orders/${id}`, data)
export const createOrder = (data) => api.post('/orders', data)
export const deleteOrder = (id) => api.delete(`/orders/${id}`)

// Products
export const getProducts = (params) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

// Users
export const getUsers = (params) => api.get('/users', { params })
export const getUser = (id) => api.get(`/users/${id}`)
export const getUserAddresses = (id) => api.get(`/users/${id}/addresses`)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const adjustUserPoints = (id, points, reason) => api.post(`/users/${id}/points`, null, { params: { points, reason } })
export const resetUserPassword = (id, newPassword) => api.post(`/users/${id}/reset-password`, null, { params: { new_password: newPassword } })
export const createAddress = (data) => api.post('/users/addresses', data)
export const updateAddress = (id, data) => api.put(`/users/addresses/${id}`, data)
export const deleteAddress = (id) => api.delete(`/users/addresses/${id}`)
export const getUserOrders = (userId, params) => api.get(`/users/${userId}/orders`, { params })

// Appointments
export const getAppointments = (params) => api.get('/appointments', { params })
export const getAppointment = (id) => api.get(`/appointments/${id}`)
export const updateAppointment = (id, data) => api.patch(`/appointments/${id}`, data)
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`)

// Contacts
export const getContacts = (params) => api.get('/contacts', { params })
export const updateContact = (id, data) => api.patch(`/contacts/${id}`, data)
export const deleteContact = (id) => api.delete(`/contacts/${id}`)

// Coupons
export const getCoupons = (params) => api.get('/coupons', { params })
export const createCoupon = (data) => api.post('/coupons', data)
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`)

// i18n
export const getTranslations = (lang) => api.get(`/i18n?lang=${lang}`)

// Public APIs (no auth needed)
export const submitContact = (data) => api.post('/contacts/public', data)

// Categories
export const getCategories = (params) => api.get('/categories', { params })
export const createCategory = (data) => api.post('/categories', data)
export const updateCategory = (id, data) => api.put('/categories/' + id, data)
export const deleteCategory = (id) => api.delete('/categories/' + id)

// Shop Info
export const getShopInfo = () => api.get('/shop-info')
export const updateShopInfo = (data) => api.put('/shop-info', data)

// Notification Channels
export const getNotificationChannels = (params) => api.get('/notifications/channels', { params })
export const createNotificationChannel = (data) => api.post('/notifications/channels', data)
export const updateNotificationChannel = (id, data) => api.patch('/notifications/channels/' + id, data)
export const deleteNotificationChannel = (id) => api.delete('/notifications/channels/' + id)
export const testNotificationChannel = (id, message) => api.post('/notifications/channels/test', { channel_id: id, test_message: message })

// Upload
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 默认导出（兼容 import api from '...' 语法）
export default api
