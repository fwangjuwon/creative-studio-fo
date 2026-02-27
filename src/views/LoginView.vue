<template>
  <v-card rounded="xl" elevation="8" class="pa-4">
    <v-card-item class="text-center pb-0">
      <v-icon color="primary" size="48" class="mb-2">mdi-palette</v-icon>
      <v-card-title class="text-h5 font-weight-bold">NS Creative Studio</v-card-title>
      <v-card-subtitle>계정에 로그인하세요</v-card-subtitle>
    </v-card-item>

    <v-card-text class="pt-6">
      <v-form @submit.prevent="handleLogin">
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

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ loginId: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login(form)
    router.push({ name: 'home' })
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '로그인에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>
