<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Sidebar from '@/components/Sidebar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50/70 antialiased text-slate-900">
    <Navbar />
    <div class="flex-1 flex overflow-hidden">
      <Sidebar />
      <main class="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <router-view />
      </main>
    </div>
  </div>
</template>
