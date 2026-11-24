<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CreateTicketModal from '@/components/CreateTicketModal.vue'
import { Plus, LogOut } from 'lucide-vue-next'
import type { Ticket } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const modalRef = ref<InstanceType<typeof CreateTicketModal> | null>(null)

const openCreateTicket = () => {
  modalRef.value?.open()
}

const onTicketCreated = (ticket: Ticket) => {
  router.push(`/tickets/${ticket.id}`)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const getInitials = (name?: string) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
</script>

<template>
  <header class="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
    <!-- Brand Identity -->
    <div class="flex items-center gap-3.5">
      <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
        <span class="font-extrabold tracking-tight text-lg">H</span>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-slate-900 tracking-tight">HelpDesk</h1>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase tracking-wider">
            ITSM
          </span>
        </div>
        <p class="text-xs text-slate-400 font-medium">Enterprise Employee Service Desk</p>
      </div>
    </div>

    <!-- Actions & User Profile -->
    <div class="flex items-center gap-4">
      <button
        v-if="authStore.isEmployee"
        type="button"
        @click="openCreateTicket"
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/30 active:scale-[0.98] transition-all"
      >
        <Plus class="w-4 h-4" />
        <span>New Request</span>
      </button>

      <div class="h-6 w-px bg-slate-200"></div>

      <!-- Profile Section -->
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-xs">
          {{ getInitials(authStore.user?.fullName) }}
        </div>

        <div class="text-left hidden sm:block">
          <div class="text-xs font-bold text-slate-900 leading-tight">
            {{ authStore.user?.fullName }}
          </div>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span
              :class="[
                'text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider',
                authStore.isAdmin ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20' :
                authStore.isSupport ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10'
              ]"
            >
              {{ authStore.isAdmin ? 'System Admin' : authStore.isSupport ? 'IT Support' : 'Employee' }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="handleLogout"
          class="rounded-xl p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
          title="Sign out of Helpdesk"
          aria-label="Sign out"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>

    <CreateTicketModal ref="modalRef" @created="onTicketCreated" />
  </header>
</template>
