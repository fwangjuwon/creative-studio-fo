<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { useEscClose } from '@/composables/useEscClose'

// ───────────────────────────────────────────────
// 태그 그룹
// ───────────────────────────────────────────────
const tagGroups = ref([])
const tagGroupsLoading = ref(false)
const selectedGroupId = ref(null)

async function fetchTagGroups() {
  tagGroupsLoading.value = true
  try {
    const res = await api.get('/tag-groups')
    tagGroups.value = res.data.data ?? []
  } catch {
    tagGroups.value = []
  } finally {
    tagGroupsLoading.value = false
  }
}

function onGroupSelect(group) {
  if (selectedGroupId.value === group.id) {
    selectedGroupId.value = null
    tags.value = []
    return
  }
  selectedGroupId.value = group.id
  fetchTags(group.id)
}

onMounted(() => {
  fetchTagGroups()
})

// ─── 태그 그룹 추가 ───
const addGroupDialog = ref(false)
const addGroupForm = ref({ name: '', isMultiSelect: false })
const addGroupLoading = ref(false)
const addGroupError = ref('')

function onAddGroupDialogOpen() {
  addGroupForm.value = { name: '', isMultiSelect: false }
  addGroupError.value = ''
  addGroupDialog.value = true
}

async function onAddGroupSubmit() {
  if (!addGroupForm.value.name.trim()) {
    addGroupError.value = '태그 그룹명을 입력해 주세요.'
    return
  }
  if (tagGroups.value.some(g => g.name === addGroupForm.value.name.trim())) {
    addGroupError.value = '이미 존재하는 태그 그룹명입니다.'
    return
  }
  addGroupLoading.value = true
  addGroupError.value = ''
  try {
    await api.post('/tag-groups', {
      name: addGroupForm.value.name.trim(),
      isMultiSelect: addGroupForm.value.isMultiSelect,
    })
    addGroupDialog.value = false
    await fetchTagGroups()
  } catch (err) {
    addGroupError.value = err.response?.data?.message || '태그 그룹 추가 중 오류가 발생했습니다.'
  } finally {
    addGroupLoading.value = false
  }
}

// ─── 태그 그룹 수정 ───
const editGroupDialog = ref(false)
const editGroupForm = ref({ id: null, name: '', isMultiSelect: false })
const editGroupLoading = ref(false)
const editGroupError = ref('')

function onEditGroupDialogOpen(group) {
  editGroupForm.value = { id: group.id, name: group.name, isMultiSelect: group.isMultiSelect ?? false }
  editGroupError.value = ''
  editGroupDialog.value = true
}

async function onEditGroupSubmit() {
  if (!editGroupForm.value.name.trim()) {
    editGroupError.value = '태그 그룹명을 입력해 주세요.'
    return
  }
  if (tagGroups.value.some(g => g.name === editGroupForm.value.name.trim() && g.id !== editGroupForm.value.id)) {
    editGroupError.value = '이미 존재하는 태그 그룹명입니다.'
    return
  }
  editGroupLoading.value = true
  editGroupError.value = ''
  try {
    await api.put(`/tag-groups/${editGroupForm.value.id}`, {
      name: editGroupForm.value.name.trim(),
      isMultiSelect: editGroupForm.value.isMultiSelect,
    })
    editGroupDialog.value = false
    // 수정 후 그룹명 갱신
    await fetchTagGroups()
  } catch (err) {
    editGroupError.value = err.response?.data?.message || '태그 그룹 수정 중 오류가 발생했습니다.'
  } finally {
    editGroupLoading.value = false
  }
}

// ─── 태그 그룹 삭제 ───
const deleteGroupDialog = ref(false)
const deleteGroupTarget = ref(null)
const deleteGroupLoading = ref(false)
const deleteGroupError = ref('')

function onDeleteGroupDialogOpen(group) {
  deleteGroupTarget.value = group
  deleteGroupError.value = ''
  deleteGroupDialog.value = true
}

async function onDeleteGroupSubmit() {
  deleteGroupLoading.value = true
  deleteGroupError.value = ''
  try {
    await api.delete(`/tag-groups/${deleteGroupTarget.value.id}`)
    deleteGroupDialog.value = false
    if (selectedGroupId.value === deleteGroupTarget.value.id) {
      selectedGroupId.value = null
      tags.value = []
    }
    await fetchTagGroups()
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'TG002') {
      deleteGroupError.value = '소속 태그가 존재하여 삭제할 수 없습니다. 태그를 먼저 삭제해 주세요.'
    } else {
      deleteGroupError.value = err.response?.data?.message || '태그 그룹 삭제 중 오류가 발생했습니다.'
    }
  } finally {
    deleteGroupLoading.value = false
  }
}

