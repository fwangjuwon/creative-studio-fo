<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api'

// ───────────────────────────────────────────────
// 탭 관리
// ───────────────────────────────────────────────
const activeTab = ref('product')

// ═══════════════════════════════════════════════
// TAB 1: 상품 사진 프롬프트
// ═══════════════════════════════════════════════

// ───────────────────────────────────────────────
// 카테고리 드릴다운
// ───────────────────────────────────────────────
const lcsItems = ref([])
const mcsItems = ref([])
const scsItems = ref([])
const dcsItems = ref([])

const selectedLcs = ref(null)
const selectedMcs = ref(null)
const selectedScs = ref(null)
const selectedDcs = ref(null)

const loadingLcs = ref(false)
const loadingMcs = ref(false)
const loadingScs = ref(false)
const loadingDcs = ref(false)

async function fetchCategories(parentId = null) {
  const params = parentId ? { parentId } : {}
  const res = await api.get('/categories', { params })
  return res.data.data ?? []
}

onMounted(async () => {
  loadingLcs.value = true
  try {
    lcsItems.value = await fetchCategories()
  } finally {
    loadingLcs.value = false
  }
  fetchTagGroups()
})

watch(selectedLcs, async (val) => {
  selectedMcs.value = null
  selectedScs.value = null
  selectedDcs.value = null
  mcsItems.value = []
  scsItems.value = []
  dcsItems.value = []
  if (!val) return
  loadingMcs.value = true
  try {
    mcsItems.value = await fetchCategories(val)
  } finally {
    loadingMcs.value = false
  }
})

watch(selectedMcs, async (val) => {
  selectedScs.value = null
  selectedDcs.value = null
  scsItems.value = []
  dcsItems.value = []
  if (!val) return
  loadingScs.value = true
  try {
    scsItems.value = await fetchCategories(val)
  } finally {
    loadingScs.value = false
  }
})

watch(selectedScs, async (val) => {
  selectedDcs.value = null
  dcsItems.value = []
  if (!val) return
  loadingDcs.value = true
  try {
    dcsItems.value = await fetchCategories(val)
  } finally {
    loadingDcs.value = false
  }
})

// ───────────────────────────────────────────────
// 태그 그룹 & 태그
// ───────────────────────────────────────────────
const tagGroups = ref([])
const tagsByGroup = ref({})
const selectedTags = ref({})
const loadingTags = ref(false)

async function fetchTagGroups() {
  loadingTags.value = true
  try {
    const res = await api.get('/tag-groups')
    tagGroups.value = res.data.data ?? []
    await Promise.all(
      tagGroups.value.map(async (group) => {
        const r = await api.get('/tags', { params: { tagGroupId: group.id } })
        tagsByGroup.value[group.id] = r.data.data ?? []
        selectedTags.value[group.id] = group.isMultiSelect ? [] : null
      })
    )
  } finally {
    loadingTags.value = false
  }
}

function toggleTag(group, tagId) {
  if (group.isMultiSelect) {
    const arr = selectedTags.value[group.id]
    const idx = arr.indexOf(tagId)
    if (idx === -1) arr.push(tagId)
    else arr.splice(idx, 1)
  } else {
    selectedTags.value[group.id] =
      selectedTags.value[group.id] === tagId ? null : tagId
  }
}

function isTagSelected(group, tagId) {
  if (group.isMultiSelect) {
    return selectedTags.value[group.id]?.includes(tagId) ?? false
  }
  return selectedTags.value[group.id] === tagId
}

const allSelectedTagIds = computed(() => {
  const ids = []
  for (const group of tagGroups.value) {
    const val = selectedTags.value[group.id]
    if (group.isMultiSelect) {
      if (Array.isArray(val)) ids.push(...val)
    } else {
      if (val !== null && val !== undefined) ids.push(val)
    }
  }
  return ids
})

// ───────────────────────────────────────────────
// Tab 1 프롬프트 생성
// ───────────────────────────────────────────────
const canGenerate = computed(() => !!selectedDcs.value)
const generating = ref(false)
const generatedPrompt = ref('')
const errorMessage = ref('')
const copied = ref(false)

