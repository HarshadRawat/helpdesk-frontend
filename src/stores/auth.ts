import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import type { User, LoginResponse, Role } from '@/types'

function parseJwt(token: string): { sub?: string; role?: Role } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null
  )

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isEmployee = computed(() => {
    const r = String(user.value?.role || '')
    return r.includes('CUSTOMER') || r.includes('USER')
  })
  const isSupport = computed(() => {
    const r = String(user.value?.role || '')
    return r.includes('AGENT') || r.includes('SUPPORT')
  })
  const isAdmin = computed(() => {
    const r = String(user.value?.role || '')
    return r.includes('ADMIN')
  })
  const role = computed<Role | undefined>(() => user.value?.role)

  const setAuth = (data: LoginResponse, emailInput?: string) => {
    const accessToken = data.accessToken || data.token || ''
    token.value = accessToken
    refreshToken.value = data.refreshToken

    const payload = parseJwt(accessToken)
    const assignedRole = (payload?.role as Role) || 'CUSTOMER'
    const id = payload?.sub ? Number(payload.sub) : 1
    const email = emailInput || user.value?.email || 'user@example.com'
    const rawName = email.split('@')[0].replace(/[._]/g, ' ')
    const fullName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    const userObj: User = {
      id,
      fullName: user.value?.fullName || fullName,
      email,
      role: assignedRole,
      department: assignedRole === 'ADMIN' ? 'IT Operations' : assignedRole === 'AGENT' ? 'Support Tier 1' : 'General',
    }

    user.value = userObj

    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(userObj))
  }

  const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    })
    setAuth(response.data, email)
    return user.value!
  }

  const logout = async () => {
    if (refreshToken.value) {
      try {
        await apiClient.post('/auth/logout', { refreshToken: refreshToken.value })
      } catch {
        // Ignore logout network failure on client exit
      }
    }
    token.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return {
    token,
    refreshToken,
    user,
    role,
    isAuthenticated,
    isEmployee,
    isSupport,
    isAdmin,
    login,
    logout,
    setAuth,
  }
})