// ───────────────────────────────────────────────
// 태그
// ───────────────────────────────────────────────
const tags = ref([])
const tagsLoading = ref(false)

async function fetchTags(groupId) {
  tagsLoading.value = true
  tags.value = []
  try {
    const res = await api.get('/tags', { params: { tagGroupId: groupId } })
    tags.value = res.data.data ?? []
  } catch {
    tags.value = []
  } finally {
    tagsLoading.value = false
  }
}

// ─── 태그 추가 ───
const addTagDialog = ref(false)
const addTagForm = ref({ name: '', tagValue: '', sortOrder: null })
const addTagLoading = ref(false)
const addTagError = ref('')

function onAddTagDialogOpen() {
  addTagForm.value = { name: '', tagValue: '', sortOrder: null }
  addTagError.value = ''
  addTagDialog.value = true
}

async function onAddTagSubmit() {
  if (!addTagForm.value.name.trim()) {
    addTagError.value = '태그명을 입력해 주세요.'
    return
  }
  if (tags.value.some(t => t.name === addTagForm.value.name.trim())) {
    addTagError.value = '이미 존재하는 태그명입니다.'
    return
  }
  addTagLoading.value = true
  addTagError.value = ''
  try {
    await api.post('/tags', {
      name: addTagForm.value.name.trim(),
      tagValue: addTagForm.value.tagValue.trim() || null,
      tagGroupId: selectedGroupId.value,
      // v-model.number는 빈 필드를 0으로 변환하므로 0 이하는 null로 처리 → BO에서 자동 증가
      sortOrder: addTagForm.value.sortOrder > 0 ? Number(addTagForm.value.sortOrder) : null,
    })
    addTagDialog.value = false
    await fetchTags(selectedGroupId.value)
  } catch (err) {
    addTagError.value = err.response?.data?.message || '태그 추가 중 오류가 발생했습니다.'
  } finally {
    addTagLoading.value = false
  }
}

// ─── 태그 수정 ───
const editTagDialog = ref(false)
const editTagForm = ref({ id: null, name: '', tagValue: '', sortOrder: 0 })
const editTagLoading = ref(false)
const editTagError = ref('')

function onEditTagDialogOpen(tag) {
  editTagForm.value = { id: tag.id, name: tag.name, tagValue: tag.tagValue ?? '', sortOrder: tag.sortOrder ?? 0 }
  editTagError.value = ''
  editTagDialog.value = true
}

async function onEditTagSubmit() {
  if (!editTagForm.value.name.trim()) {
    editTagError.value = '태그명을 입력해 주세요.'
    return
  }
  if (tags.value.some(t => t.name === editTagForm.value.name.trim() && t.id !== editTagForm.value.id)) {
    editTagError.value = '이미 존재하는 태그명입니다.'
    return
  }
  editTagLoading.value = true
  editTagError.value = ''
  try {
    await api.put(`/tags/${editTagForm.value.id}`, {
      name: editTagForm.value.name.trim(),
      tagValue: editTagForm.value.tagValue.trim() || null,
      sortOrder: Number(editTagForm.value.sortOrder) || 0,
    })
    editTagDialog.value = false
    await fetchTags(selectedGroupId.value)
  } catch (err) {
    editTagError.value = err.response?.data?.message || '태그 수정 중 오류가 발생했습니다.'
  } finally {
    editTagLoading.value = false
  }
}

// ─── 태그 삭제 ───
const deleteTagDialog = ref(false)
const deleteTagTarget = ref(null)
const deleteTagLoading = ref(false)
const deleteTagError = ref('')

// isFeatured 그룹일 때만 실제값 필드 표시
const selectedGroup = computed(() => tagGroups.value.find(g => g.id === selectedGroupId.value) ?? null)
const showTagValue = computed(() =>
  selectedGroup.value?.isFeatured === 'Y'
)

useEscClose(addGroupDialog, editGroupDialog, deleteGroupDialog, addTagDialog, editTagDialog, deleteTagDialog)

