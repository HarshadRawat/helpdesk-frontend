<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Users,
  ShieldCheck
} from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const workspaceLinks = computed(() => [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    active: route.path === '/dashboard' || route.path === '/',
  },
  {
    to: '/tickets',
    label: authStore.isEmployee ? 'My Requests' : 'Ticket Queue',
    icon: Ticket,
    active: route.path.startsWith('/tickets'),
  },
])

const adminLinks = computed(() => {
  const links = []
  if (authStore.isSupport || authStore.isAdmin) {
    links.push({
      to: '/workload',
      label: 'Team Capacity',
      icon: BarChart3,
      active: route.path === '/workload',
    })
  }
  if (authStore.isAdmin) {
    links.push(
      {
        to: '/admin/users',
        label: 'Staff Directory',
        icon: Users,
        active: route.path === '/admin/users',
      },
      {
        to: '/admin/audit-logs',
        label: 'Audit Trail',
        icon: ShieldCheck,
        active: route.path === '/admin/audit-logs',
      }
    )
  }
  return links
})
</script>

<template>
  <aside class="w-64 border-r border-slate-200/80 bg-white/70 backdrop-blur-md flex flex-col justify-between p-4 shrink-0">
    <div class="space-y-6">
      <!-- Workspace Group -->
      <div class="space-y-1">
        <div class="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Main Workspace
        </div>
        <router-link
          v-for="link in workspaceLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
            link.active
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          ]"
        >
          <component :is="link.icon" class="w-4 h-4 shrink-0" />
          <span>{{ link.label }}</span>
        </router-link>
      </div>

      <!-- Administration Group -->
      <div v-if="adminLinks.length > 0" class="space-y-1">
        <div class="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Governance & Teams
        </div>
        <router-link
          v-for="link in adminLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
            link.active
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          ]"
        >
          <component :is="link.icon" class="w-4 h-4 shrink-0" />
          <span>{{ link.label }}</span>
        </router-link>
      </div>
    </div>

    <!-- System Status Footer Card -->
    <div class="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/60 p-3.5 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-bold text-slate-800">Operational</span>
        </div>
        <span class="text-[10px] font-mono text-slate-400">v1.0-PROD</span>
      </div>
      <p class="text-[11px] text-slate-500 leading-snug">
        Connected to Spring Boot API on port 8080.
      </p>
    </div>
  </aside>
</template>
