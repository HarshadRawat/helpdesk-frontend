<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'
import StatusBadge from '@/components/StatusBadge.vue'
import SlaBadge from '@/components/SlaBadge.vue'
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Ticket as TicketIcon,
  Calendar
} from 'lucide-vue-next'
import type { TicketSummary, Ticket, Page } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const summary = ref<TicketSummary | null>(null)
const recentTickets = ref<Ticket[]>([])
const isLoading = ref(true)

const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
})

const fetchData = async () => {
  isLoading.value = true
  try {
    const [summaryResult, ticketsResult] = await Promise.allSettled([
      apiClient.get<TicketSummary>('/tickets/summary'),
      apiClient.get<Page<Ticket>>('/tickets?page=0&size=5&sort=createdAt,desc'),
    ])

    if (ticketsResult.status === 'fulfilled') {
      recentTickets.value = ticketsResult.value.data.content
    } else {
      console.error('Failed to load recent tickets', ticketsResult.reason)
    }

    if (summaryResult.status === 'fulfilled') {
      summary.value = summaryResult.value.data
    } else {
      console.warn('Failed to fetch summary, computing from accessible tickets', summaryResult.reason)
      const openCount = recentTickets.value.filter(t => t.status === 'OPEN').length
      const inProgressCount = recentTickets.value.filter(t => t.status === 'IN_PROGRESS').length
      const resolvedCount = recentTickets.value.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length
      const breachedCount = recentTickets.value.filter(t => t.slaBreached).length

      summary.value = {
        totalTickets: recentTickets.value.length,
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        resolvedTickets: resolvedCount,
        breachedSlaTickets: breachedCount,
        slaBreachedTickets: breachedCount,
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard data', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Greeting Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 shadow-lg shadow-slate-950/10 border border-slate-800">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ currentDate }}</span>
            <span class="text-slate-600">•</span>
            <span>Enterprise Workspace</span>
          </div>
          <h2 class="text-2xl font-extrabold tracking-tight text-white mt-1.5">
            Welcome back, {{ authStore.user?.fullName }}
          </h2>
          <p class="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            <span v-if="authStore.isEmployee">
              Submit hardware, network, or access requests and monitor your active ticket resolutions in real time.
            </span>
            <span v-else-if="authStore.isSupport">
              IT Support Queue: Triage incoming requests, respond to incidents, and maintain customer SLA compliance.
            </span>
            <span v-else>
              ITSM Governance Center: Cross-department ticket distribution, staff capacity, and immutable audit trails.
            </span>
          </p>
        </div>

        <div class="flex items-center gap-2 self-start md:self-auto">
          <router-link
            to="/tickets"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all"
          >
            <span>Browse Queue</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>

      <!-- Subtle background radial glow -->
      <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Metrics Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Open Tickets -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Open</span>
          <div class="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-1 ring-blue-600/15">
            <Inbox class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
          {{ summary?.openTickets ?? 0 }}
        </div>
        <div class="mt-1 text-xs text-slate-400 font-medium">Awaiting triage & pickup</div>
      </div>

      <!-- In Progress -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
          <div class="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-600/15">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
          {{ summary?.inProgressTickets ?? 0 }}
        </div>
        <div class="mt-1 text-xs text-slate-400 font-medium">Active investigation</div>
      </div>

      <!-- Resolved -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
          <div class="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-600/15">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
          {{ summary?.resolvedTickets ?? 0 }}
        </div>
        <div class="mt-1 text-xs text-slate-400 font-medium">Closed & confirmed</div>
      </div>

      <!-- SLA Breached -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Breached</span>
          <div class="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-600/20">
            <AlertOctagon class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 text-3xl font-extrabold text-rose-600 tracking-tight">
          {{ summary?.breachedSlaTickets ?? summary?.slaBreachedTickets ?? 0 }}
        </div>
        <div class="mt-1 text-xs text-rose-500 font-medium">Critical attention needed</div>
      </div>
    </div>

    <!-- Recent Activity / Queue Section -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-900 tracking-tight">
            {{ authStore.isEmployee ? 'My Recent Requests' : 'Live Ticket Queue' }}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Showing newest active support cases</p>
        </div>
        <router-link
          to="/tickets"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          <span>View all tickets</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>

      <div v-if="isLoading" class="p-16 text-center text-slate-400 text-xs">
        Loading requests...
      </div>

      <div v-else-if="recentTickets.length === 0" class="p-16 text-center space-y-3">
        <div class="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-500/10">
          <TicketIcon class="w-6 h-6" />
        </div>
        <div class="font-bold text-slate-900 text-sm">No Active Tickets</div>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          There are currently no tickets in your queue. If you have an IT issue or equipment need, click "New Request".
        </p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="ticket in recentTickets"
          :key="ticket.id"
          @click="router.push(`/tickets/${ticket.id}`)"
          class="p-4 sm:px-6 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
        >
          <div class="space-y-1.5 min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                #{{ ticket.id }}
              </span>
              <span class="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                {{ ticket.title }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>By <strong class="text-slate-700 font-semibold">{{ ticket.createdByName }}</strong></span>
              <span v-if="ticket.assignedToName" class="text-slate-400">•</span>
              <span v-if="ticket.assignedToName">
                Assigned to <strong class="text-slate-700 font-semibold">{{ ticket.assignedToName }}</strong>
              </span>
              <span class="text-slate-400">•</span>
              <span class="text-slate-400">{{ new Date(ticket.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <SlaBadge :due-at="ticket.slaDueAt" :breached="ticket.slaBreached" />
            <StatusBadge :priority="ticket.priority" />
            <StatusBadge :status="ticket.status" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
