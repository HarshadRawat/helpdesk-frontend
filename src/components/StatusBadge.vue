<script setup lang="ts">
import { computed } from 'vue'
import type { Status, Priority } from '@/types'

const props = defineProps<{
  status?: Status
  priority?: Priority
}>()

const statusConfig = computed(() => {
  switch (props.status) {
    case 'OPEN':
      return {
        label: 'Open',
        bg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10',
        dot: 'bg-blue-600',
      }
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        bg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-700/15',
        dot: 'bg-amber-500 animate-pulse',
      }
    case 'RESOLVED':
      return {
        label: 'Resolved',
        bg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/15',
        dot: 'bg-emerald-600',
      }
    case 'CLOSED':
      return {
        label: 'Closed',
        bg: 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/10',
        dot: 'bg-slate-400',
      }
    default:
      return null
  }
})

const priorityConfig = computed(() => {
  switch (props.priority) {
    case 'LOW':
      return {
        label: 'Low',
        classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/15 font-medium',
      }
    case 'MEDIUM':
      return {
        label: 'Medium',
        classes: 'bg-sky-50 text-sky-700 ring-1 ring-sky-700/20 font-semibold',
      }
    case 'HIGH':
      return {
        label: 'High',
        classes: 'bg-orange-50 text-orange-700 ring-1 ring-orange-700/20 font-semibold',
      }
    case 'URGENT':
      return {
        label: 'Urgent',
        classes: 'bg-rose-50 text-rose-700 ring-1 ring-rose-700/25 font-bold animate-pulse',
      }
    default:
      return null
  }
})
</script>

<template>
  <span
    v-if="statusConfig"
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
      statusConfig.bg
    ]"
  >
    <span :class="['h-1.5 w-1.5 rounded-full shrink-0', statusConfig.dot]"></span>
    <span>{{ statusConfig.label }}</span>
  </span>

  <span
    v-else-if="priorityConfig"
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider',
      priorityConfig.classes
    ]"
  >
    {{ priorityConfig.label }}
  </span>
</template>
