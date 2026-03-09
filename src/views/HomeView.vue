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
              <div class="d-flex align-center" style="gap: 12px;">
                <v-chip
                  :color="ROLE_COLORS[authStore.user.role]"
                  size="small"
                  variant="tonal"
                >
                  {{ authStore.user.role }}
                </v-chip>
                <span class="text-body-1 font-weight-bold">{{ authStore.user.loginId }}</span>
              </div>
            </template>
            <p v-else class="text-medium-emphasis">로그인된 사용자 정보가 없습니다.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import PageTitle from '@/components/common/PageTitle.vue'

const authStore = useAuthStore()

const ROLE_COLORS = { ADMIN: 'error', MANAGER: 'warning', USER: 'primary' }
</script>
