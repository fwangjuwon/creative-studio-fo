import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
      },
      // 프롬프트
      {
        path: 'prompt/new',
        name: 'prompt-new',
        component: () => import('@/views/prompt/PromptNewView.vue'),
      },
      {
        path: 'prompt/history',
        name: 'prompt-history',
        component: () => import('@/views/prompt/PromptHistoryView.vue'),
      },
      // 관리 — MANAGER 이상
      {
        path: 'manage/categories',
        name: 'manage-categories',
        component: () => import('@/views/manage/CategoryView.vue'),
        meta: { roles: ['MANAGER', 'ADMIN'] },
      },
      {
        path: 'manage/tags',
        name: 'manage-tags',
        component: () => import('@/views/manage/TagView.vue'),
        meta: { roles: ['MANAGER', 'ADMIN'] },
      },
      // 관리 — ADMIN 전용
      {
        path: 'manage/users',
        name: 'manage-users',
        component: () => import('@/views/manage/UserView.vue'),
        meta: { roles: ['ADMIN'] },
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
      },
    ],
  },
  // 매칭되지 않는 경로 → 홈으로
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 미로그인 → 로그인 페이지로
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 로그인 상태에서 로그인 페이지 접근 → 홈으로
  if (to.name === 'login' && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  // 역할 기반 접근 제어
  if (to.meta.roles && authStore.isAuthenticated) {
    const userRole = authStore.userRole
    if (!to.meta.roles.includes(userRole)) {
      return next({ name: 'home' })
    }
  }

  next()
})

export default router
