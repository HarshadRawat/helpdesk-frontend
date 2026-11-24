<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div class="text-6xl font-extrabold text-indigo-600 mb-2">404</div>
    <h2 class="text-xl font-bold text-slate-800 mb-1">Page Not Found</h2>
    <p class="text-sm text-slate-500 mb-6">The page or resource you are looking for does not exist.</p>
    <button
      type="button"
      @click="router.push('/dashboard')"
      class="px-4 py-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
    >
      Return to Dashboard
    </button>
  </div>
</template>
