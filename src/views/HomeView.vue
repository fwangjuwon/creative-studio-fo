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
          <v-card-text>
            <p v-if="authStore.user">{{ authStore.user.name || authStore.user.username }}</p>
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
</script>
