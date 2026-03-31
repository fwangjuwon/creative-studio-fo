<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { useEscClose } from '@/composables/useEscClose'

// ───────────────────────────────────────────────
// 전체 트리 로드
// ───────────────────────────────────────────────
const steps = ref([])
const loading = ref(false)
const selectedStepId = ref(null)
const expandedAttrs = ref([])

const selectedStep = computed(() => steps.value.find(s => s.id === selectedStepId.value) ?? null)

async function fetchSteps() {
  loading.value = true
  try {
    const res = await api.get('/human-prompts/steps')
    steps.value = res.data.data ?? []
  } catch {
    steps.value = []
  } finally {
    loading.value = false
  }
}

function onStepSelect(step) {
  if (selectedStepId.value === step.id) {
    selectedStepId.value = null
    expandedAttrs.value = []
    return
  }
  selectedStepId.value = step.id
  expandedAttrs.value = []
}

onMounted(() => {
  fetchSteps()
})

// ─── Step 추가 ───
const addStepDialog = ref(false)
const addStepForm = ref({ stepNumber: '', stepCode: '', name: '' })
const addStepLoading = ref(false)
const addStepError = ref('')

function onAddStepDialogOpen() {
  addStepForm.value = { stepNumber: '', stepCode: '', name: '' }
  addStepError.value = ''
  addStepDialog.value = true
}

async function onAddStepSubmit() {
  if (!addStepForm.value.stepCode.trim() || !addStepForm.value.name.trim()) {
    addStepError.value = '단계 코드와 단계명을 입력해 주세요.'
    return
  }
  if (steps.value.some(s => s.stepCode === addStepForm.value.stepCode.trim().toUpperCase())) {
    addStepError.value = '이미 존재하는 단계 코드입니다.'
    return
  }
  if (steps.value.some(s => s.name === addStepForm.value.name.trim())) {
    addStepError.value = '이미 존재하는 단계명입니다.'
    return
  }
  addStepLoading.value = true
  addStepError.value = ''
  try {
    await api.post('/human-prompts/steps', {
      stepNumber: Number(addStepForm.value.stepNumber) || 0,
      stepCode: addStepForm.value.stepCode.trim().toUpperCase(),
      name: addStepForm.value.name.trim(),
    })
    addStepDialog.value = false
    await fetchSteps()
  } catch (err) {
    addStepError.value = err.response?.data?.message || '단계 추가 중 오류가 발생했습니다.'
  } finally {
    addStepLoading.value = false
  }
}

// ─── Step 수정 ───
const editStepDialog = ref(false)
const editStepForm = ref({ id: null, stepNumber: '', stepCode: '', name: '' })
const editStepLoading = ref(false)
const editStepError = ref('')

function onEditStepDialogOpen(step) {
  editStepForm.value = { id: step.id, stepNumber: step.stepNumber, stepCode: step.stepCode, name: step.name }
  editStepError.value = ''
  editStepDialog.value = true
}

async function onEditStepSubmit() {
  if (!editStepForm.value.name.trim()) {
    editStepError.value = '단계명을 입력해 주세요.'
    return
  }
  if (steps.value.some(s => s.name === editStepForm.value.name.trim() && s.id !== editStepForm.value.id)) {
    editStepError.value = '이미 존재하는 단계명입니다.'
    return
  }
  editStepLoading.value = true
  editStepError.value = ''
  try {
    await api.put(`/human-prompts/steps/${editStepForm.value.id}`, {
      stepNumber: Number(editStepForm.value.stepNumber) || 0,
      name: editStepForm.value.name.trim(),
    })
    editStepDialog.value = false
    await fetchSteps()
  } catch (err) {
    editStepError.value = err.response?.data?.message || '단계 수정 중 오류가 발생했습니다.'
  } finally {
    editStepLoading.value = false
  }
}

// ─── Step 삭제 ───
const deleteStepDialog = ref(false)
const deleteStepTarget = ref(null)
const deleteStepLoading = ref(false)
const deleteStepError = ref('')

function onDeleteStepDialogOpen(step) {
  deleteStepTarget.value = step
  deleteStepError.value = ''
  deleteStepDialog.value = true
}

