<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

// ───────────────────────────────────────────────
// 목록 & 검색
// ───────────────────────────────────────────────

// 사용자 목록 데이터 및 로딩 상태
const users = ref([])
const listLoading = ref(false)
const listError = ref('')

// userId → { todayUsedCount, remainingCount } 매핑 테이블
const usageMap = ref({})

// 검색 조건 (이름 부분일치 / 팀명 완전일치 / 권한 완전일치)
const searchForm = ref({ name: '', teamName: '', role: '' })

// v-data-table 컬럼 정의
const headers = [
  { title: 'ID', key: 'id', width: '70px', sortable: false },
  { title: '로그인 ID', key: 'loginId', sortable: false },
  { title: '이름', key: 'name', sortable: false },
  { title: '권한', key: 'role', width: '110px', sortable: false },
  { title: '팀', key: 'teamName', sortable: false },
  { title: '일일 한도', key: 'dailyLimit', width: '100px', sortable: false, align: 'center' },
  { title: '금일 사용량', key: 'todayUsage', width: '120px', sortable: false, align: 'center' },
  { title: '등록일', key: 'initRegiDttm', width: '160px', sortable: false },
  { title: '관리', key: 'actions', width: '100px', sortable: false, align: 'center' },
]

// 권한 선택지 및 권한별 뱃지 색상
const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'USER']
const ROLE_COLORS = { ADMIN: 'error', MANAGER: 'warning', USER: 'primary' }

/**
 * GET /api/users/usage — 전체 회원 사용량 목록 조회 (ADMIN 전용)
 * userId 기준으로 usageMap 빌드
 */
async function fetchUsage() {
  try {
    const res = await api.get('/users/usage')
    const list = res.data.data ?? []
    usageMap.value = Object.fromEntries(
      list.map(u => [u.userId, { todayUsedCount: u.todayUsedCount, remainingCount: u.remainingCount }])
    )
  } catch {
    usageMap.value = {}
  }
}

/**
 * 목록 + 사용량 병렬 조회
 * 검색 조건 적용, 생성/수정/삭제 후 재조회 시 공통 사용
 */
async function loadAll() {
  listLoading.value = true
  listError.value = ''
  try {
    const params = {}
    if (searchForm.value.name) params.name = searchForm.value.name
    if (searchForm.value.teamName) params.teamName = searchForm.value.teamName
    if (searchForm.value.role) params.role = searchForm.value.role
    const [usersRes] = await Promise.all([
      api.get('/users', { params }),
      fetchUsage(),
    ])
    users.value = usersRes.data.data ?? []
  } catch {
    users.value = []
    listError.value = '사용자 목록을 불러오는 중 오류가 발생했습니다.'
  } finally {
    listLoading.value = false
  }
}

// 검색 조건 초기화 후 전체 목록 다시 조회
function onSearchReset() {
  searchForm.value = { name: '', teamName: '', role: '' }
  loadAll()
}

