<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

// ───────────────────────────────────────────────
// 목록 & 검색
// ───────────────────────────────────────────────
const users = ref([])
const listLoading = ref(false)

const searchForm = ref({ name: '', teamName: '', role: '' })

const headers = [
  { title: 'ID', key: 'id', width: '70px', sortable: false },
  { title: '로그인 ID', key: 'loginId', sortable: false },
  { title: '이름', key: 'name', sortable: false },
  { title: '권한', key: 'role', width: '110px', sortable: false },
  { title: '팀', key: 'teamName', sortable: false },
  { title: '일일 한도', key: 'dailyLimit', width: '100px', sortable: false },
  { title: '등록일', key: 'initRegiDttm', width: '160px', sortable: false },
  { title: '관리', key: 'actions', width: '100px', sortable: false, align: 'center' },
]

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'USER']
const ROLE_COLORS = { ADMIN: 'error', MANAGER: 'warning', USER: 'primary' }

async function fetchUsers() {
  listLoading.value = true
  try {
    const params = {}
    if (searchForm.value.name) params.name = searchForm.value.name
    if (searchForm.value.teamName) params.teamName = searchForm.value.teamName
    if (searchForm.value.role) params.role = searchForm.value.role
    const res = await api.get('/users', { params })
    users.value = res.data.data ?? []
  } catch {
    users.value = []
  } finally {
    listLoading.value = false
  }
}

function onSearchReset() {
  searchForm.value = { name: '', teamName: '', role: '' }
  fetchUsers()
}

function formatDateTime(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchUsers)

// ───────────────────────────────────────────────
// 생성 다이얼로그
// ───────────────────────────────────────────────
const createDialog = ref(false)
const createForm = ref({ loginId: '', password: '', name: '', role: 'USER', teamName: '', dailyLimit: 10 })
const createLoading = ref(false)
const createError = ref('')
const showCreatePassword = ref(false)

function onCreateDialogOpen() {
  createForm.value = { loginId: '', password: '', name: '', role: 'USER', teamName: '', dailyLimit: 10 }
  createError.value = ''
  showCreatePassword.value = false
  createDialog.value = true
}

async function onCreateSubmit() {
  if (!createForm.value.loginId.trim()) { createError.value = '로그인 ID를 입력해 주세요.'; return }
  if (!createForm.value.password.trim()) { createError.value = '비밀번호를 입력해 주세요.'; return }
  if (!createForm.value.name.trim()) { createError.value = '이름을 입력해 주세요.'; return }

  createLoading.value = true
  createError.value = ''
  try {
    await api.post('/users', {
      loginId: createForm.value.loginId.trim(),
      password: createForm.value.password,
      name: createForm.value.name.trim(),
      role: createForm.value.role,
      teamName: createForm.value.teamName.trim() || null,
      dailyLimit: Number(createForm.value.dailyLimit),
    })
    createDialog.value = false
    await fetchUsers()
  } catch (err) {
    createError.value = err.response?.data?.message || '사용자 생성 중 오류가 발생했습니다.'
  } finally {
    createLoading.value = false
  }
}

// ───────────────────────────────────────────────
// 수정 다이얼로그
// ───────────────────────────────────────────────
const editDialog = ref(false)
const editTarget = ref(null)
const editForm = ref({ password: '', name: '', role: '', teamName: '', dailyLimit: 0 })
const editLoading = ref(false)
const editError = ref('')
const showEditPassword = ref(false)

function onEditDialogOpen(user) {
  editTarget.value = user
  editForm.value = {
    password: '',
    name: user.name,
    role: user.role,
    teamName: user.teamName ?? '',
    dailyLimit: user.dailyLimit,
  }
  editError.value = ''
  showEditPassword.value = false
  editDialog.value = true
}

async function onEditSubmit() {
  if (!editForm.value.name.trim()) { editError.value = '이름을 입력해 주세요.'; return }

  editLoading.value = true
  editError.value = ''
  try {
    const payload = {
      name: editForm.value.name.trim(),
      role: editForm.value.role,
      teamName: editForm.value.teamName.trim() || null,
      dailyLimit: Number(editForm.value.dailyLimit),
    }
    if (editForm.value.password.trim()) {
      payload.password = editForm.value.password
    }
    await api.put(`/users/${editTarget.value.id}`, payload)
    editDialog.value = false
    await fetchUsers()
  } catch (err) {
    editError.value = err.response?.data?.message || '사용자 수정 중 오류가 발생했습니다.'
  } finally {
    editLoading.value = false
  }
}

