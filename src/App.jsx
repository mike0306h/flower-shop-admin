import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Coupons from './pages/Coupons'
import Users from './pages/Users'
import Appointments from './pages/Appointments'
import Contacts from './pages/Contacts'
import Reviews from './pages/Reviews'
import Reports from './pages/Reports'
import AdminLogs from './pages/AdminLogs'
import Export from './pages/Export'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Categories from './pages/Categories'
import StaffManagement from './pages/StaffManagement'

// ============ 路由守卫 ============

// 已登录才能访问
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

// 需要指定权限才能访问
function PermissionRoute({ module, action = 'read', children }) {
  const { isAuthenticated, hasPermission } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!hasPermission(module, action)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p className="text-6xl mb-4">🚫</p>
        <p className="text-lg">没有权限访问此页面</p>
        <p className="text-sm text-slate-400 mt-2">
          需要权限: {module}:{action}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm"
        >
          返回上一页
        </button>
      </div>
    )
  }
  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />

        {/* 订单 */}
        <Route path="orders" element={
          <PermissionRoute module="orders" action="read">
            <Orders />
          </PermissionRoute>
        } />

        {/* 商品 */}
        <Route path="products" element={
          <PermissionRoute module="products" action="read">
            <Products />
          </PermissionRoute>
        } />

        <Route path="categories" element={
          <PermissionRoute module="categories" action="read">
            <Categories />
          </PermissionRoute>
        } />

        <Route path="coupons" element={
          <PermissionRoute module="coupons" action="read">
            <Coupons />
          </PermissionRoute>
        } />

        <Route path="reviews" element={
          <PermissionRoute module="reviews" action="read">
            <Reviews />
          </PermissionRoute>
        } />

        <Route path="reports" element={
          <PermissionRoute module="reports" action="read">
            <Reports />
          </PermissionRoute>
        } />

        <Route path="admin-logs" element={
          <PermissionRoute module="admin_logs" action="read">
            <AdminLogs />
          </PermissionRoute>
        } />

        <Route path="export" element={
          <PermissionRoute module="export" action="read">
            <Export />
          </PermissionRoute>
        } />

        <Route path="notifications" element={
          <PermissionRoute module="notifications" action="read">
            <Notifications />
          </PermissionRoute>
        } />

        <Route path="users" element={
          <PermissionRoute module="users" action="read">
            <Users />
          </PermissionRoute>
        } />

        <Route path="appointments" element={
          <PermissionRoute module="appointments" action="read">
            <Appointments />
          </PermissionRoute>
        } />

        <Route path="contacts" element={
          <PermissionRoute module="contacts" action="read">
            <Contacts />
          </PermissionRoute>
        } />

        <Route path="settings" element={
          // settings 页面所有人都能进，但内部 Tab 按角色过滤
          <Settings />
        } />

        {/* 店员管理 — 仅 super_admin */}
        <Route path="staff-management" element={
          <PermissionRoute module="staff" action="read">
            <StaffManagement />
          </PermissionRoute>
        } />

        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p className="text-6xl mb-4">404</p>
            <p className="text-lg">页面不存在</p>
          </div>
        } />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <AppRoutes />
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
