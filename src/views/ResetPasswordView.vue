<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/api/client'

const route = useRoute()
const router = useRouter()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

onMounted(() => {
  token.value = (route.query.token as string) || ''
  if (!token.value) {
    errorMessage.value = 'Missing password reset token. Please check your reset link.'
  }
})

const handleReset = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const { data } = await apiClient.post('/auth/reset-password', {
      token: token.value,
      newPassword: newPassword.value,
    })
    successMessage.value = data.message || 'Password reset successful. Redirecting to login...'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to reset password. The link may have expired.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">
        Set New Password
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        Create a strong password for your account.
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

        <form @submit.prevent="handleReset" class="space-y-5">
          <div>
            <label for="newPassword" class="block text-sm font-medium text-slate-700">
              New Password
            </label>
            <div class="mt-1">
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                required
                autocomplete="new-password"
                minlength="8"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                minlength="8"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading || !token"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {{ isLoading ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
