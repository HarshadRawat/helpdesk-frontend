<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'
import StatusBadge from '@/components/StatusBadge.vue'
import SlaBadge from '@/components/SlaBadge.vue'
import {
  ArrowLeft,
  Paperclip,
  Send,
  Lock,
  Shield,
  AlertTriangle,
  Download
} from 'lucide-vue-next'
import type { Ticket, Comment, TicketAttachment, Status, AgentWorkload, AuditLog } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const ticketId = route.params.id as string
const ticket = ref<Ticket | null>(null)
const comments = ref<Comment[]>([])
const attachments = ref<TicketAttachment[]>([])
const agents = ref<AgentWorkload[]>([])
const auditLogs = ref<AuditLog[]>([])

const isLoading = ref(true)
const conflictWarning = ref<string | null>(null)
const actionError = ref<string | null>(null)

// Status update
const selectedStatus = ref<Status>('OPEN')
const resolutionNotes = ref('')
const isUpdatingStatus = ref(false)

// Assignee update
const selectedAgentId = ref<number | ''>('')
const isAssigning = ref(false)

// New comment
const newCommentText = ref('')
const isInternalComment = ref(false)
const isSubmittingComment = ref(false)

// Attachment upload
const uploadFileInput = ref<HTMLInputElement | null>(null)
const isUploadingFile = ref(false)

const loadTicketData = async () => {
  isLoading.value = true
  actionError.value = null
  try {
    const [ticketRes, commentsRes, attachmentsRes] = await Promise.allSettled([
      apiClient.get<Ticket>(`/tickets/${ticketId}`),
      apiClient.get<Comment[]>(`/tickets/${ticketId}/comments`),
      apiClient.get<TicketAttachment[]>(`/tickets/${ticketId}/attachments`),
    ])

    if (ticketRes.status === 'fulfilled') {
      ticket.value = ticketRes.value.data
      selectedStatus.value = ticketRes.value.data.status
      selectedAgentId.value = ticketRes.value.data.assignedToId || ''
    } else {
      actionError.value = (ticketRes.reason as any)?.response?.data?.message || 'Failed to load ticket.'
      return
    }

    if (commentsRes.status === 'fulfilled') {
      comments.value = commentsRes.value.data
    } else {
      comments.value = []
    }

    if (attachmentsRes.status === 'fulfilled') {
      attachments.value = attachmentsRes.value.data
    } else {
      attachments.value = []
    }

    if (authStore.isSupport || authStore.isAdmin) {
      try {
        const { data: workload } = await apiClient.get<AgentWorkload[]>('/tickets/agent-workload')
        agents.value = workload
      } catch (err) {
        console.warn('Failed to fetch agents workload', err)
      }

      try {
        const { data: history } = await apiClient.get<AuditLog[]>(`/audit/tickets/${ticketId}`)
        auditLogs.value = history
      } catch (err) {
        console.warn('Failed to fetch ticket audit history', err)
      }
    }
  } catch (err: any) {
    actionError.value = err.response?.data?.message || 'Failed to load ticket.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTicketData()
})

const handleStatusUpdate = async () => {
  if (!ticket.value) return
  isUpdatingStatus.value = true
  conflictWarning.value = null
  actionError.value = null

  try {
    const { data: updated } = await apiClient.put<Ticket>(`/tickets/${ticket.value.id}/status`, {
      status: selectedStatus.value,
      resolutionNotes: resolutionNotes.value,
      version: ticket.value.version,
    })
    ticket.value = updated
    resolutionNotes.value = ''
    await loadTicketData()
  } catch (err: any) {
    if (err.response?.status === 409) {
      conflictWarning.value =
        'Conflict detected: Another agent updated this ticket simultaneously. The latest data has been refreshed.'
      await loadTicketData()
    } else {
      actionError.value = err.response?.data?.message || 'Failed to update ticket status.'
    }
  } finally {
    isUpdatingStatus.value = false
  }
}