// 날짜시간 포맷 (ISO → 한국 로컬)
function formatDateTime(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// 컴포넌트 마운트 시 전체 목록 + 사용량 로드
onMounted(loadAll)

// ───────────────────────────────────────────────
// 생성 다이얼로그
// ───────────────────────────────────────────────

const createDialog = ref(false)
// 생성 폼 초기값: 권한 USER, 일일 한도 3
const createForm = ref({ loginId: '', password: '', name: '', role: 'USER', teamName: '', dailyLimit: 3 })
const createLoading = ref(false)
const createError = ref('')
const showCreatePassword = ref(false) // 비밀번호 표시 토글

// 생성 다이얼로그 열기 — 폼 초기화
function onCreateDialogOpen() {
  createForm.value = { loginId: '', password: '', name: '', role: 'USER', teamName: '', dailyLimit: 3 }
  createError.value = ''
  showCreatePassword.value = false
  createDialog.value = true
}

/**
 * POST /api/users — 사용자 생성
 * teamName이 빈 문자열이면 null로 전송 (선택 필드)
 */
async function onCreateSubmit() {
  // 필수 입력값 클라이언트 검증
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
    await loadAll()
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
const editTarget = ref(null) // 수정 대상 사용자 (id, loginId 참조용)
const editForm = ref({ password: '', name: '', role: '', teamName: '', dailyLimit: 0 })
const editLoading = ref(false)
const editError = ref('')
const showEditPassword = ref(false) // 비밀번호 표시 토글

// 수정 다이얼로그 열기 — 기존 값으로 폼 초기화
function onEditDialogOpen(user) {
  editTarget.value = user
  editForm.value = {
    password: '',        // 비밀번호는 빈 값으로 시작 (입력 시에만 변경)
    name: user.name,
    role: user.role,
    teamName: user.teamName ?? '',
    dailyLimit: user.dailyLimit,
  }
  editError.value = ''
  showEditPassword.value = false
  editDialog.value = true
}

/**
 * PUT /api/users/:id — 사용자 수정
 * 비밀번호는 입력값이 있을 때만 payload에 포함 (빈 값이면 기존 비밀번호 유지)
 */
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
    // 비밀번호 입력 시에만 포함
    if (editForm.value.password.trim()) {
      payload.password = editForm.value.password
    }
    await api.put(`/users/${editTarget.value.id}`, payload)
    editDialog.value = false
    await loadAll()
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
const deleteTarget = ref(null) // 삭제 대상 사용자
const deleteLoading = ref(false)
const deleteError = ref('')

// 삭제 확인 다이얼로그 열기
function onDeleteDialogOpen(user) {
  deleteTarget.value = user
  deleteError.value = ''
  deleteDialog.value = true
}

/**
 * DELETE /api/users/:id — 사용자 삭제
 */
async function onDeleteSubmit() {
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/users/${deleteTarget.value.id}`)
    deleteDialog.value = false
    await loadAll()
  } catch (err) {
    deleteError.value = err.response?.data?.message || '사용자 삭제 중 오류가 발생했습니다.'
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- 페이지 헤더 + 사용자 추가 버튼 -->
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
        <!-- 이름 검색 (부분일치, LIKE) -->
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="searchForm.name"
            label="이름"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            prepend-inner-icon="mdi-magnify"
            @keyup.enter="loadAll"
          />
        </v-col>
        <!-- 팀명 검색 (완전일치) -->
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="searchForm.teamName"
            label="팀명"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            prepend-inner-icon="mdi-account-group-outline"
            @keyup.enter="loadAll"
          />
        </v-col>
        <!-- 권한 필터 (완전일치) -->
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
          <v-btn color="primary" variant="flat" @click="loadAll">검색</v-btn>
          <v-btn variant="tonal" @click="onSearchReset">초기화</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- 목록 조회 실패 시 에러 알림 -->
    <v-alert
      v-if="listError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="listError = ''"
    >
      {{ listError }}
    </v-alert>

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
        <!-- 권한 컬럼: 역할에 따라 색상 뱃지로 표시 -->
        <template #item.role="{ item }">
          <v-chip
            :color="ROLE_COLORS[item.role]"
            size="small"
            variant="tonal"
          >
            {{ item.role }}
          </v-chip>
        </template>

        <!-- 팀명이 없으면 '-' 표시 -->
        <template #item.teamName="{ item }">
          {{ item.teamName || '-' }}
        </template>

        <!-- 금일 사용량: todayUsedCount / dailyLimit, 한도 도달 시 빨간 강조 -->
        <template #item.todayUsage="{ item }">
          <template v-if="usageMap[item.id]">
            <span
              :class="usageMap[item.id].remainingCount === 0 ? 'text-error font-weight-bold' : ''"
            >
              {{ usageMap[item.id].todayUsedCount }} / {{ item.dailyLimit }}
            </span>
          </template>
          <span v-else class="text-disabled">-</span>
        </template>

        <!-- 등록일 포맷 변환 -->
        <template #item.initRegiDttm="{ item }">
          {{ formatDateTime(item.initRegiDttm) }}
        </template>

        <!-- 수정 / 삭제 버튼 -->
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
              <!-- 비밀번호: 눈 아이콘으로 표시/숨김 토글 -->
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
              <!-- 팀명은 선택 입력 -->
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
          <!-- 서버 에러 메시지 표시 (중복 loginId 등) -->
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
        <!-- 제목에 loginId 표시로 어떤 계정을 수정하는지 명시 -->
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
              <!-- 비밀번호: 빈 값이면 기존 비밀번호 유지 -->
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
          <!-- 서버 에러 메시지 표시 -->
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
          <!-- 이름과 loginId를 함께 표시해 삭제 대상을 명확히 확인 -->
          <p class="text-body-1 mb-2">
            <strong>{{ deleteTarget?.name }}</strong>
            <span class="text-medium-emphasis"> ({{ deleteTarget?.loginId }})</span>
            을(를) 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <!-- 삭제 실패 시 서버 에러 메시지 표시 -->
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