function onDeleteTagDialogOpen(tag) {
  deleteTagTarget.value = tag
  deleteTagError.value = ''
  deleteTagDialog.value = true
}

async function onDeleteTagSubmit() {
  deleteTagLoading.value = true
  deleteTagError.value = ''
  try {
    await api.delete(`/tags/${deleteTagTarget.value.id}`)
    deleteTagDialog.value = false
    await fetchTags(selectedGroupId.value)
  } catch (err) {
    deleteTagError.value = err.response?.data?.message || '태그 삭제 중 오류가 발생했습니다.'
  } finally {
    deleteTagLoading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">태그 관리</h2>

    <v-row>
      <!-- ─── 태그 그룹 패널 ─── -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" style="min-height: 480px; display: flex; flex-direction: column;">
          <v-card-title class="text-subtitle-2 font-weight-bold pa-3 pb-2 d-flex align-center">
            <v-icon size="small" start>mdi-tag-multiple-outline</v-icon>
            태그 그룹
            <v-chip
              v-if="tagGroups.length > 0"
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-auto"
            >
              {{ tagGroups.length }}
            </v-chip>
          </v-card-title>
          <v-divider />

          <!-- 로딩 -->
          <div v-if="tagGroupsLoading" class="d-flex justify-center align-center flex-grow-1 pa-4">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>

          <!-- 빈 목록 -->
          <div
            v-else-if="tagGroups.length === 0"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="32" class="mb-2 d-block mx-auto">mdi-tag-off-outline</v-icon>
              <span class="text-caption">태그 그룹이 없습니다</span>
            </div>
          </div>

          <!-- 목록 -->
          <v-list
            v-else
            density="compact"
            class="flex-grow-1 py-1"
            style="overflow-y: auto; max-height: 380px;"
          >
            <v-list-item
              v-for="group in tagGroups"
              :key="group.id"
              :active="selectedGroupId === group.id"
              active-color="primary"
              class="px-3"
              style="cursor: pointer;"
              @click="onGroupSelect(group)"
            >
              <template #title>
                <span class="text-body-2">{{ group.name }}</span>
              </template>
              <template #subtitle>
                <v-chip
                  size="x-small"
                  :color="group.isMultiSelect ? 'teal' : 'blue-grey'"
                  variant="tonal"
                  class="mt-1"
                >
                  {{ group.isMultiSelect ? '복수 선택' : '단일 선택' }}
                </v-chip>
              </template>
              <template #append>
                <div class="d-flex gap-1" @click.stop>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="onEditGroupDialogOpen(group)"
                  >
                    <v-icon size="14">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="onDeleteGroupDialogOpen(group)"
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
              @click="onAddGroupDialogOpen"
            >
              그룹 추가
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- ─── 태그 패널 ─── -->
      <v-col cols="12" md="8">
        <v-card variant="outlined" style="min-height: 480px; display: flex; flex-direction: column;">
          <v-card-title class="text-subtitle-2 font-weight-bold pa-3 pb-2 d-flex align-center">
            <v-icon size="small" start>mdi-tag-outline</v-icon>
            태그
            <span v-if="selectedGroupId" class="ml-1 text-primary">
              — {{ tagGroups.find(g => g.id === selectedGroupId)?.name }}
            </span>
            <v-chip
              v-if="tags.length > 0"
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-auto"
            >
              {{ tags.length }}
            </v-chip>
          </v-card-title>
          <v-divider />

          <!-- 로딩 -->
          <div v-if="tagsLoading" class="d-flex justify-center align-center flex-grow-1 pa-4">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>

          <!-- 그룹 미선택 -->
          <div
            v-else-if="!selectedGroupId"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="40" class="mb-2 d-block mx-auto">mdi-arrow-left</v-icon>
              <span class="text-caption">태그 그룹을<br>먼저 선택하세요</span>
            </div>
          </div>

          <!-- 태그 없음 -->
          <div
            v-else-if="tags.length === 0"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="40" class="mb-2 d-block mx-auto">mdi-tag-off-outline</v-icon>
              <span class="text-caption">태그가 없습니다</span>
            </div>
          </div>

          <!-- 태그 목록 -->
          <v-list
            v-else
            density="compact"
            class="flex-grow-1 py-1"
            style="overflow-y: auto; max-height: 380px;"
          >
            <v-list-item
              v-for="tag in tags"
              :key="tag.id"
              class="px-3"
            >
              <template #title>
                <span class="text-body-2">{{ tag.name }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption text-medium-emphasis">정렬: {{ tag.sortOrder ?? 0 }}</span>
              </template>
              <template #append>
                <div class="d-flex gap-1">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="onEditTagDialogOpen(tag)"
                  >
                    <v-icon size="14">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="onDeleteTagDialogOpen(tag)"
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
              :disabled="!selectedGroupId"
              @click="onAddTagDialogOpen"
            >
              태그 추가
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── 태그 그룹 추가 다이얼로그 ─── -->
    <v-dialog v-model="addGroupDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-tag-plus-outline</v-icon>
          태그 그룹 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="addGroupForm.name"
            label="태그 그룹명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-4"
            @keyup.enter="onAddGroupSubmit"
          />
          <v-switch
            v-model="addGroupForm.isMultiSelect"
            label="복수 선택 허용"
            color="primary"
            hide-details
            density="comfortable"
          />
          <v-alert
            v-if="addGroupError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ addGroupError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addGroupDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="addGroupLoading"
            @click="onAddGroupSubmit"
          >
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 태그 그룹 수정 다이얼로그 ─── -->
    <v-dialog v-model="editGroupDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-pencil-outline</v-icon>
          태그 그룹 수정
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="editGroupForm.name"
            label="태그 그룹명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-4"
            @keyup.enter="onEditGroupSubmit"
          />
          <v-switch
            v-model="editGroupForm.isMultiSelect"
            label="복수 선택 허용"
            color="primary"
            hide-details
            density="comfortable"
          />
          <v-alert
            v-if="editGroupError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ editGroupError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editGroupDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editGroupLoading"
            @click="onEditGroupSubmit"
          >
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 태그 그룹 삭제 다이얼로그 ─── -->
    <v-dialog v-model="deleteGroupDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2 d-flex align-center">
          <v-icon start color="error">mdi-delete-outline</v-icon>
          태그 그룹 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteGroupTarget?.name }}</strong> 태그 그룹을 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <v-alert
            v-if="deleteGroupError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ deleteGroupError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteGroupDialog = false">취소</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteGroupLoading"
            @click="onDeleteGroupSubmit"
          >
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 태그 추가 다이얼로그 ─── -->
    <v-dialog v-model="addTagDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-tag-plus-outline</v-icon>
          태그 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="addTagForm.name"
            label="표시명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
            @keyup.enter="onAddTagSubmit"
          />
          <v-text-field
            v-if="showTagValue"
            v-model="addTagForm.tagValue"
            label="실제값 (선택)"
            placeholder="예: 365:825, 12288:1728"
            hint="비율값이 표시명과 다를 경우 입력"
            persistent-hint
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model.number="addTagForm.sortOrder"
            label="정렬 순서 (선택 사항)"
            type="number"
            variant="outlined"
            density="comfortable"
            hint="미입력 시 자동으로 마지막 순서로 세팅됩니다."
            persistent-hint
            clearable
            class="mb-3"
          />
          <v-alert
            v-if="addTagError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ addTagError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addTagDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="addTagLoading"
            @click="onAddTagSubmit"
          >
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 태그 수정 다이얼로그 ─── -->
    <v-dialog v-model="editTagDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-pencil-outline</v-icon>
          태그 수정
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="editTagForm.name"
            label="표시명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
            @keyup.enter="onEditTagSubmit"
          />
          <v-text-field
            v-if="showTagValue"
            v-model="editTagForm.tagValue"
            label="실제값 (선택)"
            placeholder="예: 365:825, 12288:1728"
            hint="비율값이 표시명과 다를 경우 입력"
            persistent-hint
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model.number="editTagForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
          <v-alert
            v-if="editTagError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ editTagError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editTagDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editTagLoading"
            @click="onEditTagSubmit"
          >
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── 태그 삭제 다이얼로그 ─── -->
    <v-dialog v-model="deleteTagDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2 d-flex align-center">
          <v-icon start color="error">mdi-delete-outline</v-icon>
          태그 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteTagTarget?.name }}</strong> 태그를 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <v-alert
            v-if="deleteTagError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ deleteTagError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteTagDialog = false">취소</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteTagLoading"
            @click="onDeleteTagSubmit"
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