async function onDeleteStepSubmit() {
  deleteStepLoading.value = true
  deleteStepError.value = ''
  try {
    await api.delete(`/human-prompts/steps/${deleteStepTarget.value.id}`)
    deleteStepDialog.value = false
    if (selectedStepId.value === deleteStepTarget.value.id) {
      selectedStepId.value = null
      expandedAttrs.value = []
    }
    await fetchSteps()
  } catch (err) {
    deleteStepError.value = err.response?.data?.message || '단계 삭제 중 오류가 발생했습니다.'
  } finally {
    deleteStepLoading.value = false
  }
}

// ─── Attr 추가 ───
const addAttrDialog = ref(false)
const addAttrStepId = ref(null)
const addAttrForm = ref({ name: '', isMultiSelect: false, isRequired: false, sortOrder: 0 })
const addAttrLoading = ref(false)
const addAttrError = ref('')

function onAddAttrDialogOpen(stepId) {
  addAttrStepId.value = stepId
  addAttrForm.value = { name: '', isMultiSelect: false, isRequired: false, sortOrder: 0 }
  addAttrError.value = ''
  addAttrDialog.value = true
}

async function onAddAttrSubmit() {
  if (!addAttrForm.value.name.trim()) {
    addAttrError.value = '세부항목명을 입력해 주세요.'
    return
  }
  const addAttrStep = steps.value.find(s => s.id === addAttrStepId.value)
  if (addAttrStep?.attrs?.some(a => a.name === addAttrForm.value.name.trim())) {
    addAttrError.value = '이미 존재하는 세부항목명입니다.'
    return
  }
  addAttrLoading.value = true
  addAttrError.value = ''
  try {
    await api.post('/human-prompts/attrs', {
      stepId: addAttrStepId.value,
      name: addAttrForm.value.name.trim(),
      isMultiSelect: addAttrForm.value.isMultiSelect,
      isRequired: addAttrForm.value.isRequired,
      sortOrder: Number(addAttrForm.value.sortOrder) || 0,
    })
    addAttrDialog.value = false
    await fetchSteps()
  } catch (err) {
    addAttrError.value = err.response?.data?.message || '세부항목 추가 중 오류가 발생했습니다.'
  } finally {
    addAttrLoading.value = false
  }
}

// ─── Attr 수정 ───
const editAttrDialog = ref(false)
const editAttrForm = ref({ id: null, name: '', isMultiSelect: false, isRequired: false, sortOrder: 0 })
const editAttrLoading = ref(false)
const editAttrError = ref('')

function onEditAttrDialogOpen(attr) {
  // ⚠️ GET 응답: multiSelect, required (is 접두사 없음) → 폼: isMultiSelect, isRequired (is 접두사 있음)
  editAttrForm.value = {
    id: attr.id,
    name: attr.name,
    isMultiSelect: attr.multiSelect ?? false,
    isRequired: attr.required ?? false,
    sortOrder: attr.sortOrder ?? 0,
  }
  editAttrError.value = ''
  editAttrDialog.value = true
}

async function onEditAttrSubmit() {
  if (!editAttrForm.value.name.trim()) {
    editAttrError.value = '세부항목명을 입력해 주세요.'
    return
  }
  const editAttrStep = steps.value.find(s => s.attrs?.some(a => a.id === editAttrForm.value.id))
  if (editAttrStep?.attrs?.some(a => a.name === editAttrForm.value.name.trim() && a.id !== editAttrForm.value.id)) {
    editAttrError.value = '이미 존재하는 세부항목명입니다.'
    return
  }
  editAttrLoading.value = true
  editAttrError.value = ''
  try {
    await api.put(`/human-prompts/attrs/${editAttrForm.value.id}`, {
      name: editAttrForm.value.name.trim(),
      isMultiSelect: editAttrForm.value.isMultiSelect,
      isRequired: editAttrForm.value.isRequired,
      sortOrder: Number(editAttrForm.value.sortOrder) || 0,
    })
    editAttrDialog.value = false
    await fetchSteps()
  } catch (err) {
    editAttrError.value = err.response?.data?.message || '세부항목 수정 중 오류가 발생했습니다.'
  } finally {
    editAttrLoading.value = false
  }
}

// ─── Attr 삭제 ───
const deleteAttrDialog = ref(false)
const deleteAttrTarget = ref(null)
const deleteAttrLoading = ref(false)
const deleteAttrError = ref('')

function onDeleteAttrDialogOpen(attr) {
  deleteAttrTarget.value = attr
  deleteAttrError.value = ''
  deleteAttrDialog.value = true
}