// ───────────────────────────────────────────────
// 삭제 다이얼로그
// ───────────────────────────────────────────────
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleteLoading = ref(false)
const deleteError = ref('')

function onDeleteDialogOpen(user) {
  deleteTarget.value = user
  deleteError.value = ''
  deleteDialog.value = true
}

async function onDeleteSubmit() {
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/users/${deleteTarget.value.id}`)
    deleteDialog.value = false
    await fetchUsers()
  } catch (err) {
    deleteError.value = err.response?.data?.message || '사용자 삭제 중 오류가 발생했습니다.'
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h2 class="text-h5 font-weight-bold">사용자 관리</h2>
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-account-plus"
        @click="onCreateDialogOpen"
      >
        사용자 추가
      </v-btn>
    </div>

    <!-- ─── 검색 필터 ─── -->
    <v-card variant="outlined" class="mb-4 pa-4">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="searchForm.name"
            label="이름"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            prepend-inner-icon="mdi-magnify"
            @keyup.enter="fetchUsers"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="searchForm.teamName"
            label="팀명"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            prepend-inner-icon="mdi-account-group-outline"
            @keyup.enter="fetchUsers"
          />
        </v-col>
        <v-col cols="12" sm="2">
          <v-select
            v-model="searchForm.role"
            label="권한"
            :items="['', ...ROLE_OPTIONS]"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="2" class="d-flex gap-2">
          <v-btn color="primary" variant="flat" @click="fetchUsers">검색</v-btn>
          <v-btn variant="tonal" @click="onSearchReset">초기화</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- ─── 사용자 테이블 ─── -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="listLoading"
        item-value="id"
        no-data-text="사용자가 없습니다."
        loading-text="불러오는 중..."
        density="comfortable"
      >
        <template #item.role="{ item }">
          <v-chip
            :color="ROLE_COLORS[item.role]"
            size="small"
            variant="tonal"
          >
            {{ item.role }}
          </v-chip>
        </template>

        <template #item.teamName="{ item }">
          {{ item.teamName || '-' }}
        </template>

        <template #item.initRegiDttm="{ item }">
          {{ formatDateTime(item.initRegiDttm) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-center gap-1">
            <v-btn
              icon
              size="x-small"
              variant="text"
              color="primary"
              @click="onEditDialogOpen(item)"
            >
              <v-icon size="16">mdi-pencil</v-icon>
              <v-tooltip activator="parent">수정</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="x-small"
              variant="text"
              color="error"
              @click="onDeleteDialogOpen(item)"
            >
              <v-icon size="16">mdi-delete</v-icon>
              <v-tooltip activator="parent">삭제</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ─── 생성 다이얼로그 ─── -->
    <v-dialog v-model="createDialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-account-plus-outline</v-icon>
          사용자 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="createForm.loginId"
                label="로그인 ID *"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                autofocus
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="createForm.password"
                label="비밀번호 *"
                :type="showCreatePassword ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :append-inner-icon="showCreatePassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showCreatePassword = !showCreatePassword"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="createForm.name"
                label="이름 *"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="createForm.role"
                label="권한 *"
                :items="ROLE_OPTIONS"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="createForm.teamName"
                label="팀명"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="createForm.dailyLimit"
                label="일일 한도 *"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <v-alert
            v-if="createError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ createError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="createLoading"
            @click="onCreateSubmit"
          >
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 수정 다이얼로그 ─── -->
    <v-dialog v-model="editDialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-account-edit-outline</v-icon>
          사용자 수정
          <span v-if="editTarget" class="text-body-2 text-medium-emphasis ml-2">
            ({{ editTarget.loginId }})
          </span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="editForm.password"
                label="새 비밀번호 (변경 시에만 입력)"
                :type="showEditPassword ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :append-inner-icon="showEditPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showEditPassword = !showEditPassword"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.name"
                label="이름 *"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                autofocus
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editForm.role"
                label="권한 *"
                :items="ROLE_OPTIONS"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.teamName"
                label="팀명"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="editForm.dailyLimit"
                label="일일 한도 *"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <v-alert
            v-if="editError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ editError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editLoading"
            @click="onEditSubmit"
          >
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 삭제 확인 다이얼로그 ─── -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2 d-flex align-center">
          <v-icon start color="error">mdi-account-remove-outline</v-icon>
          사용자 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteTarget?.name }}</strong>
            <span class="text-medium-emphasis"> ({{ deleteTarget?.loginId }})</span>
            을(를) 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <v-alert
            v-if="deleteError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ deleteError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">취소</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteLoading"
            @click="onDeleteSubmit"
          >
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
</style>
