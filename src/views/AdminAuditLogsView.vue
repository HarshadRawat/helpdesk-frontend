<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'
import { Eye, X, Terminal } from 'lucide-vue-next'
import type { AuditLog } from '@/types'

const auditLogs = ref<AuditLog[]>([])
const isLoading = ref(true)
const selectedLog = ref<AuditLog | null>(null)
const logDetailsModal = ref<HTMLDialogElement | null>(null)

const fetchAuditLogs = async () => {
  isLoading.value = true
  try {
    // In our backend, we can query ticket audit history or cleanup
    // We also can fetch from /audit/tickets/1 or all seeded audit logs
    const { data } = await apiClient.get<AuditLog[]>('/audit')
    auditLogs.value = data
  } catch (err) {
    console.error('Failed to fetch audit logs', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAuditLogs()
})

const viewDetails = (log: AuditLog) => {
  selectedLog.value = log
  logDetailsModal.value?.showModal()
}

const closeDetails = () => {
  logDetailsModal.value?.close()
}

const formatJson = (str?: string) => {
  if (!str) return 'No details recorded.'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-slate-900 tracking-tight">System Compliance Audit Ledger</h2>
      <p class="text-xs text-slate-500 mt-0.5">
        Immutable, tamper-evident audit records capturing entity lifecycle transitions and staff actions
      </p>
    </div>

    <!-- Audit Logs Table conforming to modern-web-guidance -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div tabindex="0" role="region" aria-labelledby="audit-table-caption" class="table-wrapper">
        <table class="w-full text-left border-collapse">
          <caption id="audit-table-caption" class="sr-only">Compliance Audit Logs</caption>
          <thead class="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th scope="col" class="py-3.5 px-5">Timestamp</th>
              <th scope="col" class="py-3.5 px-4">Action</th>
              <th scope="col" class="py-3.5 px-4">Target Entity</th>
              <th scope="col" class="py-3.5 px-4">Actor</th>
              <th scope="col" class="py-3.5 px-5 text-right">State Snapshot</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="isLoading">
              <td colspan="5" class="py-16 text-center text-slate-400 text-xs">Loading audit ledger...</td>
            </tr>
            <tr v-else-if="auditLogs.length === 0">
              <td colspan="5" class="py-16 text-center text-slate-500 text-xs">No audit records found.</td>
            </tr>
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-5 text-xs font-mono text-slate-500">
                {{ new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString() }}
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700 ring-1 ring-slate-400/20">
                  {{ log.action }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-xs font-semibold text-slate-800">
                {{ log.entityType }} #{{ log.entityId }}
              </td>
              <td class="py-3.5 px-4 text-xs font-medium text-slate-700">
                {{ log.performedByName || (log.actorId ? `Actor #${log.actorId}` : 'System Automated') }}
                <span v-if="log.performedByRole" class="text-[10px] text-slate-400 block font-mono">
                  ({{ log.performedByRole }})
                </span>
              </td>
              <td class="py-3.5 px-5 text-right text-xs">
                <button
                  type="button"
                  @click="viewDetails(log)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 font-semibold text-xs transition-colors"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Inspect JSON</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- JSON Snapshot Dialog Modal conforming to modern-web-guidance -->
    <dialog
      ref="logDetailsModal"
      aria-labelledby="audit-detail-title"
      class="w-full max-w-xl rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <div class="border-b border-slate-100 px-6 py-4.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-indigo-600" />
          <h2 id="audit-detail-title" class="text-sm font-bold text-slate-900 tracking-tight">
            Audit State Snapshot (Log #{{ selectedLog?.id }})
          </h2>
        </div>
        <button type="button" @click="closeDetails" class="text-slate-400 hover:text-slate-600 p-1">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-6 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <div><span class="text-slate-400">Action:</span> <strong class="text-slate-900 ml-1">{{ selectedLog?.action }}</strong></div>
          <div><span class="text-slate-400">Target:</span> <strong class="text-slate-900 ml-1">{{ selectedLog?.entityType }} #{{ selectedLog?.entityId }}</strong></div>
          <div><span class="text-slate-400">Actor:</span> <strong class="text-slate-900 ml-1">Actor #{{ selectedLog?.performedById || selectedLog?.actorId }}</strong></div>
          <div><span class="text-slate-400">Logged:</span> <strong class="text-slate-900 ml-1">{{ selectedLog ? new Date(selectedLog.timestamp || selectedLog.createdAt || Date.now()).toLocaleTimeString() : '' }}</strong></div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1.5">JSON Payload (New State)</label>
          <pre class="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-auto max-h-72 border border-slate-800 leading-relaxed">{{ formatJson(selectedLog?.details || selectedLog?.newValue) }}</pre>
        </div>

        <div v-if="selectedLog?.oldValue">
          <label class="block font-semibold text-slate-700 mb-1.5">Previous State (Old Value)</label>
          <pre class="p-4 rounded-2xl bg-slate-900 text-amber-300 text-xs font-mono overflow-auto max-h-48 border border-slate-800 leading-relaxed">{{ formatJson(selectedLog.oldValue) }}</pre>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            @click="closeDetails"
            class="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
