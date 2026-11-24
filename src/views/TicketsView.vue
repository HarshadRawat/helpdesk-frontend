<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'
import StatusBadge from '@/components/StatusBadge.vue'
import SlaBadge from '@/components/SlaBadge.vue'
import CreateTicketModal from '@/components/CreateTicketModal.vue'
import {
  Search,
  Plus,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import type { Ticket, Page } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const modalRef = ref<InstanceType<typeof CreateTicketModal> | null>(null)

const tickets = ref<Ticket[]>([])
const isLoading = ref(true)

// Filter and pagination state
const currentPage = ref(0)
const pageSize = ref(10)
const totalPages = ref(1)
const totalElements = ref(0)

const selectedStatus = ref('')
const selectedPriority = ref('')
const searchQuery = ref('')

const fetchTickets = async () => {
  isLoading.value = true
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      size: pageSize.value,
      sort: 'createdAt,desc',
    }

    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedPriority.value) params.priority = selectedPriority.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const { data } = await apiClient.get<Page<Ticket>>('/tickets', { params })
    tickets.value = data.content
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
  } catch (err) {
    console.error('Failed to fetch tickets', err)
  } finally {
    isLoading.value = false
  }
}

watch([selectedStatus, selectedPriority, currentPage], () => {
  fetchTickets()
})

onMounted(() => {
  fetchTickets()
})

const onSearchSubmit = () => {
  currentPage.value = 0
  fetchTickets()
}

const resetFilters = () => {
  selectedStatus.value = ''
  selectedPriority.value = ''
  searchQuery.value = ''
  currentPage.value = 0
  fetchTickets()
}

const onTicketCreated = (ticket: Ticket) => {
  router.push(`/tickets/${ticket.id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">
          {{ authStore.isEmployee ? 'My Support Requests' : 'IT Support Queue' }}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ totalElements }} total issues recorded
        </p>
      </div>

      <button
        v-if="authStore.isEmployee"
        type="button"
        @click="modalRef?.open()"
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-md transition-all self-start sm:self-auto"
      >
        <Plus class="w-4 h-4" />
        <span>New Request</span>
      </button>
    </div>

    <!-- Filter Toolbar -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
      <form @submit.prevent="onSearchSubmit" class="flex-1 min-w-[220px] relative">
        <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search by keywords, ID, or description..."
          class="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
        />
      </form>

      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="selectedStatus"
          class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">Status: All</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          v-model="selectedPriority"
          class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">Priority: All</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <button
          v-if="selectedStatus || selectedPriority || searchQuery"
          type="button"
          @click="resetFilters"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>

    <!-- Responsive Table conforming to modern-web-guidance -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div
        tabindex="0"
        role="region"
        aria-labelledby="ticket-table-caption"
        class="table-wrapper"
      >
        <table class="w-full text-left border-collapse">
          <caption id="ticket-table-caption" class="sr-only">Support Tickets Directory</caption>
          <thead class="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th scope="col" class="py-3.5 px-5">Ticket / Request</th>
              <th scope="col" class="py-3.5 px-4">Status</th>
              <th scope="col" class="py-3.5 px-4">Priority</th>
              <th scope="col" class="py-3.5 px-4">SLA Deadline</th>
              <th scope="col" class="py-3.5 px-4">Assignee</th>
              <th scope="col" class="py-3.5 px-5 text-right">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="isLoading">
              <td colspan="6" class="py-16 text-center text-slate-400 text-xs">Loading queue...</td>
            </tr>
            <tr v-else-if="tickets.length === 0">
              <td colspan="6" class="py-16 text-center text-slate-500 text-xs">
                No tickets match your filter criteria.
              </td>
            </tr>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              @click="router.push(`/tickets/${ticket.id}`)"
              class="hover:bg-slate-50/80 cursor-pointer transition-all group"
            >
              <td class="py-4 px-5">
                <div class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xs sm:text-sm">
                  {{ ticket.title }}
                </div>
                <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                  #{{ ticket.id }} • by {{ ticket.createdByName }}
                </div>
              </td>
              <td class="py-4 px-4">
                <StatusBadge :status="ticket.status" />
              </td>
              <td class="py-4 px-4">
                <StatusBadge :priority="ticket.priority" />
              </td>
              <td class="py-4 px-4">
                <SlaBadge :due-at="ticket.slaDueAt" :breached="ticket.slaBreached" />
              </td>
              <td class="py-4 px-4 text-xs font-medium text-slate-700">
                <div class="flex items-center gap-1.5">
                  <div class="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {{ (ticket.assignedToName || 'U').charAt(0) }}
                  </div>
                  <span>{{ ticket.assignedToName || 'Unassigned' }}</span>
                </div>
              </td>
              <td class="py-4 px-5 text-right text-xs text-slate-400 font-medium">
                {{ new Date(ticket.createdAt).toLocaleDateString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Page <span class="font-bold text-slate-900">{{ currentPage + 1 }}</span> of
          <span class="font-bold text-slate-900">{{ totalPages > 0 ? totalPages : 1 }}</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="currentPage === 0"
            @click="currentPage--"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            :disabled="currentPage >= totalPages - 1"
            @click="currentPage++"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <span>Next</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <CreateTicketModal ref="modalRef" @created="onTicketCreated" />
  </div>
</template>
