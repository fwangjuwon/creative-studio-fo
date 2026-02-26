import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials)
    const { accessToken, userInfo } = response.data

    token.value = accessToken
    user.value = userInfo

    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, login, logout }
})