const handleAssign = async () => {
  if (!ticket.value || !selectedAgentId.value) return
  if (ticket.value.assignedToId === Number(selectedAgentId.value)) {
    actionError.value = `This ticket is already assigned to ${ticket.value.assignedToName || 'this technician'}.`
    return
  }
  isAssigning.value = true
  conflictWarning.value = null
  actionError.value = null

  try {
    const { data: updated } = await apiClient.put<Ticket>(`/tickets/${ticket.value.id}/assign`, {
      agentId: Number(selectedAgentId.value),
      assignedToId: Number(selectedAgentId.value),
      version: ticket.value.version,
    })
    ticket.value = updated
    await loadTicketData()
  } catch (err: any) {
    if (err.response?.status === 409) {
      conflictWarning.value =
        'Conflict detected: Another agent reassigned this ticket simultaneously. The latest data has been refreshed.'
      await loadTicketData()
    } else {
      actionError.value = err.response?.data?.detail || err.response?.data?.message || 'Failed to assign ticket.'
    }
  } finally {
    isAssigning.value = false
  }
}

const handleAddComment = async () => {
  if (!newCommentText.value.trim()) return
  isSubmittingComment.value = true
  actionError.value = null

  try {
    const { data: comment } = await apiClient.post<Comment>(`/tickets/${ticketId}/comments`, {
      message: newCommentText.value.trim(),
      isInternal: isInternalComment.value,
    })
    comments.value.push(comment)
    newCommentText.value = ''
    isInternalComment.value = false
  } catch (err: any) {
    actionError.value = err.response?.data?.message || 'Failed to post comment.'
  } finally {
    isSubmittingComment.value = false
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  isUploadingFile.value = true
  actionError.value = null

  const formData = new FormData()
  formData.append('file', file)

  try {
    const { data: attachment } = await apiClient.post<TicketAttachment>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    attachments.value.push(attachment)
    if (uploadFileInput.value) uploadFileInput.value.value = ''
  } catch (err: any) {
    actionError.value = err.response?.data?.message || 'Failed to upload attachment.'
  } finally {
    isUploadingFile.value = false
  }
}

const downloadAttachment = async (attachmentId: number, fileName: string) => {
  try {
    const response = await apiClient.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (err) {
    console.error('Failed to download attachment', err)
  }
}

const getActorName = (actorId?: number) => {
  if (actorId === 1) return 'Admin User (ADMIN)'
  if (actorId === 2) return 'Alex Rivera (AGENT)'
  if (actorId === 3) return 'Marcus Vance (AGENT)'
  if (actorId === 4) return 'Sarah Connor (CUSTOMER)'
  if (actorId === 5) return 'John Doe (CUSTOMER)'
  return `Staff #${actorId || '?'}`
}

const extractStatus = (val?: string) => {
  if (!val) return ''
  try {
    const parsed = JSON.parse(val)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed.status || parsed.assignedTo?.name || ''
    }
    return String(parsed)
  } catch {
    return val.replace(/"/g, '')
  }
}

const formatAuditAction = (log: AuditLog) => {
  const action = (log.action || '').toUpperCase()

  if (action.includes('STATUS')) {
    const oldVal = extractStatus(log.oldValue) || 'None'
    const newVal = extractStatus(log.newValue) || 'Updated'
    return `Status changed: ${oldVal} → ${newVal}`
  }

  if (action.includes('ASSIGN')) {
    try {
      const parsedNew = JSON.parse(log.newValue || '{}')
      const agentName = parsedNew.assignedTo?.name || parsedNew.name || ''
      if (agentName) {
        return `Assigned ticket to technician: ${agentName}`
      }
    } catch {}
    return 'Ticket assigned to support technician'
  }

  if (action.includes('CREATE')) {
    return 'Ticket created & dynamic SLA target set'
  }

  if (action.includes('UPDATE')) {
    return 'Ticket details or priority updated'
  }

  if (action.includes('SLA')) {
    return 'Automated SLA breach alert dispatched'
  }

  return action.replace(/_/g, ' ')
}
</script>

<template>
  <div v-if="isLoading" class="p-16 text-center text-slate-400 text-xs">
    Loading ticket details...
  </div>

  <div v-else-if="ticket" class="space-y-6">
    <!-- Top Back Bar -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        @click="router.push('/tickets')"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Back to Queue</span>
      </button>

      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-slate-400">Version #{{ ticket.version }}</span>
        <SlaBadge :due-at="ticket.slaDueAt" :breached="ticket.slaBreached" />
        <StatusBadge :priority="ticket.priority" />
        <StatusBadge :status="ticket.status" />
      </div>
    </div>

    <!-- Warnings / Alerts -->
    <div v-if="conflictWarning" class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 flex items-center gap-2">
      <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0" />
      <span>{{ conflictWarning }}</span>
    </div>

    <div v-if="actionError" class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
      <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
      <span>{{ actionError }}</span>
    </div>

    <!-- Main Content Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Ticket Details & Comments -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Ticket Information Card -->
        <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span class="text-xs font-mono font-bold text-slate-400">#{{ ticket.id }}</span>
              <h2 class="text-xl font-bold text-slate-900 tracking-tight mt-1">{{ ticket.title }}</h2>
            </div>
            <StatusBadge :priority="ticket.priority" />
          </div>

          <div class="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-4.5 rounded-2xl border border-slate-100">
            {{ ticket.description }}
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span class="text-slate-400 block text-[11px]">Submitted By</span>
              <span class="font-bold text-slate-800 mt-0.5 block">{{ ticket.createdByName }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Submitted On</span>
              <span class="font-medium text-slate-700 mt-0.5 block">{{ new Date(ticket.createdAt).toLocaleString() }}</span>
            </div>
            <div v-if="ticket.resolvedAt">
              <span class="text-slate-400 block text-[11px]">Resolved At</span>
              <span class="font-medium text-emerald-700 mt-0.5 block">{{ new Date(ticket.resolvedAt).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Discussion Thread (Comments) -->
        <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900 tracking-tight">
              Discussion & Notes ({{ comments.length }})
            </h3>
            <span class="text-xs text-slate-400">Chronological activity</span>
          </div>

          <div v-if="comments.length === 0" class="text-xs text-slate-400 text-center py-8">
            No comments posted on this request yet.
          </div>

          <div v-else class="space-y-3.5">
            <div
              v-for="comment in comments"
              :key="comment.id"
              :class="[
                'p-4 rounded-2xl text-xs sm:text-sm border transition-all',
                comment.internal || comment.isInternal || comment.internalOnly
                  ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
                  : 'bg-slate-50 border-slate-200/60 text-slate-800'
              ]"
            >
              <div class="flex items-center justify-between text-xs mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <div
                    :class="[
                      'h-6 w-6 rounded-lg font-bold text-[10px] flex items-center justify-center',
                      comment.internal || comment.isInternal || comment.internalOnly
                        ? 'bg-amber-200 text-amber-900 ring-1 ring-amber-700/20'
                        : 'bg-slate-200 text-slate-700'
                    ]"
                  >
                    {{ (comment.userName || comment.authorName || 'U').charAt(0) }}
                  </div>
                  <span class="font-bold text-slate-900">{{ comment.userName || comment.authorName || 'Staff Member' }}</span>
                  <span
                    v-if="comment.internal || comment.isInternal || comment.internalOnly"
                    class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md uppercase tracking-wider ring-1 ring-amber-700/20"
                  >
                    <Lock class="w-2.5 h-2.5" />
                    <span>Internal IT Note (Staff Only)</span>
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider ring-1 ring-indigo-600/15"
                  >
                    <span>Public Reply</span>
                  </span>
                </div>
                <span class="text-slate-400 text-[11px] font-mono">{{ new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <p class="whitespace-pre-wrap leading-relaxed">{{ comment.message || comment.content }}</p>
            </div>
          </div>

          <!-- Add Comment Form -->
          <form @submit.prevent="handleAddComment" class="space-y-3 pt-4 border-t border-slate-100">
            <textarea
              v-model="newCommentText"
              rows="3"
              required
              placeholder="Post a reply, diagnostic update, or troubleshooting note..."
              class="w-full rounded-2xl border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
            ></textarea>

            <div class="flex items-center justify-between">
              <label
                v-if="authStore.isSupport || authStore.isAdmin"
                class="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none"
              >
                <input
                  v-model="isInternalComment"
                  type="checkbox"
                  class="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span class="flex items-center gap-1">
                  <Lock class="w-3 h-3 text-amber-600" />
                  <span>Internal note (Visible only to IT Support)</span>
                </span>
              </label>
              <span v-else></span>

              <button
                type="submit"
                :disabled="isSubmittingComment || !newCommentText.trim()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs shadow-indigo-600/20"
              >
                <Send class="w-3.5 h-3.5" />
                <span>{{ isSubmittingComment ? 'Posting...' : 'Post Reply' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Ticket Audit Timeline (Admins & Support) -->
        <div v-if="(authStore.isSupport || authStore.isAdmin) && auditLogs.length > 0" class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-indigo-600" />
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ticket Compliance Audit Ledger ({{ auditLogs.length }} events)
              </h3>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Immutable History</span>
          </div>

          <div class="divide-y divide-slate-100 text-xs">
            <div v-for="log in auditLogs" :key="log.id" class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ring-1',
                      log.action.includes('STATUS') ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                      log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                      log.action.includes('ASSIGN') ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                      'bg-slate-100 text-slate-700 ring-slate-600/10'
                    ]"
                  >
                    {{ log.action }}
                  </span>
                  <span class="font-semibold text-slate-800">{{ formatAuditAction(log) }}</span>
                </div>
                <div class="text-[11px] text-slate-500">
                  Recorded by <strong class="text-slate-700 font-semibold">{{ getActorName(log.actorId || log.performedById) }}</strong>
                </div>
              </div>
              <span class="text-slate-400 font-mono text-[11px] shrink-0">
                {{ new Date(log.createdAt || log.timestamp || '').toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Status, Assignee, Attachments -->
      <div class="space-y-6">
        <!-- Status Management Card (Assigned Agent & Admin) -->
        <div v-if="authStore.isAdmin || (authStore.isSupport && ticket?.assignedToId === authStore.user?.id)" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Lifecycle & Status
          </h3>

          <div class="space-y-3">
            <div>
              <label for="status-select" class="block text-xs font-semibold text-slate-700 mb-1">
                Current Status
              </label>
              <select
                id="status-select"
                v-model="selectedStatus"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div v-if="selectedStatus === 'RESOLVED'">
              <label for="resolution-notes" class="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Summary
              </label>
              <textarea
                id="resolution-notes"
                v-model="resolutionNotes"
                rows="2"
                placeholder="Explain what steps resolved this issue..."
                class="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
              ></textarea>
            </div>

            <button
              type="button"
              @click="handleStatusUpdate"
              :disabled="isUpdatingStatus"
              class="w-full py-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {{ isUpdatingStatus ? 'Saving...' : 'Update Status' }}
            </button>
          </div>

          <!-- Assignment Selector (Admin only has permission to assign; Support gets read-only view) -->
          <div v-if="authStore.isAdmin" class="pt-4 border-t border-slate-100 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-700">Assign Technician</h4>
              <span v-if="ticket?.assignedToName" class="text-[11px] text-slate-500 font-medium">
                Current: <strong class="text-slate-800">{{ ticket.assignedToName }}</strong>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <select
                v-model="selectedAgentId"
                class="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
              >
                <option value="">Unassigned</option>
                <option
                  v-for="agent in agents"
                  :key="agent.agentId"
                  :value="agent.agentId"
                >
                  {{ agent.agentName }} ({{ agent.assignedTickets ?? agent.activeTicketsCount ?? 0 }} active)
                </option>
              </select>

              <button
                type="button"
                @click="handleAssign"
                :disabled="isAssigning || !selectedAgentId || selectedAgentId === ticket?.assignedToId"
                :class="[
                  'px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-all',
                  selectedAgentId === ticket?.assignedToId
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                ]"
              >
                {{ isAssigning ? '...' : selectedAgentId === ticket?.assignedToId ? 'Assigned' : 'Assign' }}
              </button>
            </div>
            <p v-if="selectedAgentId === ticket?.assignedToId && ticket?.assignedToName" class="text-[11px] text-amber-600 font-medium">
              ⓘ Ticket is already assigned to {{ ticket.assignedToName }}.
            </p>
          </div>

          <!-- For Assigned Support Agent: Read-only Assignee Information -->
          <div v-else-if="authStore.isSupport" class="pt-4 border-t border-slate-100 space-y-2">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Technician</div>
            <div class="flex items-center gap-2">
              <div class="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center ring-1 ring-indigo-600/15">
                {{ (ticket?.assignedToName || 'U').charAt(0) }}
              </div>
              <span class="text-xs font-semibold text-slate-800">
                {{ ticket?.assignedToName || 'Unassigned' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Collaborative Card for Peer Support Agents (Not Assigned to this Ticket) -->
        <div v-else-if="authStore.isSupport" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Lifecycle & Status
            </h3>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-300/40">
              {{ ticket?.status }}
            </span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
            <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Primary Assignee:</span>
              <span class="text-indigo-600">{{ ticket?.assignedToName || 'Unassigned' }}</span>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Status changes are owned by the assigned technician. You have collaborative access to review history and post internal diagnostic notes below.
            </p>
          </div>

          <div class="pt-3 border-t border-slate-100 space-y-2">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Technician</div>
            <div class="flex items-center gap-2">
              <div class="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center ring-1 ring-indigo-600/15">
                {{ (ticket?.assignedToName || 'U').charAt(0) }}
              </div>
              <span class="text-xs font-semibold text-slate-800">
                {{ ticket?.assignedToName || 'Unassigned' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Attachments Tray -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Attachments ({{ attachments.length }})
            </h3>
            <Paperclip class="w-4 h-4 text-slate-400" />
          </div>

          <div v-if="attachments.length === 0" class="text-xs text-slate-400 py-3 text-center">
            No files attached to this ticket.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="att in attachments"
              :key="att.id"
              class="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs"
            >
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-slate-800 truncate" :title="att.fileName">
                  {{ att.fileName }}
                </div>
                <div class="text-[10px] text-slate-400">
                  {{ (att.fileSize / 1024).toFixed(1) }} KB • {{ att.uploadedByName }}
                </div>
              </div>

              <button
                type="button"
                @click="downloadAttachment(att.id, att.fileName)"
                class="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
                title="Download file"
              >
                <Download class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Upload new attachment -->
          <div class="pt-3 border-t border-slate-100">
            <label class="block text-[11px] font-semibold text-slate-600 mb-1.5">Add Attachment</label>
            <input
              ref="uploadFileInput"
              type="file"
              :disabled="isUploadingFile"
              @change="handleFileUpload"
              class="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="p-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
    <div class="inline-flex p-3 rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 mx-auto">
      <AlertTriangle class="w-6 h-6" />
    </div>
    <h3 class="text-sm font-bold text-slate-900">Unable to load ticket</h3>
    <p class="text-xs text-slate-500 max-w-sm mx-auto">
      {{ actionError || 'The requested ticket could not be found or access is restricted.' }}
    </p>
    <button
      type="button"
      @click="router.push('/tickets')"
      class="px-4 py-2 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
    >
      Back to Ticket Queue
    </button>
  </div>
</template>
