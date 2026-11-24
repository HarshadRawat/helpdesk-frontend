<script setup lang="ts">
import { computed } from 'vue'
import { Clock, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  dueAt?: string | null
  breached?: boolean
}>()

const statusData = computed(() => {
  if (props.breached) {
    return {
      text: 'SLA Breached',
      color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 font-bold',
      type: 'breached',
    }
  }

  if (!props.dueAt) {
    return null
  }

  const due = new Date(props.dueAt).getTime()
  const now = Date.now()
  const diffMinutes = Math.round((due - now) / 60000)

  if (diffMinutes < 0) {
    return {
      text: 'Overdue',
      color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 font-bold animate-pulse',
      type: 'overdue',
    }
  }

  if (diffMinutes < 60) {
    return {
      text: `${diffMinutes}m left`,
      color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 font-semibold',
      type: 'soon',
    }
  }

  const diffHours = Math.round(diffMinutes / 60)
  return {
    text: `${diffHours}h left`,
    color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 font-medium',
    type: 'normal',
  }
})
</script>

<template>
  <span
    v-if="statusData"
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-colors',
      statusData.color
    ]"
    :title="dueAt ? `Target SLA: ${new Date(dueAt).toLocaleString()}` : undefined"
  >
    <AlertTriangle v-if="statusData.type === 'breached' || statusData.type === 'overdue'" class="w-3.5 h-3.5 shrink-0 text-rose-600" />
    <Clock v-else class="w-3.5 h-3.5 shrink-0" />
    <span>{{ statusData.text }}</span>
  </span>
</template>
