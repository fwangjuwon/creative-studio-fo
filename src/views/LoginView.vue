<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const SAVED_LOGIN_ID_KEY = 'savedLoginId'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ loginId: '', password: '' })
const rememberId = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function onLogin() {
  errorMsg.value = ''
  loading.value = true

  // 앞뒤 공백 제거 후 통일 (저장값/입력칸 모두 정리된 값 사용)
  form.loginId = form.loginId.trim()

  try {
    await authStore.login(form)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '로그인에 실패했습니다. 다시 시도해주세요.'
    return
  } finally {
    loading.value = false
  }

  // 로그인 성공 확정 — 아이디 저장 실패가 화면 흐름을 막지 않도록 분리
  try {
    if (rememberId.value) {
      localStorage.setItem(SAVED_LOGIN_ID_KEY, form.loginId)
    } else {
      localStorage.removeItem(SAVED_LOGIN_ID_KEY)
    }
  } catch {
    // 저장소 차단/용량 초과 등 — 부가기능이므로 조용히 무시
  }

  router.push({ name: 'home' })
}

onMounted(() => {
  const savedLoginId = localStorage.getItem(SAVED_LOGIN_ID_KEY)
  if (savedLoginId) {
    form.loginId = savedLoginId
    rememberId.value = true
  }
})
</script>

<template>
  <v-card rounded="xl" elevation="8" class="pa-4">
    <v-card-item class="text-center pb-0">
      <v-icon size="48" class="mb-2" style="color: #9D6D6F;">mdi-palette</v-icon>
      <v-card-title class="text-h5 font-weight-bold">NS Creative Studio</v-card-title>
      <v-card-subtitle>계정에 로그인하세요</v-card-subtitle>
    </v-card-item>

    <v-card-text class="pt-6">
      <v-form @submit.prevent="onLogin">
        <v-text-field
          v-model="form.loginId"
          label="아이디"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          :disabled="loading"
        />

        <v-text-field
          v-model="form.password"
          label="비밀번호"
          prepend-inner-icon="mdi-lock"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          :disabled="loading"
          @click:append-inner="showPassword = !showPassword"
        />

        <v-checkbox
          v-model="rememberId"
          label="아이디 기억하기"
          color="primary"
          density="compact"
          hide-details
          class="mb-2"
          :disabled="loading"
        />

        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          {{ errorMsg }}
        </v-alert>

        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          rounded="lg"
          :loading="loading"
        >
          로그인
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
