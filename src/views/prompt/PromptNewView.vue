<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api'

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
// { [groupId]: TagItem[] }
const tagsByGroup = ref({})
// { [groupId]: selectedTagId(s) }
const selectedTags = ref({})
const loadingTags = ref(false)

async function fetchTagGroups() {
  loadingTags.value = true
  try {
    const res = await api.get('/tag-groups')
    tagGroups.value = res.data.data ?? []
    // 각 그룹의 태그 병렬 조회
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
    // 단일 선택: 같은 태그 클릭 시 해제
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

// 선택된 전체 tagId 배열
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
// 프롬프트 생성
// ───────────────────────────────────────────────
const canGenerate = computed(() => !!selectedDcs.value)
const generating = ref(false)
const generatedPrompt = ref('')
const errorMessage = ref('')
const successSnackbar = ref(false)
const copied = ref(false)

async function onGeneratePrompt() {
  if (!canGenerate.value) return
  generating.value = true
  errorMessage.value = ''
  generatedPrompt.value = ''

  try {
    const res = await api.post('/prompts/goods', {
      goodsCategoryId: selectedDcs.value,
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

async function onCopyToClipboard() {
  if (!generatedPrompt.value) return
  try {
    await navigator.clipboard.writeText(generatedPrompt.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
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
  onGeneratePrompt()
}
</script>

<template>
  <div>
    <h2 class="text-h5 font-weight-bold mb-6">프롬프트 생성</h2>

    <!-- ─── 카테고리 선택 ─── -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
        <v-icon start>mdi-tag-multiple</v-icon>
        카테고리 선택
        <v-chip size="x-small" color="error" class="ml-2">필수</v-chip>
      </v-card-title>
      <v-card-text>
        <v-row>
          <!-- 대분류 LCS -->
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
          <!-- 중분류 MCS -->
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
          <!-- 소분류 SCS -->
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
          <!-- 세분류 DCS -->
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

    <!-- ─── 생성 버튼 ─── -->
    <div class="d-flex justify-center mb-6">
      <v-btn
        color="primary"
        size="large"
        :disabled="!canGenerate"
        :loading="generating"
        prepend-icon="mdi-creation"
        @click="onGeneratePrompt"
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
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.font-mono :deep(textarea) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}
.gap-2 {
  gap: 8px;
}
</style>
