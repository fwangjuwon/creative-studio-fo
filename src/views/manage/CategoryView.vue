<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

// ───────────────────────────────────────────────
// 카테고리 계층 데이터
// ───────────────────────────────────────────────
const CATEGORY_TYPES = ['LCS', 'MCS', 'SCS']

const panels = ref([
  { label: '대분류 (LCS)', level: 1, parentId: null, items: [], loading: false, selectedId: null },
  { label: '중분류 (MCS)', level: 2, parentId: null, items: [], loading: false, selectedId: null },
  { label: '소분류 (SCS)', level: 3, parentId: null, items: [], loading: false, selectedId: null },
])

async function fetchCategories(panelIndex) {
  const panel = panels.value[panelIndex]
  panel.loading = true
  panel.items = []
  try {
    const params = panel.parentId ? { parentId: panel.parentId } : {}
    const res = await api.get('/categories', { params })
    panel.items = res.data.data ?? []
  } catch {
    panel.items = []
  } finally {
    panel.loading = false
  }
}

onMounted(() => {
  fetchCategories(0)
})

function onCategorySelect(panelIndex, item) {
  const panel = panels.value[panelIndex]
  if (panel.selectedId === item.id) {
    // 같은 항목 클릭 시 선택 해제 + 하위 패널 초기화
    panel.selectedId = null
    clearPanelsFrom(panelIndex + 1)
    return
  }
  panel.selectedId = item.id

  // 하위 패널 초기화 후 다음 패널 로드
  clearPanelsFrom(panelIndex + 1)
  if (panelIndex < 2) {
    panels.value[panelIndex + 1].parentId = item.id
    fetchCategories(panelIndex + 1)
  }
}

function clearPanelsFrom(fromIndex) {
  for (let i = fromIndex; i < 3; i++) {
    panels.value[i].selectedId = null
    panels.value[i].parentId = null
    panels.value[i].items = []
  }
}

// ───────────────────────────────────────────────
// 추가 다이얼로그
// ───────────────────────────────────────────────
const addDialog = ref(false)
const addTargetPanelIndex = ref(0)
const addForm = ref({ name: '', sortOrder: 0 })
const addLoading = ref(false)
const addError = ref('')

function onAddDialogOpen(panelIndex) {
  addTargetPanelIndex.value = panelIndex
  addForm.value = { name: '', sortOrder: 0 }
  addError.value = ''
  addDialog.value = true
}

async function onAddSubmit() {
  if (!addForm.value.name.trim()) {
    addError.value = '카테고리명을 입력해 주세요.'
    return
  }
  addLoading.value = true
  addError.value = ''
  try {
    const panel = panels.value[addTargetPanelIndex.value]
    const payload = {
      name: addForm.value.name.trim(),
      categoryType: CATEGORY_TYPES[addTargetPanelIndex.value],
      sortOrder: Number(addForm.value.sortOrder) || 0,
    }
    if (panel.parentId) {
      payload.parentId = panel.parentId
    }
    await api.post('/categories', payload)
    addDialog.value = false
    await fetchCategories(addTargetPanelIndex.value)
  } catch (err) {
    addError.value = err.response?.data?.message || '카테고리 추가 중 오류가 발생했습니다.'
  } finally {
    addLoading.value = false
  }
}

// ───────────────────────────────────────────────
// 수정 다이얼로그
// ───────────────────────────────────────────────
const editDialog = ref(false)
const editTargetPanelIndex = ref(0)
const editForm = ref({ id: null, name: '', sortOrder: 0 })
const editLoading = ref(false)
const editError = ref('')

function onEditDialogOpen(panelIndex, item) {
  editTargetPanelIndex.value = panelIndex
  editForm.value = { id: item.id, name: item.name, sortOrder: item.sortOrder ?? 0 }
  editError.value = ''
  editDialog.value = true
}

async function onEditSubmit() {
  if (!editForm.value.name.trim()) {
    editError.value = '카테고리명을 입력해 주세요.'
    return
  }
  editLoading.value = true
  editError.value = ''
  try {
    await api.put(`/categories/${editForm.value.id}`, {
      name: editForm.value.name.trim(),
      sortOrder: Number(editForm.value.sortOrder) || 0,
    })
    editDialog.value = false
    await fetchCategories(editTargetPanelIndex.value)
  } catch (err) {
    editError.value = err.response?.data?.message || '카테고리 수정 중 오류가 발생했습니다.'
  } finally {
    editLoading.value = false
  }
}

// ───────────────────────────────────────────────
// 삭제 확인
// ───────────────────────────────────────────────
const deleteDialog = ref(false)
const deleteTargetPanelIndex = ref(0)
const deleteTarget = ref(null)
const deleteLoading = ref(false)
const deleteError = ref('')

