<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'
import { Ticket, BarChart3, CheckCircle2 } from 'lucide-vue-next'
import type { AgentWorkload } from '@/types'

const workload = ref<AgentWorkload[]>([])
const isLoading = ref(true)

const fetchWorkload = async () => {
  isLoading.value = true
  try {
    const { data } = await apiClient.get<AgentWorkload[]>('/tickets/agent-workload')
    workload.value = data
  } catch (err) {
    console.error('Failed to load workload', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchWorkload()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-indigo-600" />
          <span>IT Support Team Capacity</span>
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Real-time workload distribution and active ticket allocation across technical staff
        </p>
      </div>

      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-600/20 w-fit">
        <CheckCircle2 class="w-3.5 h-3.5" />
        <span>Live Queue Monitoring</span>
      </div>
    </div>

    <div v-if="isLoading" class="p-16 text-center text-slate-400 text-xs">
      Loading workload metrics...
    </div>

    <div v-else-if="workload.length === 0" class="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto ring-1 ring-indigo-500/10">
        <CheckCircle2 class="w-6 h-6" />
      </div>
      <div class="font-bold text-slate-900 text-sm">All Queues Clear</div>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        There are currently no active open or in-progress tickets assigned to agents.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="agent in workload"
        :key="agent.agentId"
        class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md hover:border-slate-300 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center ring-1 ring-indigo-600/15">
              {{ agent.agentName.charAt(0) }}
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm tracking-tight">{{ agent.agentName }}</div>
              <div class="text-[11px] text-slate-400">
                {{ agent.email || `${agent.agentName.toLowerCase().replace(/\s+/g, '.')}@example.com` }}
              </div>
            </div>
          </div>

          <span
            :class="[
              'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1',
              (agent.assignedTickets ?? agent.activeTicketsCount ?? 0) <= 2
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                : 'bg-amber-50 text-amber-700 ring-amber-600/20'
            ]"
          >
            {{ (agent.assignedTickets ?? agent.activeTicketsCount ?? 0) <= 2 ? 'Optimal Load' : 'High Load' }}
          </span>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5 text-slate-500 font-medium">
            <Ticket class="w-3.5 h-3.5 text-slate-400" />
            <span>Active Support Tickets</span>
          </div>
          <span class="text-base font-extrabold text-slate-900">
            {{ agent.assignedTickets ?? agent.activeTicketsCount ?? 0 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
