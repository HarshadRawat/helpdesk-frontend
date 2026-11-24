<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'
import { Plus, X, AlertCircle } from 'lucide-vue-next'
import type { Priority, Ticket } from '@/types'

const emit = defineEmits<{
  (e: 'created', ticket: Ticket): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const title = ref('')
const description = ref('')
const priority = ref<Priority>('MEDIUM')
const selectedFile = ref<File | null>(null)

const open = () => {
  title.value = ''
  description.value = ''
  priority.value = 'MEDIUM'
  selectedFile.value = null
  errorMessage.value = null
  dialogRef.value?.showModal()
}

const close = () => {
  dialogRef.value?.close()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  } else {
    selectedFile.value = null
  }
}

const handleSubmit = async () => {
  if (!title.value.trim() || !description.value.trim()) {
    errorMessage.value = 'Please provide both a title and detailed description.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const { data: ticket } = await apiClient.post<Ticket>('/tickets', {
      title: title.value.trim(),
      description: description.value.trim(),
      priority: priority.value,
    })

    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      try {
        await apiClient.post(`/tickets/${ticket.id}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } catch (attachErr) {
        console.error('Attachment upload error', attachErr)
      }
    }

    emit('created', ticket)
    close()
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to submit ticket. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

defineExpose({
  open,
  close,
})
</script>

<template>
  <dialog
    ref="dialogRef"
    aria-labelledby="create-ticket-title"
    class="w-full max-w-lg rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm transition-all"
  >
    <div class="border-b border-slate-100 px-6 py-4.5 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-500/10">
          <Plus class="w-4 h-4" />
        </div>
        <h2 id="create-ticket-title" class="text-sm font-bold text-slate-900 tracking-tight">
          New Support Request
        </h2>
      </div>
      <button
        type="button"
        @click="close"
        class="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1.5 hover:bg-slate-50"
        aria-label="Close dialog"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-xs">
      <div v-if="errorMessage" class="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 flex items-start gap-2">
        <AlertCircle class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <div>
        <label for="ticket-title" class="block font-semibold text-slate-700 mb-1">
          Issue Summary <span class="text-rose-500">*</span>
        </label>
        <input
          id="ticket-title"
          v-model="title"
          type="text"
          required
          placeholder="e.g. MacBook Pro won't wake from sleep on external dock"
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
        />
      </div>

      <div>
        <label for="ticket-priority" class="block font-semibold text-slate-700 mb-1">
          Urgency / Priority
        </label>
        <select
          id="ticket-priority"
          v-model="priority"
          class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 font-medium focus:border-indigo-600 focus:outline-none"
        >
          <option value="LOW">Low — General inquiry or routine maintenance</option>
          <option value="MEDIUM">Medium — Standard issue, workaround available</option>
          <option value="HIGH">High — Significant slowdown or partial outage</option>
          <option value="URGENT">Urgent — Work completely blocked / Critical incident</option>
        </select>
      </div>

      <div>
        <label for="ticket-description" class="block font-semibold text-slate-700 mb-1">
          Description & Error Details <span class="text-rose-500">*</span>
        </label>
        <textarea
          id="ticket-description"
          v-model="description"
          rows="4"
          required
          placeholder="Describe what occurred, any error codes displayed, and what steps you've tried..."
          class="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
        ></textarea>
      </div>

      <div>
        <label for="ticket-attachment" class="block font-semibold text-slate-700 mb-1">
          Optional Attachment (Crash log or screenshot)
        </label>
        <input
          id="ticket-attachment"
          type="file"
          @change="handleFileChange"
          class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors"
        />
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <button
          type="button"
          @click="close"
          class="rounded-xl px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