async function generatePrompt() {
  if (!canGenerate.value) return
  generating.value = true
  errorMessage.value = ''
  generatedPrompt.value = ''

  try {
    const res = await api.post('/prompts', {
      categoryId: selectedDcs.value,
      tagIds: allSelectedTagIds.value,
    })
    generatedPrompt.value = res.data.data?.promptText ?? res.data.data ?? ''
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'P001') {
      errorMessage.value = '오늘 프롬프트 생성 한도를 초과했습니다. 내일 다시 시도해 주세요.'
    } else {
      errorMessage.value =
        err.response?.data?.message || '프롬프트 생성 중 오류가 발생했습니다.'
    }
  } finally {
    generating.value = false
  }
}

async function copyToClipboard() {
  if (!generatedPrompt.value) return
  try {
    await navigator.clipboard.writeText(generatedPrompt.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = generatedPrompt.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function regenerate() {
  generatePrompt()
}


// ═══════════════════════════════════════════════
// TAB 2: 인물 사진 프롬프트
// ═══════════════════════════════════════════════

// ───────────────────────────────────────────────
// 단계 구조 로드
// ───────────────────────────────────────────────
const personSteps = ref([])
const loadingSteps = ref(false)
const stepsLoaded = ref(false)

async function fetchPersonSteps() {
  if (stepsLoaded.value) return
  loadingSteps.value = true
  try {
    const res = await api.get('/human-prompts/steps')
    personSteps.value = res.data.data ?? []
    // 선택 상태 초기화: { attrId: [] } — 단/복수 통일해서 항상 배열
    for (const step of personSteps.value) {
      for (const attr of step.attrs ?? []) {
        personSelectedOptions.value[attr.id] = []
      }
    }
    stepsLoaded.value = true
  } finally {
    loadingSteps.value = false
  }
}

// Tab 2로 전환될 때 단계 데이터 로드
watch(activeTab, (val) => {
  if (val === 'person') fetchPersonSteps()
})

// ───────────────────────────────────────────────
// 옵션 선택 상태 관리
// { attrId: [optionId, ...] }
// ───────────────────────────────────────────────
const personSelectedOptions = ref({})  // attrId → optionId[]

function togglePersonOption(attr, optionId) {
  const arr = personSelectedOptions.value[attr.id] ?? []
  if (attr.multiSelect) {
    // 복수 선택
    const idx = arr.indexOf(optionId)
    if (idx === -1) arr.push(optionId)
    else arr.splice(idx, 1)
    personSelectedOptions.value[attr.id] = arr
  } else {
    // 단일 선택 (이미 선택된 경우 해제)
    if (arr.includes(optionId)) {
      personSelectedOptions.value[attr.id] = []
    } else {
      personSelectedOptions.value[attr.id] = [optionId]
    }
  }
}

function isPersonOptionSelected(attrId, optionId) {
  return personSelectedOptions.value[attrId]?.includes(optionId) ?? false
}

// ───────────────────────────────────────────────
// Tab 2 생성 목적 / 추가 지시
// ───────────────────────────────────────────────
const personPurpose = ref('')
const personAdditionalNotes = ref('')

// ───────────────────────────────────────────────
// Tab 2 프롬프트 생성
// ───────────────────────────────────────────────
const generatingPerson = ref(false)
const generatedPersonPrompt = ref('')
const personErrorMessage = ref('')
const personCopied = ref(false)

// ───────────────────────────────────────────────
// Tab 2 이미지 생성 (NanaBanana)
// ───────────────────────────────────────────────
const personPromptHistoryId = ref(null)  // 프롬프트 생성 시 저장된 history ID
const generatingImage = ref(false)
const generatedImageUrl = ref('')
const imageErrorMessage = ref('')

async function generatePersonImage() {
  if (!generatedPersonPrompt.value) return
  generatingImage.value = true
  imageErrorMessage.value = ''
  generatedImageUrl.value = ''

  try {
    const res = await api.post('/human-prompts/generate-image', {
      historyId: personPromptHistoryId.value,
      promptText: generatedPersonPrompt.value,
    }, { timeout: 120000 })  // 이미지 생성은 시간이 오래 걸리므로 2분으로 설정
    generatedImageUrl.value = res.data.data?.imageUrl ?? ''
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      imageErrorMessage.value = '이미지 생성 시간이 초과되었습니다. 다시 시도해 주세요.'
    } else {
      imageErrorMessage.value =
        err.response?.data?.message || '이미지 생성 중 오류가 발생했습니다.'
    }
  } finally {
    generatingImage.value = false
  }
}

async function generatePersonPrompt() {
  generatingPerson.value = true
  personErrorMessage.value = ''
  generatedPersonPrompt.value = ''
  personPromptHistoryId.value = null
  generatedImageUrl.value = ''

  try {
    // selections: { attrId: [optionId, ...] } — 빈 배열인 attr은 제외
    const selections = {}
    for (const [attrId, optionIds] of Object.entries(personSelectedOptions.value)) {
      if (optionIds.length > 0) {
        selections[attrId] = optionIds
      }
    }

    const res = await api.post('/human-prompts', {
      selections,
      purpose: personPurpose.value || null,
      additionalNotes: personAdditionalNotes.value || null,
    })
    // 이력 ID와 프롬프트 텍스트 분리 저장
    personPromptHistoryId.value = res.data.data?.id ?? null
    generatedPersonPrompt.value = res.data.data?.promptText ?? ''
  } catch (err) {
    personErrorMessage.value =
      err.response?.data?.message || '프롬프트 생성 중 오류가 발생했습니다.'
  } finally {
    generatingPerson.value = false
  }
}

async function copyPersonToClipboard() {
  if (!generatedPersonPrompt.value) return
  try {
    await navigator.clipboard.writeText(generatedPersonPrompt.value)
    personCopied.value = true
    setTimeout(() => { personCopied.value = false }, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = generatedPersonPrompt.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    personCopied.value = true
    setTimeout(() => { personCopied.value = false }, 2000)
  }
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-4">프롬프트 생성</h2>

    <!-- ─── 탭 전환 ─── -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6">
      <v-tab value="product">
        <v-icon start>mdi-image-outline</v-icon>
        상품 사진 프롬프트
      </v-tab>
      <v-tab value="person">
        <v-icon start>mdi-account-outline</v-icon>
        인물 사진 프롬프트
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">

      <!-- ════════════════════════════════════
           TAB 1: 상품 사진 프롬프트
           ════════════════════════════════════ -->
      <v-tabs-window-item value="product">

        <!-- ─── 카테고리 선택 ─── -->
        <v-card class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
            <v-icon start>mdi-tag-multiple</v-icon>
            카테고리 선택
            <v-chip size="x-small" color="error" class="ml-2">필수</v-chip>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="selectedLcs"
                  :items="lcsItems"
                  item-title="name"
                  item-value="id"
                  label="대분류"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingLcs"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="selectedMcs"
                  :items="mcsItems"
                  item-title="name"
                  item-value="id"
                  label="중분류"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingMcs"
                  :disabled="!selectedLcs"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="selectedScs"
                  :items="scsItems"
                  item-title="name"
                  item-value="id"
                  label="소분류"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingScs"
                  :disabled="!selectedMcs"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="selectedDcs"
                  :items="dcsItems"
                  item-title="name"
                  item-value="id"
                  label="세분류"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingDcs"
                  :disabled="!selectedScs"
                  clearable
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ─── 태그 선택 ─── -->
        <v-card class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
            <v-icon start>mdi-label-multiple</v-icon>
            태그 선택
            <span class="text-caption text-medium-emphasis ml-2">(선택 사항)</span>
          </v-card-title>
          <v-card-text>
            <v-progress-circular v-if="loadingTags" indeterminate color="primary" class="d-block mx-auto my-4" />
            <template v-else-if="tagGroups.length === 0">
              <v-alert type="info" variant="tonal" density="compact">등록된 태그 그룹이 없습니다.</v-alert>
            </template>
            <template v-else>
              <div
                v-for="group in tagGroups"
                :key="group.id"
                class="mb-4"
              >
                <div class="d-flex align-center mb-2">
                  <span class="text-body-2 font-weight-medium">{{ group.name }}</span>
                  <v-chip
                    size="x-small"
                    :color="group.isMultiSelect ? 'blue' : 'purple'"
                    class="ml-2"
                    variant="tonal"
                  >
                    {{ group.isMultiSelect ? '복수 선택' : '단일 선택' }}
                  </v-chip>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <v-chip
                    v-for="tag in tagsByGroup[group.id]"
                    :key="tag.id"
                    :color="isTagSelected(group, tag.id) ? 'primary' : 'default'"
                    :variant="isTagSelected(group, tag.id) ? 'flat' : 'outlined'"
                    class="cursor-pointer"
                    @click="toggleTag(group, tag.id)"
                  >
                    {{ tag.name }}
                  </v-chip>
                </div>
                <v-divider v-if="tagGroups.indexOf(group) < tagGroups.length - 1" class="mt-4" />
              </div>
            </template>
          </v-card-text>
        </v-card>

        <!-- ─── 생성 버튼 ─── -->
        <div class="d-flex justify-center mb-6">
          <v-btn
            color="primary"
            size="large"
            :disabled="!canGenerate"
            :loading="generating"
            prepend-icon="mdi-creation"
            @click="generatePrompt"
          >
            프롬프트 생성
          </v-btn>
        </div>

        <!-- ─── 에러 메시지 ─── -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <!-- ─── 생성 결과 ─── -->
        <v-card v-if="generatedPrompt" variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
            <v-icon start color="success">mdi-check-circle</v-icon>
            생성된 프롬프트
          </v-card-title>
          <v-card-text>
            <v-textarea
              :model-value="generatedPrompt"
              readonly
              variant="outlined"
              rows="6"
              auto-grow
              hide-details
              class="mb-3 font-mono"
            />
            <div class="d-flex gap-2">
              <v-btn
                :color="copied ? 'success' : 'primary'"
                variant="tonal"
                :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
                @click="copyToClipboard"
              >
                {{ copied ? '복사됨!' : '클립보드 복사' }}
              </v-btn>
              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-refresh"
                :loading="generating"
                @click="regenerate"
              >
                재생성
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

      </v-tabs-window-item>

      <!-- ════════════════════════════════════
           TAB 2: 인물 사진 프롬프트
           ════════════════════════════════════ -->
      <v-tabs-window-item value="person">

        <!-- 로딩 -->
        <div v-if="loadingSteps" class="d-flex justify-center my-8">
          <v-progress-circular indeterminate color="primary" size="48" />
        </div>

        <template v-else>

          <!-- 5단계 선택 카드 -->
          <v-card
            v-for="step in personSteps"
            :key="step.id"
            class="mb-4"
            variant="outlined"
          >
            <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
              <v-chip size="small" color="primary" variant="flat" class="mr-2">
                {{ step.stepNumber }}단계
              </v-chip>
              {{ step.name }}
            </v-card-title>
            <v-card-text>
              <div
                v-for="attr in step.attrs"
                :key="attr.id"
                class="mb-5"
              >
                <!-- 항목 헤더 -->
                <div class="d-flex align-center flex-wrap gap-1 mb-2">
                  <span class="text-body-2 font-weight-medium">{{ attr.name }}</span>
                  <v-chip
                    v-if="attr.multiSelect"
                    size="x-small"
                    color="blue"
                    variant="tonal"
                  >
                    복수 선택
                  </v-chip>
                  <v-chip
                    v-else
                    size="x-small"
                    color="purple"
                    variant="tonal"
                  >
                    단일 선택
                  </v-chip>
                  <v-chip
                    v-if="attr.required"
                    size="x-small"
                    color="error"
                    variant="tonal"
                  >
                    필수
                  </v-chip>
                </div>

                <!-- 옵션 chips -->
                <div class="d-flex flex-wrap gap-2">
                  <v-chip
                    v-for="option in attr.options"
                    :key="option.id"
                    :color="isPersonOptionSelected(attr.id, option.id) ? 'primary' : 'default'"
                    :variant="isPersonOptionSelected(attr.id, option.id) ? 'flat' : 'outlined'"
                    class="cursor-pointer"
                    @click="togglePersonOption(attr, option.id)"
                  >
                    {{ option.name }}
                  </v-chip>
                </div>

                <v-divider
                  v-if="step.attrs.indexOf(attr) < step.attrs.length - 1"
                  class="mt-4"
                />
              </div>
            </v-card-text>
          </v-card>

          <!-- 생성 목적 / 추가 지시 -->
          <v-card class="mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
              <v-icon start>mdi-tune</v-icon>
              추가 옵션
              <span class="text-caption text-medium-emphasis ml-2">(선택 사항)</span>
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="personPurpose"
                label="생성 목적"
                placeholder="예: SNS 광고용, 커머스 상세페이지, 포트폴리오"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details
                class="mb-4"
              />
              <v-textarea
                v-model="personAdditionalNotes"
                label="추가 지시 사항"
                placeholder="Gemini에게 직접 전달할 내용을 자유롭게 입력하세요"
                variant="outlined"
                density="comfortable"
                rows="2"
                auto-grow
                clearable
                hide-details
              />
            </v-card-text>
          </v-card>

          <!-- 생성 버튼 -->
          <div class="d-flex justify-center mb-6">
            <v-btn
              color="primary"
              size="large"
              :loading="generatingPerson"
              prepend-icon="mdi-account-star"
              @click="generatePersonPrompt"
            >
              인물 프롬프트 생성
            </v-btn>
          </div>

          <!-- 에러 메시지 -->
          <v-alert
            v-if="personErrorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="personErrorMessage = ''"
          >
            {{ personErrorMessage }}
          </v-alert>

          <!-- 생성 결과 -->
          <v-card v-if="generatedPersonPrompt" variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
              <v-icon start color="success">mdi-check-circle</v-icon>
              생성된 인물 프롬프트
            </v-card-title>
            <v-card-text>
              <v-textarea
                :model-value="generatedPersonPrompt"
                readonly
                variant="outlined"
                rows="6"
                auto-grow
                hide-details
                class="mb-3 font-mono"
              />
              <div class="d-flex gap-2">
                <v-btn
                  :color="personCopied ? 'success' : 'primary'"
                  variant="tonal"
                  :prepend-icon="personCopied ? 'mdi-check' : 'mdi-content-copy'"
                  @click="copyPersonToClipboard"
                >
                  {{ personCopied ? '복사됨!' : '클립보드 복사' }}
                </v-btn>
                <v-btn
                  color="secondary"
                  variant="tonal"
                  prepend-icon="mdi-refresh"
                  :loading="generatingPerson"
                  @click="generatePersonPrompt"
                >
                  재생성
                </v-btn>
                <v-btn
                  color="deep-purple"
                  variant="tonal"
                  prepend-icon="mdi-image-spark"
                  :loading="generatingImage"
                  @click="generatePersonImage"
                >
                  이미지 생성
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- 이미지 생성 에러 -->
          <v-alert
            v-if="imageErrorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="imageErrorMessage = ''"
          >
            {{ imageErrorMessage }}
          </v-alert>

          <!-- 생성된 이미지 -->
          <v-card v-if="generatedImageUrl" variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
              <v-icon start color="deep-purple">mdi-image-check</v-icon>
              생성된 이미지
            </v-card-title>
            <v-card-text class="text-center">
              <img
                :src="generatedImageUrl"
                style="max-width: 512px; width: 100%; border-radius: 8px;"
                alt="생성된 이미지"
              />
              <div class="text-caption text-medium-emphasis mt-2">{{ generatedImageUrl }}</div>
            </v-card-text>
          </v-card>

        </template>
      </v-tabs-window-item>

    </v-tabs-window>
  </div>
</template>

<style scoped>
.font-mono :deep(textarea) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
