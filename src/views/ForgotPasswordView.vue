<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'

const email = ref('')
const isLoading = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const handleForgot = async () => {
  if (!email.value) return
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const { data } = await apiClient.post('/auth/forgot-password', { email: email.value })
    successMessage.value = data.message || 'If an account exists with that email, a password reset link has been dispatched.'
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to submit reset request. Please check the email entered.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">
        Reset Your Password
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        Enter your work email address and we will generate a secure reset link.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10">
        <div v-if="successMessage" class="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleForgot" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">
              Work Email Address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@company.com"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <router-link to="/login" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            ← Return to Sign In
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
