<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref<string | null>(
  route.query.sessionExpired ? 'Your session has expired. Please sign in again.' : null
)

const handleLogin = async () => {
  if (!email.value || !password.value) return
  isLoading.value = true
  errorMessage.value = null

  try {
    await authStore.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: any) {
    if (err.response?.status === 429) {
      errorMessage.value = 'Too many failed login attempts. Please wait a moment and try again.'
    } else {
      errorMessage.value = err.response?.data?.message || 'Invalid email or password.'
    }
  } finally {
    isLoading.value = false
  }
}

const fillCredentials = (role: 'admin' | 'support' | 'employee') => {
  if (role === 'admin') {
    email.value = 'admin@example.com'
    password.value = 'Admin@123'
  } else if (role === 'support') {
    email.value = 'support@example.com'
    password.value = 'Support@123'
  } else {
    email.value = 'employee@example.com'
    password.value = 'Employee@123'
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 items-center justify-center text-white font-bold text-2xl shadow-md">
        H
      </div>
      <h2 class="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Sign in to HelpDesk ITSM
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        Enterprise Employee IT Support Portal
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10">
        <div v-if="errorMessage" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">
              Work Email Address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                autocomplete="username"
                required
                spellcheck="false"
                placeholder="you@company.com"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-medium text-slate-700">
                Password
              </label>
              <router-link
                to="/forgot-password"
                class="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </router-link>
            </div>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-100">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Quick Fill Demo Accounts
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="fillCredentials('admin')"
              class="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              @click="fillCredentials('support')"
              class="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              IT Support
            </button>
            <button
              type="button"
              @click="fillCredentials('employee')"
              class="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
