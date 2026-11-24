<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'
import type { User, Role } from '@/types'

const users = ref<User[]>([])
const isLoading = ref(true)

// Create user form modal
const dialogRef = ref<HTMLDialogElement | null>(null)
const fullName = ref('')
const email = ref('')
const password = ref('')
const department = ref('Engineering')
const role = ref<Role>('ROLE_CUSTOMER')
const phoneNumber = ref('')
const isCreating = ref(false)
const createError = ref<string | null>(null)

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const { data } = await apiClient.get<User[]>('/users')
    users.value = data
  } catch (err) {
    console.error('Failed to fetch users', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

const openModal = () => {
  fullName.value = ''
  email.value = ''
  password.value = ''
  department.value = 'Engineering'
  role.value = 'ROLE_CUSTOMER'
  phoneNumber.value = ''
  createError.value = null
  dialogRef.value?.showModal()
}

const closeModal = () => {
  dialogRef.value?.close()
}

const handleCreateUser = async () => {
  isCreating.value = true
  createError.value = null

  try {
    const rawRole = role.value || 'CUSTOMER'
    const cleanRole = rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole
    const { data } = await apiClient.post<User>('/users', {
      name: fullName.value,
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      role: cleanRole,
      department: department.value,
      phoneNumber: phoneNumber.value || undefined,
    })
    users.value.unshift(data)
    closeModal()
  } catch (err: any) {
    createError.value = err.response?.data?.message || err.response?.data?.detail || 'Failed to create user.'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">User & Staff Administration</h2>
        <p class="text-xs text-slate-500 mt-0.5">Manage employees, IT support agents, and system administrators</p>
      </div>

      <button
        type="button"
        @click="openModal"
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        <span>+</span>
        <span>Add User</span>
      </button>
    </div>

    <!-- Users Table conforming to modern-web-guidance -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div tabindex="0" role="region" aria-labelledby="users-table-caption" class="table-wrapper">
        <table class="w-full text-left border-collapse">
          <caption id="users-table-caption" class="sr-only">Staff and Users Directory</caption>
          <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th scope="col" class="py-3.5 px-4">User</th>
              <th scope="col" class="py-3.5 px-4">Role</th>
              <th scope="col" class="py-3.5 px-4">Department</th>
              <th scope="col" class="py-3.5 px-4">Phone</th>
              <th scope="col" class="py-3.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="isLoading">
              <td colspan="5" class="py-12 text-center text-slate-400">Loading users...</td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50/60">
              <td class="py-3.5 px-4">
                <div class="font-bold text-slate-900">{{ user.fullName || user.name }}</div>
                <div class="text-xs text-slate-400">{{ user.email }}</div>
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'text-xs font-semibold px-2 py-0.5 rounded uppercase border',
                    user.role?.includes('ADMIN') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    user.role?.includes('AGENT') || user.role?.includes('SUPPORT') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  ]"
                >
                  {{ user.role?.replace('ROLE_', '') }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-xs font-medium text-slate-600">
                {{ user.department || (user.role?.includes('ADMIN') ? 'IT Operations' : user.role?.includes('AGENT') ? 'Technical Support' : 'Engineering') }}
              </td>
              <td class="py-3.5 px-4 text-xs text-slate-500">
                {{ user.phoneNumber || '—' }}
              </td>
              <td class="py-3.5 px-4 text-right text-xs">
                <span class="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span> Active
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Dialog Modal -->
    <dialog
      ref="dialogRef"
      aria-labelledby="create-user-title"
      class="w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <div class="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <h2 id="create-user-title" class="text-base font-semibold text-slate-900">
          Create New Organization User
        </h2>
        <button type="button" @click="closeModal" class="text-slate-400 hover:text-slate-600">✕</button>
      </div>

      <form @submit.prevent="handleCreateUser" class="p-6 space-y-4">
        <div v-if="createError" class="p-3 rounded-lg bg-red-50 text-xs text-red-700 border border-red-200">
          {{ createError }}
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
          <input
            v-model="fullName"
            type="text"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Work Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Temporary Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Role</label>
            <select
              v-model="role"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
            >
              <option value="CUSTOMER">Employee (User)</option>
              <option value="AGENT">IT Support (Agent)</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Department</label>
            <input
              v-model="department"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isCreating"
            class="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ isCreating ? 'Creating...' : 'Create Account' }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>
