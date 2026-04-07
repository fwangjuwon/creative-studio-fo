<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

const route = useRoute()
const refreshUsage = inject('refreshUsage', () => {})

// ───────────────────────────────────────────────
// 탭 관리
// ───────────────────────────────────────────────
// 홈에서 카드 클릭 시 ?tab=product 또는 ?tab=person query로 탭 반영
// immediate: true — 최초 마운트 + keep-alive 재활성화 + query 변경 모두 대응
const activeTab = ref('product')
watch(() => route.query.tab, (tab) => {
  activeTab.value = tab === 'person' ? 'person' : 'product'
}, { immediate: true })

// ═══════════════════════════════════════════════
// TAB 1: 상품 사진 프롬프트
// ═══════════════════════════════════════════════

// ───────────────────────────────────────────────
// 카테고리 드릴다운
// ───────────────────────────────────────────────
const lcsItems = ref([])
const mcsItems = ref([])
const scsItems = ref([])

const selectedLcs = ref(null)
const selectedMcs = ref(null)
const selectedScs = ref(null)

const loadingLcs = ref(false)
const loadingMcs = ref(false)
const loadingScs = ref(false)

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
  mcsItems.value = []
  scsItems.value = []
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
  scsItems.value = []
  if (!val) return
  loadingScs.value = true
  try {
    scsItems.value = await fetchCategories(val)
  } finally {
    loadingScs.value = false
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

function onTagToggle(group, tagId) {
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

const imageSizeGroup = computed(() =>
  tagGroups.value.find(g => g.name === '이미지 사이즈') ?? null
)

const selectedImageAspectRatio = computed(() => {
  if (!imageSizeGroup.value) return null
  const tagId = selectedTags.value[imageSizeGroup.value.id]
  if (!tagId) return null
  return tagsByGroup.value[imageSizeGroup.value.id]?.find(t => t.id === tagId)?.name ?? null
})

const allSelectedTagIds = computed(() => {
  const ids = []
  for (const group of tagGroups.value) {
    if (imageSizeGroup.value && group.id === imageSizeGroup.value.id) continue  // 이미지 사이즈는 별도 전송
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
// Tab 1 추가 옵션
// ───────────────────────────────────────────────
const productPurpose = ref('')
const productAdditionalNotes = ref('')

// ───────────────────────────────────────────────
// Tab 1 프롬프트 생성
// ───────────────────────────────────────────────
const canGenerate = computed(() => !!selectedScs.value)
// 현재 생성 중인 스타일: null | 'NANO_BANANA' | 'MID_JOURNEY'
const generatingStyle = ref(null)
const generating = computed(() => generatingStyle.value !== null)
const goodsPromptHistoryId = ref(null)  // 프롬프트 생성 시 저장된 history ID
const generatedPrompt = ref('')
const generatedStyle = ref('')   // 마지막으로 생성된 스타일 (결과 카드 뱃지 표시용)
const errorMessage = ref('')
const copied = ref(false)

// ───────────────────────────────────────────────
// Tab 1 이미지 생성 (NanoBanana)
// ───────────────────────────────────────────────
const generatedGoodsImageUrls = ref([])
const generatingGoodsImage = ref(false)
const goodsImageErrorMessage = ref('')
const goodsReferenceImage = ref(null)       // File 객체
const goodsReferenceImagePreview = ref('')  // ObjectURL (미리보기)
const goodsGeneratedAspectRatio = ref('1:1')  // 이미지 생성 시점에 캡처한 종횡비

const goodsImageAspectRatioValue = computed(() => {
  const [w, h] = goodsGeneratedAspectRatio.value.split(':').map(Number)
  return w / h
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_IMAGE_SIZE_MB = 10
const goodsReferenceImageError = ref('')

async function onGeneratePrompt(promptStyle = 'NANO_BANANA') {
  if (!canGenerate.value) return
  generatingStyle.value = promptStyle
  errorMessage.value = ''
  generatedPrompt.value = ''
  goodsPromptHistoryId.value = null
  generatedGoodsImageUrls.value = []

  try {
    const res = await api.post('/prompts/goods', {
      goodsCategoryId: selectedScs.value,
      tagIds: allSelectedTagIds.value,
      imageAspectRatio: selectedImageAspectRatio.value,
      promptStyle,
      purpose: productPurpose.value || null,
      additionalNotes: productAdditionalNotes.value || null,
    }, { timeout: 60000 })
    goodsPromptHistoryId.value = res.data.data?.id ?? null
    generatedPrompt.value = res.data.data?.promptText ?? res.data.data ?? ''

    generatedStyle.value = promptStyle
    generatedGoodsImageUrls.value = []
    refreshUsage()  // 앱바 사용량 즉시 갱신
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'P001') {
      errorMessage.value = '오늘 프롬프트 생성 한도를 초과했습니다. 내일 다시 시도해 주세요.'
    } else {
      errorMessage.value =
        err.response?.data?.message || '프롬프트 생성 중 오류가 발생했습니다.'
    }
  } finally {
    generatingStyle.value = null
  }
}

async function onCopyToClipboard() {
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

function onRegenerate() {
  onGeneratePrompt(generatedStyle.value || 'NANO_BANANA')
}

function onGoodsReferenceImageChange(file) {
  goodsReferenceImageError.value = ''
  if (!file) {
    goodsReferenceImage.value = null
    goodsReferenceImagePreview.value = ''
    return
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    goodsReferenceImageError.value = `이미지 파일만 첨부할 수 있습니다. (허용: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')})`
    goodsReferenceImage.value = null
    goodsReferenceImagePreview.value = ''
    fileInputKey.value++
    return
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    goodsReferenceImageError.value = `허용되지 않는 확장자입니다. (허용: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')})`
    goodsReferenceImage.value = null
    goodsReferenceImagePreview.value = ''
    fileInputKey.value++
    return
  }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > MAX_IMAGE_SIZE_MB) {
    goodsReferenceImageError.value = `파일 크기가 너무 큽니다. (최대 ${MAX_IMAGE_SIZE_MB}MB, 현재 ${sizeMB.toFixed(1)}MB)`
    goodsReferenceImage.value = null
    goodsReferenceImagePreview.value = ''
    fileInputKey.value++
    return
  }

  goodsReferenceImage.value = file
  goodsReferenceImagePreview.value = URL.createObjectURL(file)
}

async function generateGoodsImage() {
  if (!generatedPrompt.value) return
  generatingGoodsImage.value = true
  goodsImageErrorMessage.value = ''
  generatedGoodsImageUrls.value = []
  goodsGeneratedAspectRatio.value = selectedImageAspectRatio.value || '1:1'

  try {
    const formData = new FormData()
    if (goodsPromptHistoryId.value != null) {
      formData.append('historyId', goodsPromptHistoryId.value)
    }
    formData.append('promptText', generatedPrompt.value)
    if (goodsGeneratedAspectRatio.value) {
      formData.append('imageAspectRatio', goodsGeneratedAspectRatio.value)
    }
    if (goodsReferenceImage.value) {
      formData.append('referenceImage', goodsReferenceImage.value)
    }

    const res = await api.post('/prompts/goods/generate-image', formData, {
      timeout: 180000,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    generatedGoodsImageUrls.value = res.data.data?.imageUrls ?? []
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      goodsImageErrorMessage.value = '이미지 생성 시간이 초과되었습니다. 다시 시도해 주세요.'
    } else {
      goodsImageErrorMessage.value =
        err.response?.data?.message || '이미지 생성 중 오류가 발생했습니다.'
    }
  } finally {
    generatingGoodsImage.value = false
  }
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
}, { immediate: true })

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

// 필수 항목이 모두 선택됐을 때만 생성 버튼 활성화
const canGeneratePerson = computed(() => {
  if (!stepsLoaded.value) return false
  for (const step of personSteps.value) {
    for (const attr of step.attrs ?? []) {
      if (attr.required) {
        const selected = personSelectedOptions.value[attr.id]
        if (!selected || selected.length === 0) return false
      }
    }
  }
  return true
})

// ───────────────────────────────────────────────
// Tab 2 생성 목적 / 추가 지시
// ───────────────────────────────────────────────
const personPurpose = ref('')
const personAdditionalNotes = ref('')

// ───────────────────────────────────────────────
// Tab 2 프롬프트 생성
// ───────────────────────────────────────────────
// 현재 생성 중인 스타일: null | 'NANO_BANANA' | 'MID_JOURNEY'
const generatingPersonStyle = ref(null)
const generatingPerson = computed(() => generatingPersonStyle.value !== null)
const generatedPersonPrompt = ref('')
const generatedPersonStyle = ref('')   // 마지막으로 생성된 스타일 (결과 카드 뱃지 표시용)
const personErrorMessage = ref('')
const personCopied = ref(false)

// ───────────────────────────────────────────────
// Tab 2 이미지 생성 (NanoBanana)
// ───────────────────────────────────────────────
const personPromptHistoryId = ref(null)  // 프롬프트 생성 시 저장된 history ID
const generatingImage = ref(false)
const generatedImageUrls = ref([])
const imageErrorMessage = ref('')
const personSelectedAspectRatio = ref(null)       // 이미지 사이즈 선택값 (생성 전)
const personGeneratedAspectRatio = ref('1:1')     // 이미지 생성 시점에 캡처한 종횡비

const personImageAspectRatioValue = computed(() => {
  const [w, h] = personGeneratedAspectRatio.value.split(':').map(Number)
  return w / h
})

async function generatePersonImage() {
  if (!generatedPersonPrompt.value) return
  generatingImage.value = true
  imageErrorMessage.value = ''
  generatedImageUrls.value = []
  personGeneratedAspectRatio.value = personSelectedAspectRatio.value || '1:1'

  try {
    const res = await api.post('/human-prompts/generate-image', {
      historyId: personPromptHistoryId.value,
      promptText: generatedPersonPrompt.value,
      imageAspectRatio: personSelectedAspectRatio.value || null,
    }, { timeout: 180000 })  // 3개 병렬 생성이므로 3분으로 설정
    generatedImageUrls.value = res.data.data?.imageUrls ?? []
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

async function generatePersonPrompt(promptStyle = 'NANO_BANANA') {
  // 필수 항목(required) 선택 여부 검증
  const missingAttrs = []
  for (const step of personSteps.value) {
    for (const attr of step.attrs ?? []) {
      if (attr.required) {
        const selected = personSelectedOptions.value[attr.id]
        if (!selected || selected.length === 0) {
          missingAttrs.push(attr.name)
        }
      }
    }
  }
  if (missingAttrs.length > 0) {
    personErrorMessage.value = `필수 항목을 선택해 주세요: ${missingAttrs.join(', ')}`
    return
  }

  generatingPersonStyle.value = promptStyle
  personErrorMessage.value = ''
  generatedPersonPrompt.value = ''
  personPromptHistoryId.value = null
  generatedImageUrls.value = []

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
      promptStyle,
      imageAspectRatio: personSelectedAspectRatio.value || null,
    }, { timeout: 60000 })
    // 이력 ID, 프롬프트 텍스트, 사용된 스타일 저장
    personPromptHistoryId.value = res.data.data?.id ?? null
    generatedPersonPrompt.value = res.data.data?.promptText ?? ''
    generatedPersonStyle.value = promptStyle
    refreshUsage()  // 앱바 사용량 즉시 갱신
  } catch (err) {
    personErrorMessage.value =
      err.response?.data?.message || '프롬프트 생성 중 오류가 발생했습니다.'
  } finally {
    generatingPersonStyle.value = null
  }
}

// ───────────────────────────────────────────────
// 초기화
// ───────────────────────────────────────────────
const fileInputKey = ref(0)   // v-file-input 강제 리렌더링용

function resetProduct() {
  selectedLcs.value = null
  selectedMcs.value = null
  selectedScs.value = null
  mcsItems.value = []
  scsItems.value = []
  for (const group of tagGroups.value) {
    selectedTags.value[group.id] = group.isMultiSelect ? [] : null
  }
  productPurpose.value = ''
  productAdditionalNotes.value = ''
  generatedPrompt.value = ''
  generatedStyle.value = ''
  goodsPromptHistoryId.value = null
  goodsReferenceImage.value = null
  goodsReferenceImagePreview.value = ''
  goodsReferenceImageError.value = ''
  generatedGoodsImageUrls.value = []
  errorMessage.value = ''
  goodsImageErrorMessage.value = ''
  copied.value = false
  fileInputKey.value++   // file input 초기화
}

function resetPerson() {
  for (const step of personSteps.value) {
    for (const attr of step.attrs ?? []) {
      personSelectedOptions.value[attr.id] = []
    }
  }
  personPurpose.value = ''
  personAdditionalNotes.value = ''
  generatedPersonPrompt.value = ''
  generatedPersonStyle.value = ''
  personPromptHistoryId.value = null
  generatedImageUrls.value = []
  personErrorMessage.value = ''
  imageErrorMessage.value = ''
  personCopied.value = false
  personSelectedAspectRatio.value = null
  personGeneratedAspectRatio.value = '1:1'
}

function onReset() {
  if (activeTab.value === 'product') resetProduct()
  else resetPerson()
}

// ───────────────────────────────────────────────
// 이미지 다운로드 (공통)
// ───────────────────────────────────────────────
async function downloadImage(url, index) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const ext = url.split('.').pop() || 'jpg'
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `generated_image_${index + 1}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error('이미지 다운로드 실패:', err)
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
    <!-- ─── 풀스크린 로딩 오버레이 ─── -->
    <v-overlay
      :model-value="generating || generatingGoodsImage || generatingPerson || generatingImage"
      class="d-flex align-center justify-center"
      persistent
      z-index="9999"
      style="backdrop-filter: blur(4px);"
    >
      <div class="text-center">
        <v-progress-circular
          indeterminate
          color="deep-purple"
          :size="96"
          :width="8"
          class="mb-6"
        />
        <div class="text-white text-h6 font-weight-bold">
          <template v-if="generatingGoodsImage || generatingImage">
            이미지 생성 중...
          </template>
          <template v-else>
            프롬프트 생성 중...
          </template>
        </div>
        <div class="text-white text-body-2 mt-2 opacity-80">
          <template v-if="generatingGoodsImage || generatingImage">
            3개의 이미지를 병렬 생성하고 있습니다. 잠시만 기다려주세요.
          </template>
          <template v-else>
            Gemini AI가 최적의 프롬프트를 작성하고 있습니다.
          </template>
        </div>
      </div>
    </v-overlay>

    <div class="d-flex align-center mb-4">
      <h2 class="text-h5 font-weight-bold">프롬프트 생성</h2>
      <v-spacer />
      <v-btn
        variant="tonal"
        color="secondary"
        size="small"
        prepend-icon="mdi-refresh"
        @click="onReset"
      >
        초기화
      </v-btn>
    </div>

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
              <v-col cols="12" sm="4" md="4">
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
              <v-col cols="12" sm="4" md="4">
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
              <v-col cols="12" sm="4" md="4">
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
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ─── 태그 선택 + 참조 이미지 (가로 배치) ─── -->
        <div class="d-flex align-stretch gap-6 mb-4">

          <!-- 태그 선택: 70% -->
          <v-card variant="outlined" style="flex: 0 0 68%; min-width: 0;">
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
                      @click="onTagToggle(group, tag.id)"
                    >
                      {{ tag.name }}
                    </v-chip>
                  </div>
                  <v-divider v-if="tagGroups.indexOf(group) < tagGroups.length - 1" class="mt-4" />
                </div>
              </template>
            </v-card-text>
          </v-card>

          <!-- 참조 이미지: 나머지 30% -->
          <v-card variant="outlined" style="flex: 1 1 0; min-width: 0; margin-left: 8px;">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
              <v-icon start>mdi-image-plus</v-icon>
              참조 이미지
              <span class="text-caption text-medium-emphasis ml-2">(선택 사항)</span>
            </v-card-title>
            <v-card-text>
              <v-file-input
                :key="fileInputKey"
                label="이미지 첨부 (jpg, jpeg, png, webp · 최대 10MB)"
                accept=".jpg,.jpeg,.png,.webp"
                prepend-icon="mdi-image-plus"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                @update:model-value="onGoodsReferenceImageChange"
              />
              <v-alert
                v-if="goodsReferenceImageError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-2"
                closable
                @click:close="goodsReferenceImageError = ''"
              >{{ goodsReferenceImageError }}</v-alert>
              <div v-if="goodsReferenceImagePreview" class="mt-3 text-center">
                <img
                  :src="goodsReferenceImagePreview"
                  style="max-width: 100%; max-height: 160px; border-radius: 6px; border: 1px solid #e0e0e0;"
                  alt="참조 이미지 미리보기"
                />
              </div>
            </v-card-text>
          </v-card>

        </div>

        <!-- ─── 추가 옵션 ─── -->
        <v-card class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
            <v-icon start>mdi-tune</v-icon>
            추가 옵션
            <span class="text-caption text-medium-emphasis ml-2">(선택 사항)</span>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="productPurpose"
              label="생성 목적"
              placeholder="예: SNS 광고용, 커머스 상세페이지, 포트폴리오"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              class="mb-4"
            />
            <v-textarea
              v-model="productAdditionalNotes"
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

        <!-- ─── 생성 버튼 (NanoBanana / MidJourney) ─── -->
        <div class="d-flex justify-center gap-3 mb-6 flex-wrap">
          <v-btn
            color="deep-purple"
            size="large"
            :disabled="!canGenerate || (generating && generatingStyle !== 'NANO_BANANA')"
            :loading="generatingStyle === 'NANO_BANANA'"
            prepend-icon="mdi-creation"
            @click="onGeneratePrompt('NANO_BANANA')"
          >
            NanoBanana 프롬프트
          </v-btn>
          <v-btn
            color="teal"
            size="large"
            :disabled="!canGenerate || (generating && generatingStyle !== 'MID_JOURNEY')"
            :loading="generatingStyle === 'MID_JOURNEY'"
            prepend-icon="mdi-format-list-bulleted"
            @click="onGeneratePrompt('MID_JOURNEY')"
          >
            MidJourney 프롬프트
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
            <div class="d-flex align-center gap-2 flex-wrap">
              <v-icon color="success">mdi-check-circle</v-icon>
              생성된 프롬프트
              <v-chip
                v-if="generatedStyle === 'NANO_BANANA'"
                size="small"
                color="primary"
                variant="flat"
                prepend-icon="mdi-creation"
              >
                NanoBanana
              </v-chip>
              <v-chip
                v-else-if="generatedStyle === 'MID_JOURNEY'"
                size="small"
                color="teal"
                variant="flat"
                prepend-icon="mdi-format-list-bulleted"
              >
                MidJourney
              </v-chip>
            </div>
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
            <div class="d-flex gap-2 flex-wrap">
              <v-btn
                :color="copied ? 'success' : 'primary'"
                variant="tonal"
                :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
                @click="onCopyToClipboard"
              >
                {{ copied ? '복사됨!' : '클립보드 복사' }}
              </v-btn>
              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-refresh"
                :loading="generating"
                @click="onRegenerate"
              >
                재생성
              </v-btn>
              <v-btn
                color="deep-purple"
                variant="tonal"
                prepend-icon="mdi-image-spark"
                :loading="generatingGoodsImage"
                :disabled="generatingGoodsImage"
                @click="generateGoodsImage"
              >
                이미지 생성 (NanoBanana)
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- ─── 이미지 생성 에러 ─── -->
        <v-alert
          v-if="goodsImageErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="goodsImageErrorMessage = ''"
        >
          {{ goodsImageErrorMessage }}
        </v-alert>
        <!-- ─── 생성된 이미지 (3개 그리드) ─── -->
        <v-card v-if="generatedGoodsImageUrls.length" variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
            <v-icon start color="deep-purple">mdi-image-check</v-icon>
            생성된 이미지 ({{ generatedGoodsImageUrls.length }}개)
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="(url, idx) in generatedGoodsImageUrls"
                :key="idx"
                cols="12"
                sm="4"
              >
                <v-card variant="flat" border rounded="lg">
                  <v-img
                    :src="url"
                    :aspect-ratio="goodsImageAspectRatioValue"
                    cover
                    rounded="t-lg"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular indeterminate color="deep-purple" />
                      </div>
                    </template>
                  </v-img>
                  <v-card-actions class="justify-center pa-2">
                    <v-btn
                      size="small"
                      color="deep-purple"
                      variant="tonal"
                      prepend-icon="mdi-download"
                      @click="downloadImage(url, idx)"
                    >
                      저장
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
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
              <!-- 이미지 사이즈 선택 -->
              <template v-if="imageSizeGroup">
                <div class="mb-4">
                  <div class="text-body-2 font-weight-medium mb-2">이미지 사이즈</div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-chip
                      v-for="tag in tagsByGroup[imageSizeGroup.id]"
                      :key="tag.id"
                      :color="personSelectedAspectRatio === tag.name ? 'primary' : 'default'"
                      :variant="personSelectedAspectRatio === tag.name ? 'flat' : 'outlined'"
                      class="cursor-pointer"
                      @click="personSelectedAspectRatio = personSelectedAspectRatio === tag.name ? null : tag.name"
                    >
                      {{ tag.name }}
                    </v-chip>
                  </div>
                </div>
              </template>
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

          <!-- 생성 버튼 (NanoBanana / MidJourney) -->
          <div class="d-flex justify-center gap-3 mb-6 flex-wrap">
            <v-btn
              color="deep-purple"
              size="large"
              :loading="generatingPersonStyle === 'NANO_BANANA'"
              :disabled="!canGeneratePerson || (generatingPerson && generatingPersonStyle !== 'NANO_BANANA')"
              prepend-icon="mdi-creation"
              @click="generatePersonPrompt('NANO_BANANA')"
            >
              NanoBanana 프롬프트
            </v-btn>
            <v-btn
              color="teal"
              size="large"
              :loading="generatingPersonStyle === 'MID_JOURNEY'"
              :disabled="!canGeneratePerson || (generatingPerson && generatingPersonStyle !== 'MID_JOURNEY')"
              prepend-icon="mdi-format-list-bulleted"
              @click="generatePersonPrompt('MID_JOURNEY')"
            >
              MidJourney 프롬프트
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
              <div class="d-flex align-center gap-2 flex-wrap">
                <v-icon color="success">mdi-check-circle</v-icon>
                생성된 인물 프롬프트
                <!-- 스타일 뱃지 -->
                <v-chip
                  v-if="generatedPersonStyle === 'NANO_BANANA'"
                  size="small"
                  color="deep-purple"
                  variant="flat"
                  prepend-icon="mdi-creation"
                >
                  NanoBanana
                </v-chip>
                <v-chip
                  v-else-if="generatedPersonStyle === 'MID_JOURNEY'"
                  size="small"
                  color="teal"
                  variant="flat"
                  prepend-icon="mdi-format-list-bulleted"
                >
                  MidJourney
                </v-chip>
              </div>
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
              <div class="d-flex gap-2 flex-wrap">
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
                  @click="generatePersonPrompt(generatedPersonStyle || 'NANO_BANANA')"
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
                  이미지 생성 (NanoBanana)
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

          <!-- 생성된 이미지 (3개 그리드) -->
          <v-card v-if="generatedImageUrls.length" variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
              <v-icon start color="deep-purple">mdi-image-check</v-icon>
              생성된 이미지 ({{ generatedImageUrls.length }}개)
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="(url, idx) in generatedImageUrls"
                  :key="idx"
                  cols="12"
                  sm="4"
                >
                  <v-card variant="flat" border rounded="lg">
                    <v-img
                      :src="url"
                      :aspect-ratio="personImageAspectRatioValue"
                      cover
                      rounded="t-lg"
                    >
                      <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular indeterminate color="deep-purple" />
                        </div>
                      </template>
                    </v-img>
                    <v-card-actions class="justify-center pa-2">
                      <v-btn
                        size="small"
                        color="deep-purple"
                        variant="tonal"
                        prepend-icon="mdi-download"
                        @click="downloadImage(url, idx)"
                      >
                        저장
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
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
