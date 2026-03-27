<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import bannerImg from '@/assets/banner.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const drawer = ref(true)
const rail = ref(false)

const ROLE_COLORS = { ADMIN: 'error', MANAGER: 'warning', USER: 'primary' }
const usage = ref(null)

async function fetchUsage() {
  try {
    const res = await api.get('/users/me/usage')
    usage.value = res.data.data
  } catch {
    usage.value = null
  }
}

onMounted(fetchUsage)
// 페이지 이동 시마다 사용량 갱신 (프롬프트 생성 후 반영)
watch(() => route.fullPath, fetchUsage)
// 하위 컴포넌트(PromptNewView 등)에서 프롬프트 생성 직후 사용량 즉시 갱신에 사용
provide('refreshUsage', fetchUsage)

const navItems = computed(() => {
  const role = authStore.userRole
  const items = [
    { title: '홈', icon: 'mdi-home', to: '/' },
    { title: '프롬프트 생성', icon: 'mdi-creation', to: '/prompt/new' },
    { title: '프롬프트 이력', icon: 'mdi-history', to: '/prompt/history' },
  ]

  if (role === 'MANAGER' || role === 'ADMIN') {
    items.push(
      { title: '카테고리 관리', icon: 'mdi-tag-multiple', to: '/manage/categories' },
      { title: '태그 관리', icon: 'mdi-label-multiple', to: '/manage/tags' },
      { title: '인물 속성 관리', icon: 'mdi-account-details', to: '/manage/human-prompts' },
    )
  }

  if (role === 'ADMIN') {
    items.push(
      { title: '사용자 관리', icon: 'mdi-account-group', to: '/manage/users' },
    )
  }

  return items
})

function onLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <v-app>
    <!-- 상단 AppBar -->
    <v-app-bar color="white" elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <img
        :src="bannerImg"
        alt="NS Creative Studio"
        style="height: 52px; object-fit: contain; cursor: pointer;"
        @click="router.push({ name: 'home' })"
      />
      <v-spacer />

      <!-- 사용자 정보 + 사용량 -->
      <div v-if="authStore.user" class="d-flex align-center mr-2" style="gap: 10px;">
        <v-chip
          :color="ROLE_COLORS[authStore.userRole]"
          size="small"
          variant="flat"
          class="font-weight-bold"
        >
          {{ authStore.userRole }}
        </v-chip>
        <span class="text-body-2 font-weight-medium" style="color: #3d3d3d;">{{ authStore.user.loginId }}</span>
        <v-divider vertical class="mx-1" style="border-color: rgba(0,0,0,0.15);" />
        <span
          v-if="usage"
          class="text-body-2 font-weight-medium"
          :style="usage.remainingCount === 0 ? 'color: #C62828; font-weight: 700;' : 'color: #3d3d3d;'"
        >
          오늘 {{ usage.todayUsedCount }}/{{ usage.dailyLimit }}
        </span>
      </div>

      <v-btn icon @click="onLogout" color="secondary">
        <v-icon>mdi-logout</v-icon>
        <v-tooltip activator="parent">로그아웃</v-tooltip>
      </v-btn>
    </v-app-bar>

    <!-- 사이드바 -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent color="#F0C3C1">
      <!-- 펼쳐진 상태: 타이틀 + 접기 버튼 -->
      <v-list-item
        v-if="!rail"
        prepend-icon="mdi-palette"
        title="NS Creative Studio"
        nav
      >
        <template #append>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click="rail = true"
          />
        </template>
      </v-list-item>

      <!-- 접힌 상태: 펼치기 버튼만 표시 -->
      <v-list-item v-else nav>
        <template #prepend>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            @click="rail = false"
          />
        </template>
      </v-list-item>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          rounded="lg"
        />
      </v-list>

      <template #append>
        <v-divider />
        <v-list density="compact" nav class="py-2">
          <v-list-item
            prepend-icon="mdi-account-circle"
            :title="authStore.user?.loginId || ''"
            :subtitle="authStore.userRole || ''"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- 메인 콘텐츠 -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view v-slot="{Component}">
          <keep-alive include="PromptNewView">
            <component :is="Component"></component>
          </keep-alive>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>
