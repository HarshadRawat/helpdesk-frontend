import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TicketsView from '@/views/TicketsView.vue'
import TicketDetailView from '@/views/TicketDetailView.vue'
import AgentWorkloadView from '@/views/AgentWorkloadView.vue'
import AdminUsersView from '@/views/AdminUsersView.vue'
import AdminAuditLogsView from '@/views/AdminAuditLogsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: TicketsView,
      },
      {
        path: 'tickets/:id',
        name: 'TicketDetail',
        component: TicketDetailView,
      },
      {
        path: 'workload',
        name: 'AgentWorkload',
        component: AgentWorkloadView,
        meta: { roles: ['AGENT', 'ROLE_AGENT', 'SUPPORT', 'ROLE_SUPPORT', 'ADMIN', 'ROLE_ADMIN'] },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: AdminUsersView,
        meta: { roles: ['ADMIN', 'ROLE_ADMIN'] },
      },
      {
        path: 'admin/audit-logs',
        name: 'AdminAuditLogs',
        component: AdminAuditLogsView,
        meta: { roles: ['ADMIN', 'ROLE_ADMIN'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }

    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const userRole = String(authStore.user?.role || '').replace('ROLE_', '').toUpperCase()
      const allowedRoles = to.meta.roles.map((r) => String(r).replace('ROLE_', '').toUpperCase())

      const hasPermission =
        allowedRoles.includes(userRole) ||
        (allowedRoles.includes('SUPPORT') && userRole === 'AGENT') ||
        (allowedRoles.includes('AGENT') && userRole === 'SUPPORT')

      if (!hasPermission) {
        next('/dashboard')
        return
      }
    }
  }

  if (to.matched.some((record) => record.meta.guestOnly)) {
    if (authStore.isAuthenticated) {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router
