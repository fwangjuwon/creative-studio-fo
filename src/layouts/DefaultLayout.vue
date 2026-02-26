<template>
  <v-app>
    <!-- 상단 AppBar -->
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>NS Creative Studio</v-app-bar-title>
      <v-spacer />
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
        <v-tooltip activator="parent">로그아웃</v-tooltip>
      </v-btn>
    </v-app-bar>

    <!-- 사이드바 -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent>
      <v-list-item
        prepend-icon="mdi-palette"
        title="NS Creative Studio"
        nav
      >
        <template #append>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="rail = !rail"
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
    </v-navigation-drawer>

    <!-- 메인 콘텐츠 -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(true)
const rail = ref(false)

const navItems = [
  { title: '홈', icon: 'mdi-home', to: '/' },
]

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>