function onDeleteDialogOpen(panelIndex, item) {
  deleteTargetPanelIndex.value = panelIndex
  deleteTarget.value = item
  deleteError.value = ''
  deleteDialog.value = true
}

async function onDeleteSubmit() {
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/categories/${deleteTarget.value.id}`)
    deleteDialog.value = false
    // 삭제된 항목이 선택 중이었다면 하위 패널도 초기화
    const panel = panels.value[deleteTargetPanelIndex.value]
    if (panel.selectedId === deleteTarget.value.id) {
      panel.selectedId = null
      clearPanelsFrom(deleteTargetPanelIndex.value + 1)
    }
    await fetchCategories(deleteTargetPanelIndex.value)
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'C004') {
      deleteError.value = '하위 카테고리가 존재하여 삭제할 수 없습니다. 하위 카테고리를 먼저 삭제해 주세요.'
    } else {
      deleteError.value = err.response?.data?.message || '카테고리 삭제 중 오류가 발생했습니다.'
    }
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">카테고리 관리</h2>

    <!-- ─── 3단계 패널 ─── -->
    <v-row>
      <v-col
        v-for="(panel, idx) in panels"
        :key="idx"
        cols="12"
        sm="4"
        md="4"
      >
        <v-card
          variant="outlined"
          :class="{ 'panel-active': idx > 0 && panels[idx - 1].selectedId }"
          style="min-height: 420px; display: flex; flex-direction: column;"
        >
          <!-- 패널 헤더 -->
          <v-card-title class="text-subtitle-2 font-weight-bold pa-3 pb-2 d-flex align-center">
            <v-icon size="small" start>mdi-folder-outline</v-icon>
            {{ panel.label }}
            <v-chip
              v-if="panel.items.length > 0"
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-auto"
            >
              {{ panel.items.length }}
            </v-chip>
          </v-card-title>
          <v-divider />

          <!-- 로딩 -->
          <div v-if="panel.loading" class="d-flex justify-center align-center flex-grow-1 pa-4">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>

          <!-- 비활성 (상위 미선택) -->
          <div
            v-else-if="idx > 0 && !panels[idx - 1].selectedId"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="32" class="mb-2 d-block mx-auto">mdi-arrow-left</v-icon>
              <span class="text-caption">{{ panels[idx - 1].label }}를<br>먼저 선택하세요</span>
            </div>
          </div>

          <!-- 목록 비어있음 -->
          <div
            v-else-if="panel.items.length === 0 && (idx === 0 || panels[idx - 1].selectedId)"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="32" class="mb-2 d-block mx-auto">mdi-folder-open-outline</v-icon>
              <span class="text-caption">항목이 없습니다</span>
            </div>
          </div>

          <!-- 목록 -->
          <v-list
            v-else
            density="compact"
            class="flex-grow-1 py-1"
            style="overflow-y: auto; max-height: 340px;"
          >
            <v-list-item
              v-for="item in panel.items"
              :key="item.id"
              :active="panel.selectedId === item.id"
              active-color="primary"
              class="px-3"
              style="cursor: pointer;"
              @click="onCategorySelect(idx, item)"
            >
              <template #title>
                <span class="text-body-2">{{ item.name }}</span>
              </template>
              <template #append>
                <div class="d-flex gap-1" @click.stop>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="onEditDialogOpen(idx, item)"
                  >
                    <v-icon size="14">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="onDeleteDialogOpen(idx, item)"
                  >
                    <v-icon size="14">mdi-delete</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <!-- 추가 버튼 -->
          <v-divider />
          <div class="pa-2">
            <v-btn
              block
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-plus"
              :disabled="idx > 0 && !panels[idx - 1].selectedId"
              @click="onAddDialogOpen(idx)"
            >
              추가
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── 추가 다이얼로그 ─── -->
    <v-dialog v-model="addDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-folder-plus-outline</v-icon>
          {{ panels[addTargetPanelIndex].label }} 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="addForm.name"
            label="카테고리명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
            @keyup.enter="onAddSubmit"
          />
          <v-text-field
            v-model.number="addForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
          <v-alert
            v-if="addError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ addError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="addLoading"
            @click="onAddSubmit"
          >
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 수정 다이얼로그 ─── -->
    <v-dialog v-model="editDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-pencil-outline</v-icon>
          {{ panels[editTargetPanelIndex].label }} 수정
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="editForm.name"
            label="카테고리명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
            @keyup.enter="onEditSubmit"
          />
          <v-text-field
            v-model.number="editForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
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
          <v-icon start color="error">mdi-delete-outline</v-icon>
          카테고리 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteTarget?.name }}</strong> 카테고리를 삭제하시겠습니까?
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
</style>
