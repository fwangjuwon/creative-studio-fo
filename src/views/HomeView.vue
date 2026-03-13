<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import PageTitle from '@/components/common/PageTitle.vue'

// store / composable
const authStore = useAuthStore()

// reactive state
const usage = ref(null)
const usageLoading = ref(false)

// constants
const ROLE_COLORS = { ADMIN: 'error', MANAGER: 'warning', USER: 'primary' }

// methods
async function fetchMyUsage() {
  usageLoading.value = true
  try {
    const res = await api.get('/users/me/usage')
    usage.value = res.data.data
  } catch {
    usage.value = null
  } finally {
    usageLoading.value = false
  }
}

// lifecycle hooks
onMounted(fetchMyUsage)
</script>

<template>
  <div>
    <PageTitle title="홈" subtitle="NS Creative Studio에 오신 것을 환영합니다." />

    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="2">
          <v-card-item>
            <template #prepend>
              <v-icon color="primary" size="32">mdi-account</v-icon>
            </template>
            <v-card-title>사용자 정보</v-card-title>
          </v-card-item>
          <v-card-text class="pa-5">
            <template v-if="authStore.user">
              <div class="d-flex align-center mb-4" style="gap: 12px;">
                <v-chip
                  :color="ROLE_COLORS[authStore.user.role]"
                  size="small"
                  variant="tonal"
                >
                  {{ authStore.user.role }}
                </v-chip>
                <span class="text-body-1 font-weight-bold">{{ authStore.user.loginId }}</span>
              </div>

              <!-- 사용량 -->
              <v-divider class="mb-4" />
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">오늘 사용량</span>
                <template v-if="usageLoading">
                  <v-progress-circular size="16" width="2" indeterminate color="primary" />
                </template>
                <template v-else-if="usage">
                  <v-chip
                    :color="usage.remainingCount === 0 ? 'error' : 'default'"
                    :variant="usage.remainingCount === 0 ? 'tonal' : 'text'"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{ usage.todayUsedCount }} / {{ usage.dailyLimit }}
                  </v-chip>
                </template>
                <span v-else class="text-body-2 text-disabled">-</span>
              </div>
              <div v-if="usage && usage.remainingCount === 0" class="mt-2">
                <v-alert
                  type="warning"
                  variant="tonal"
                  density="compact"
                  icon="mdi-alert-outline"
                >
                  오늘 사용 한도에 도달했습니다.
                </v-alert>
              </div>
            </template>
            <p v-else class="text-medium-emphasis">로그인된 사용자 정보가 없습니다.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
</style>
