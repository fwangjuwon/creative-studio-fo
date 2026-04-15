import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

// JWT payload 디코딩 (서명 검증 없음 — 클라이언트 UI 분기용)
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)

  async function login(credentials) {
    // 백엔드 응답: CommonResponse<LoginRespDto> → response.data.data
    const response = await api.post('/auth/login', credentials)
    const { accessToken } = response.data.data

    // JWT에서 loginId(sub), role 추출
    const decoded = decodeJwt(accessToken)
    const userInfo = {
      loginId: decoded?.sub || '',
      role: decoded?.role || '',
    }

    token.value = accessToken
    user.value = userInfo

    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  async function ssoLogin(empCd, orgCd) {
    const response = await api.get('/auth/nsist-login', { params: { empCd, orgCd } })
    const { accessToken } = response.data.data

    const decoded = decodeJwt(accessToken)
    const userInfo = {
      loginId: decoded?.sub || '',
      role: decoded?.role || '',
    }

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

  return { token, user, isAuthenticated, userRole, login, ssoLogin, logout }
})
