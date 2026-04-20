import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // 校验 token 格式（JWT: header.payload.signature）
  const isValidToken = (t) => {
    if (!t) return false
    const parts = t.split('.')
    return parts.length === 3 && parts.every(p => p.length > 0)
  }

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('admin_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('admin_token')
    return isValidToken(t) ? t : null
  })
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('admin_permissions')
    return saved ? JSON.parse(saved) : []
  })

  const login = async (username, password) => {
    const res = await apiLogin(username, password)
    setToken(res.token)
    setUser(res.user)
    const perms = res.permissions || []
    setPermissions(perms)
    localStorage.setItem('admin_token', res.token)
    localStorage.setItem('admin_user', JSON.stringify(res.user))
    localStorage.setItem('admin_permissions', JSON.stringify(perms))
    return res
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setPermissions([])
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_permissions')
  }

  // 检查是否有指定权限
  const hasPermission = (module, action = 'read') => {
    return permissions.includes(`${module}:${action}`)
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, permissions, login, logout, isAuthenticated, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