async function onDeleteAttrSubmit() {
  deleteAttrLoading.value = true
  deleteAttrError.value = ''
  try {
    await api.delete(`/human-prompts/attrs/${deleteAttrTarget.value.id}`)
    deleteAttrDialog.value = false
    await fetchSteps()
  } catch (err) {
    deleteAttrError.value = err.response?.data?.message || '세부항목 삭제 중 오류가 발생했습니다.'
  } finally {
    deleteAttrLoading.value = false
  }
}

// ─── Option 추가 ───
const addOptionDialog = ref(false)
const addOptionAttrId = ref(null)
const addOptionForm = ref({ name: '', promptValue: '', sortOrder: 0 })
const addOptionLoading = ref(false)
const addOptionError = ref('')

function onAddOptionDialogOpen(attrId) {
  addOptionAttrId.value = attrId
  addOptionForm.value = { name: '', promptValue: '', sortOrder: 0 }
  addOptionError.value = ''
  addOptionDialog.value = true
}

async function onAddOptionSubmit() {
  if (!addOptionForm.value.name.trim() || !addOptionForm.value.promptValue.trim()) {
    addOptionError.value = '표시명과 영문 프롬프트값을 입력해 주세요.'
    return
  }
  const addOptionAttr = steps.value.flatMap(s => s.attrs ?? []).find(a => a.id === addOptionAttrId.value)
  if (addOptionAttr?.options?.some(o => o.name === addOptionForm.value.name.trim())) {
    addOptionError.value = '이미 존재하는 선택지명입니다.'
    return
  }
  addOptionLoading.value = true
  addOptionError.value = ''
  try {
    await api.post('/human-prompts/options', {
      attrId: addOptionAttrId.value,
      name: addOptionForm.value.name.trim(),
      promptValue: addOptionForm.value.promptValue.trim(),
      sortOrder: Number(addOptionForm.value.sortOrder) || 0,
    })
    addOptionDialog.value = false
    await fetchSteps()
  } catch (err) {
    addOptionError.value = err.response?.data?.message || '선택지 추가 중 오류가 발생했습니다.'
  } finally {
    addOptionLoading.value = false
  }
}

// ─── Option 수정 ───
const editOptionDialog = ref(false)
const editOptionForm = ref({ id: null, name: '', promptValue: '', sortOrder: 0 })
const editOptionLoading = ref(false)
const editOptionError = ref('')

function onEditOptionDialogOpen(option) {
  editOptionForm.value = {
    id: option.id,
    name: option.name,
    promptValue: option.promptValue,
    sortOrder: option.sortOrder ?? 0,
  }
  editOptionError.value = ''
  editOptionDialog.value = true
}

async function onEditOptionSubmit() {
  if (!editOptionForm.value.name.trim() || !editOptionForm.value.promptValue.trim()) {
    editOptionError.value = '표시명과 영문 프롬프트값을 입력해 주세요.'
    return
  }
  const editOptionAttr = steps.value.flatMap(s => s.attrs ?? []).find(a => a.options?.some(o => o.id === editOptionForm.value.id))
  if (editOptionAttr?.options?.some(o => o.name === editOptionForm.value.name.trim() && o.id !== editOptionForm.value.id)) {
    editOptionError.value = '이미 존재하는 선택지명입니다.'
    return
  }
  editOptionLoading.value = true
  editOptionError.value = ''
  try {
    await api.put(`/human-prompts/options/${editOptionForm.value.id}`, {
      name: editOptionForm.value.name.trim(),
      promptValue: editOptionForm.value.promptValue.trim(),
      sortOrder: Number(editOptionForm.value.sortOrder) || 0,
    })
    editOptionDialog.value = false
    await fetchSteps()
  } catch (err) {
    editOptionError.value = err.response?.data?.message || '선택지 수정 중 오류가 발생했습니다.'
  } finally {
    editOptionLoading.value = false
  }
}

// ─── Option 삭제 ───
const deleteOptionDialog = ref(false)
const deleteOptionTarget = ref(null)
const deleteOptionLoading = ref(false)
const deleteOptionError = ref('')

useEscClose(
  addStepDialog, editStepDialog, deleteStepDialog,
  addAttrDialog, editAttrDialog, deleteAttrDialog,
  addOptionDialog, editOptionDialog, deleteOptionDialog
)

function onDeleteOptionDialogOpen(option) {
  deleteOptionTarget.value = option
  deleteOptionError.value = ''
  deleteOptionDialog.value = true
}

async function onDeleteOptionSubmit() {
  deleteOptionLoading.value = true
  deleteOptionError.value = ''
  try {
    await api.delete(`/human-prompts/options/${deleteOptionTarget.value.id}`)
    deleteOptionDialog.value = false
    await fetchSteps()
  } catch (err) {
    deleteOptionError.value = err.response?.data?.message || '선택지 삭제 중 오류가 발생했습니다.'
  } finally {
    deleteOptionLoading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">인물 속성 관리</h2>

    <v-row>
      <!-- ─── Step 패널 (왼쪽) ─── -->
      <v-col cols="12" md="3">
        <v-card variant="outlined" style="min-height: 480px; display: flex; flex-direction: column;">
          <v-card-title class="text-subtitle-2 font-weight-bold pa-3 pb-2 d-flex align-center">
            <v-icon size="small" start>mdi-stairs</v-icon>
            단계 (Step)
            <v-chip
              v-if="steps.length > 0"
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-auto"
            >
              {{ steps.length }}
            </v-chip>
          </v-card-title>
          <v-divider />

          <div v-if="loading" class="d-flex justify-center align-center flex-grow-1 pa-4">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>

          <div
            v-else-if="steps.length === 0"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="32" class="mb-2 d-block mx-auto">mdi-table-off</v-icon>
              <span class="text-caption">단계가 없습니다</span>
            </div>
          </div>

          <v-list
            v-else
            density="compact"
            class="flex-grow-1 py-1"
            style="overflow-y: auto; max-height: 380px;"
          >
            <v-list-item
              v-for="step in steps"
              :key="step.id"
              :active="selectedStepId === step.id"
              active-color="primary"
              class="px-3"
              style="cursor: pointer;"
              @click="onStepSelect(step)"
            >
              <template #title>
                <span class="text-body-2 font-weight-medium">{{ step.stepCode }}.</span>
                <span class="text-body-2 ml-1">{{ step.name }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption text-medium-emphasis">순서: {{ step.stepNumber }}</span>
              </template>
              <template #append>
                <div class="d-flex gap-1" @click.stop>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="onEditStepDialogOpen(step)"
                  >
                    <v-icon size="14">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="onDeleteStepDialogOpen(step)"
                  >
                    <v-icon size="14">mdi-delete</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider />
          <div class="pa-2">
            <v-btn
              block
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-plus"
              @click="onAddStepDialogOpen"
            >
              단계 추가
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- ─── Attr + Option 패널 (오른쪽) ─── -->
      <v-col cols="12" md="9">
        <v-card variant="outlined" style="min-height: 480px; display: flex; flex-direction: column;">
          <v-card-title class="text-subtitle-2 font-weight-bold pa-3 pb-2 d-flex align-center">
            <v-icon size="small" start>mdi-format-list-bulleted</v-icon>
            세부항목 (Attr)
            <span v-if="selectedStep" class="ml-1 text-primary">
              — {{ selectedStep.stepCode }}. {{ selectedStep.name }}
            </span>
            <v-chip
              v-if="selectedStep?.attrs?.length > 0"
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-auto"
            >
              {{ selectedStep.attrs.length }}
            </v-chip>
          </v-card-title>
          <v-divider />

          <!-- Step 미선택 -->
          <div
            v-if="!selectedStepId"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="40" class="mb-2 d-block mx-auto">mdi-arrow-left</v-icon>
              <span class="text-caption">단계를 먼저 선택하세요</span>
            </div>
          </div>

          <!-- Attr 없음 -->
          <div
            v-else-if="!selectedStep?.attrs?.length"
            class="d-flex justify-center align-center flex-grow-1 pa-4 text-center text-medium-emphasis"
          >
            <div>
              <v-icon size="40" class="mb-2 d-block mx-auto">mdi-format-list-bulleted-type</v-icon>
              <span class="text-caption">세부항목이 없습니다</span>
            </div>
          </div>

          <!-- Attr 목록 (확장 패널) -->
          <div
            v-else
            class="flex-grow-1 pa-2"
            style="overflow-y: auto; max-height: 420px;"
          >
            <v-expansion-panels v-model="expandedAttrs" multiple variant="accordion">
              <v-expansion-panel
                v-for="attr in selectedStep.attrs"
                :key="attr.id"
                :value="attr.id"
              >
                <v-expansion-panel-title class="py-2 px-3">
                  <div class="d-flex align-center flex-grow-1 mr-2 flex-wrap gap-1">
                    <span class="text-body-2 font-weight-medium">{{ attr.name }}</span>
                    <v-chip
                      size="x-small"
                      :color="attr.multiSelect ? 'teal' : 'blue-grey'"
                      variant="tonal"
                    >
                      {{ attr.multiSelect ? '복수 선택' : '단일 선택' }}
                    </v-chip>
                    <v-chip v-if="attr.required" size="x-small" color="error" variant="tonal">
                      필수
                    </v-chip>
                    <span class="text-caption text-medium-emphasis">정렬: {{ attr.sortOrder }}</span>
                  </div>
                  <div class="d-flex gap-1 mr-1" @click.stop>
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="onEditAttrDialogOpen(attr)"
                    >
                      <v-icon size="14">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="onDeleteAttrDialogOpen(attr)"
                    >
                      <v-icon size="14">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pt-1 pb-2">
                  <!-- Option 목록 -->
                  <v-list v-if="attr.options?.length > 0" density="compact" class="pa-0 mb-2">
                    <v-list-item
                      v-for="option in attr.options"
                      :key="option.id"
                      class="px-2 rounded"
                    >
                      <template #prepend>
                        <v-icon size="small" color="medium-emphasis">mdi-circle-small</v-icon>
                      </template>
                      <template #title>
                        <span class="text-body-2">{{ option.name }}</span>
                        <span class="text-caption text-medium-emphasis ml-2">/ {{ option.promptValue }}</span>
                      </template>
                      <template #subtitle>
                        <span class="text-caption text-medium-emphasis">정렬: {{ option.sortOrder }}</span>
                      </template>
                      <template #append>
                        <div class="d-flex gap-1">
                          <v-btn
                            icon
                            size="x-small"
                            variant="text"
                            color="primary"
                            @click="onEditOptionDialogOpen(option)"
                          >
                            <v-icon size="14">mdi-pencil</v-icon>
                          </v-btn>
                          <v-btn
                            icon
                            size="x-small"
                            variant="text"
                            color="error"
                            @click="onDeleteOptionDialogOpen(option)"
                          >
                            <v-icon size="14">mdi-delete</v-icon>
                          </v-btn>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>

                  <div v-else class="text-caption text-medium-emphasis px-2 mb-2">
                    선택지가 없습니다.
                  </div>

                  <div class="px-2">
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click="onAddOptionDialogOpen(attr.id)"
                    >
                      선택지 추가
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <v-divider />
          <div class="pa-2">
            <v-btn
              block
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-plus"
              :disabled="!selectedStepId"
              @click="onAddAttrDialogOpen(selectedStepId)"
            >
              세부항목 추가
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── Step 추가 다이얼로그 ─── -->
    <v-dialog v-model="addStepDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-plus-circle-outline</v-icon>
          단계 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model.number="addStepForm.stepNumber"
            label="순서 번호"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />
          <v-text-field
            v-model="addStepForm.stepCode"
            label="단계 코드 (생성 후 수정 불가)"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            hint="알파벳 권장 (A, B, C…)"
            persistent-hint
            class="mb-3"
          />
          <v-text-field
            v-model="addStepForm.name"
            label="단계명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            @keyup.enter="onAddStepSubmit"
          />
          <v-alert
            v-if="addStepError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ addStepError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addStepDialog = false">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="addStepLoading" @click="onAddStepSubmit">
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Step 수정 다이얼로그 ─── -->
    <v-dialog v-model="editStepDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-pencil-outline</v-icon>
          단계 수정
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model.number="editStepForm.stepNumber"
            label="순서 번호"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />
          <v-text-field
            v-model="editStepForm.stepCode"
            label="단계 코드 (수정 불가)"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
            disabled
          />
          <v-text-field
            v-model="editStepForm.name"
            label="단계명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            @keyup.enter="onEditStepSubmit"
          />
          <v-alert
            v-if="editStepError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ editStepError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editStepDialog = false">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="editStepLoading" @click="onEditStepSubmit">
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Step 삭제 다이얼로그 ─── -->
    <v-dialog v-model="deleteStepDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2 d-flex align-center">
          <v-icon start color="error">mdi-delete-outline</v-icon>
          단계 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteStepTarget?.stepCode }}. {{ deleteStepTarget?.name }}</strong> 단계를 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <v-alert
            v-if="deleteStepError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ deleteStepError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteStepDialog = false">취소</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteStepLoading" @click="onDeleteStepSubmit">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Attr 추가 다이얼로그 ─── -->
    <v-dialog v-model="addAttrDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-plus-circle-outline</v-icon>
          세부항목 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="addAttrForm.name"
            label="세부항목명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
            @keyup.enter="onAddAttrSubmit"
          />
          <v-text-field
            v-model.number="addAttrForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />
          <v-switch
            v-model="addAttrForm.isMultiSelect"
            label="복수 선택 허용"
            color="primary"
            hide-details
            density="comfortable"
            class="mb-1"
          />
          <v-switch
            v-model="addAttrForm.isRequired"
            label="필수 선택"
            color="error"
            hide-details
            density="comfortable"
          />
          <v-alert
            v-if="addAttrError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ addAttrError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addAttrDialog = false">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="addAttrLoading" @click="onAddAttrSubmit">
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Attr 수정 다이얼로그 ─── -->
    <v-dialog v-model="editAttrDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-pencil-outline</v-icon>
          세부항목 수정
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="editAttrForm.name"
            label="세부항목명"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
            @keyup.enter="onEditAttrSubmit"
          />
          <v-text-field
            v-model.number="editAttrForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />
          <v-switch
            v-model="editAttrForm.isMultiSelect"
            label="복수 선택 허용"
            color="primary"
            hide-details
            density="comfortable"
            class="mb-1"
          />
          <v-switch
            v-model="editAttrForm.isRequired"
            label="필수 선택"
            color="error"
            hide-details
            density="comfortable"
          />
          <v-alert
            v-if="editAttrError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ editAttrError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editAttrDialog = false">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="editAttrLoading" @click="onEditAttrSubmit">
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Attr 삭제 다이얼로그 ─── -->
    <v-dialog v-model="deleteAttrDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2 d-flex align-center">
          <v-icon start color="error">mdi-delete-outline</v-icon>
          세부항목 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteAttrTarget?.name }}</strong> 세부항목을 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <v-alert
            v-if="deleteAttrError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ deleteAttrError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteAttrDialog = false">취소</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteAttrLoading" @click="onDeleteAttrSubmit">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Option 추가 다이얼로그 ─── -->
    <v-dialog v-model="addOptionDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-plus-circle-outline</v-icon>
          선택지 추가
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="addOptionForm.name"
            label="표시명 (한국어)"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
          />
          <v-text-field
            v-model="addOptionForm.promptValue"
            label="영문 프롬프트값"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            hint="Gemini API에 전달되는 영문값 (예: male, short hair)"
            persistent-hint
            class="mb-3"
          />
          <v-text-field
            v-model.number="addOptionForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
          <v-alert
            v-if="addOptionError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ addOptionError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addOptionDialog = false">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="addOptionLoading" @click="onAddOptionSubmit">
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Option 수정 다이얼로그 ─── -->
    <v-dialog v-model="editOptionDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2">
          <v-icon start>mdi-pencil-outline</v-icon>
          선택지 수정
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="editOptionForm.name"
            label="표시명 (한국어)"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            class="mb-3"
          />
          <v-text-field
            v-model="editOptionForm.promptValue"
            label="영문 프롬프트값"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            hint="Gemini API에 전달되는 영문값 (예: male, short hair)"
            persistent-hint
            class="mb-3"
          />
          <v-text-field
            v-model.number="editOptionForm.sortOrder"
            label="정렬 순서"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
          <v-alert
            v-if="editOptionError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ editOptionError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editOptionDialog = false">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="editOptionLoading" @click="onEditOptionSubmit">
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Option 삭제 다이얼로그 ─── -->
    <v-dialog v-model="deleteOptionDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4 pb-2 d-flex align-center">
          <v-icon start color="error">mdi-delete-outline</v-icon>
          선택지 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-2">
            <strong>{{ deleteOptionTarget?.name }}</strong> 선택지를 삭제하시겠습니까?
          </p>
          <p class="text-body-2 text-medium-emphasis">이 작업은 되돌릴 수 없습니다.</p>
          <v-alert
            v-if="deleteOptionError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ deleteOptionError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteOptionDialog = false">취소</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteOptionLoading" @click="onDeleteOptionSubmit">
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
