<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useEscClose } from '@/composables/useEscClose'

const authStore = useAuthStore()

const histories = ref([])
const loading = ref(false)
const errorMessage = ref('')

const deleteDialog = ref(false)
const deleteTargetId = ref(null)
const deleteLoading = ref(false)

useEscClose(deleteDialog)

const pageNum         = ref(1)
const pageSize        = ref(10)
const total           = ref(0)
const pages           = ref(0)
const hasPreviousPage = ref(false)
const hasNextPage     = ref(false)

const filterLoginId     = ref('')
const filterPromptType  = ref(null)
const filterPromptStyle = ref(null)
const filterDateFrom    = ref('')
const filterDateTo      = ref('')
const dateRangeError    = ref('')

const expandedImages = ref({})
const copiedId = ref(null)

const promptTypeOptions = [
  { title: '전체', value: null },
  { title: '상품', value: 'PRODUCT' },
  { title: '인물', value: 'PERSON' },
]

const promptStyleOptions = [
  { title: '전체', value: null },
  { title: 'NanoBanana', value: 'NANO_BANANA' },
  { title: 'MidJourney', value: 'MID_JOURNEY' },
]

const isAdmin = computed(() => authStore.userRole === 'ADMIN')
const promptTypeLabel = (type) => type === 'PERSON' ? '인물 사진' : '상품 사진'
const promptTypeColor = (type) => type === 'PERSON' ? 'deep-purple' : 'primary'
const promptTypeIcon  = (type) => type === 'PERSON' ? 'mdi-account-outline' : 'mdi-image-outline'

const promptStyleLabel = (style) => style === 'MID_JOURNEY' ? 'MidJourney' : 'NanoBanana'
const promptStyleColor = (style) => style === 'MID_JOURNEY' ? 'teal' : 'primary'
const promptStyleIcon  = (style) => style === 'MID_JOURNEY' ? 'mdi-format-list-bulleted' : 'mdi-creation'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function toggleImages(id) {
  expandedImages.value[id] = !expandedImages.value[id]
}

async function copyToClipboard(text, id) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}

async function downloadImage(url) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const filename = url.split('/').pop().split('?')[0] || 'generated_image.jpg'
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error('이미지 다운로드 실패:', err)
  }
}

async function fetchHistories(page = pageNum.value) {
  pageNum.value = page  // v-pagination 스냅백 방지: 렌더링 전에 먼저 반영
  loading.value = true
  errorMessage.value = ''
  try {
    const params = { pageNum: page, pageSize: pageSize.value }
    if (filterLoginId.value?.trim())  params.loginId     = filterLoginId.value.trim()
    if (filterPromptType.value)       params.promptType  = filterPromptType.value
    if (filterPromptStyle.value)      params.promptStyle = filterPromptStyle.value
    if (filterDateFrom.value)         params.dateFrom    = filterDateFrom.value
    if (filterDateTo.value)           params.dateTo      = filterDateTo.value

    const res = await api.get('/prompts', { params })
    const paged = res.data.data
    histories.value       = paged?.items ?? []
    total.value           = paged?.total ?? 0
    pages.value           = paged?.pages ?? 0
    hasPreviousPage.value = paged?.hasPreviousPage ?? false
    hasNextPage.value     = paged?.hasNextPage ?? false
  } catch (err) {
    errorMessage.value = err.response?.data?.message || '이력 조회 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

function onSearch() {
  dateRangeError.value = ''
  if (filterDateFrom.value && filterDateTo.value && filterDateFrom.value > filterDateTo.value) {
    dateRangeError.value = '시작일이 종료일보다 늦을 수 없습니다.'
    return
  }
  fetchHistories(1)
}

function onReset() {
  filterLoginId.value     = ''
  filterPromptType.value  = null
  filterPromptStyle.value = null
  filterDateFrom.value    = ''
  filterDateTo.value      = ''
  dateRangeError.value    = ''
  fetchHistories(1)
}

function onDeleteClick(id) {
  deleteTargetId.value = id
  deleteDialog.value = true
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await api.delete(`/prompts/${deleteTargetId.value}`)
    deleteDialog.value = false
    // 삭제 후 현재 페이지 재조회 — total/pages 등 페이징 상태 동기화
    const targetPage = histories.value.length === 1 && pageNum.value > 1
      ? pageNum.value - 1
      : pageNum.value
    await fetchHistories(targetPage)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || '삭제 중 오류가 발생했습니다.'
    deleteDialog.value = false
  } finally {
    deleteLoading.value = false
    deleteTargetId.value = null
  }
}

onMounted(() => fetchHistories(1))
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5 font-weight-bold">프롬프트 이력</h2>
      <span v-if="total > 0" class="text-body-2 text-medium-emphasis ml-3">
        총 {{ total.toLocaleString() }}건
      </span>
      <v-spacer />
      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="fetchHistories(1)"
      >
        새로고침
      </v-btn>
    </div>

    <!-- 검색 필터 -->
    <v-card variant="outlined" class="mb-6 pa-4">
      <v-row dense align="center">
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="filterLoginId"
            label="생성자"
            placeholder="loginId 입력"
            prepend-inner-icon="mdi-account-search-outline"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @keyup.enter="onSearch"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filterPromptType"
            :items="promptTypeOptions"
            label="종류"
            prepend-inner-icon="mdi-shape-outline"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filterPromptStyle"
            :items="promptStyleOptions"
            label="스타일"
            prepend-inner-icon="mdi-palette-outline"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filterDateFrom"
            label="생성일 시작"
            type="date"
            prepend-inner-icon="mdi-calendar-start-outline"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :error="!!dateRangeError"
            @update:model-value="dateRangeError = ''"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filterDateTo"
            label="생성일 종료"
            type="date"
            prepend-inner-icon="mdi-calendar-end-outline"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :error="!!dateRangeError"
            @update:model-value="dateRangeError = ''"
          />
        </v-col>
        <v-col cols="12" sm="6" md="1" class="d-flex gap-2">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-magnify"
            :loading="loading"
            block
            @click="onSearch"
          >
            검색
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-if="dateRangeError" dense class="mt-2">
        <v-col cols="12">
          <v-alert type="error" variant="tonal" density="compact" class="text-body-2">
            {{ dateRangeError }}
          </v-alert>
        </v-col>
      </v-row>
      <v-row dense class="mt-1">
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            color="secondary"
            variant="text"
            size="small"
            prepend-icon="mdi-filter-remove-outline"
            @click="onReset"
          >
            필터 초기화
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- 에러 -->
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" closable @click:close="errorMessage = ''">
      {{ errorMessage }}
    </v-alert>

    <!-- 로딩 -->
    <div v-if="loading" class="d-flex justify-center my-10">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- 빈 상태 -->
    <v-alert v-else-if="histories.length === 0" type="info" variant="tonal">
      생성된 프롬프트 이력이 없습니다.
    </v-alert>

    <!-- 이력 목록 -->
    <v-row v-else>
      <v-col
        v-for="item in histories"
        :key="item.id"
        cols="12"
      >
        <v-card variant="outlined">
          <v-card-title class="pa-4 pb-2">
            <div class="d-flex align-center flex-wrap gap-2">
              <!-- 타입 뱃지 -->
              <v-chip
                :color="promptTypeColor(item.promptType)"
                variant="flat"
                size="small"
                :prepend-icon="promptTypeIcon(item.promptType)"
              >
                {{ promptTypeLabel(item.promptType) }}
              </v-chip>

              <!-- 스타일 뱃지 -->
              <v-chip
                v-if="item.promptStyle"
                :color="promptStyleColor(item.promptStyle)"
                variant="tonal"
                size="small"
                :prepend-icon="promptStyleIcon(item.promptStyle)"
              >
                {{ promptStyleLabel(item.promptStyle) }}
              </v-chip>

              <!-- 이미지 있음 뱃지 -->
              <v-chip
                v-if="item.imageUrls && item.imageUrls.length > 0"
                color="success"
                variant="tonal"
                size="small"
                prepend-icon="mdi-image-check"
              >
                이미지 {{ item.imageUrls.length }}장 생성됨
              </v-chip>

              <v-spacer />

              <!-- 날짜 -->
              <span class="text-caption text-medium-emphasis">
                <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                {{ formatDate(item.initRegiDttm) }}
              </span>
              <span class="text-caption text-medium-emphasis">
                <v-icon size="14" class="mr-1">mdi-account-outline</v-icon>
                {{ item.initRegiPic }}
              </span>
            </div>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">

            <!-- PRODUCT 전용: 카테고리 경로 + 태그 -->
            <template v-if="item.promptType === 'PRODUCT'">
              <div v-if="item.categoryPath" class="mb-3">
                <span class="text-caption text-medium-emphasis mr-1">
                  <v-icon size="14" class="mr-1">mdi-tag-multiple</v-icon>카테고리
                </span>
                <span class="text-body-2">{{ item.categoryPath }}</span>
              </div>
              <div v-if="(item.tagNames && item.tagNames.length > 0) || item.imageAspectRatio" class="d-flex flex-wrap gap-1 mb-3">
                <span class="text-caption text-medium-emphasis mr-1 align-self-center">
                  <v-icon size="14" class="mr-1">mdi-label-multiple</v-icon>태그
                </span>
                <v-chip
                  v-for="tag in item.tagNames"
                  :key="tag"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                >
                  {{ tag }}
                </v-chip>
                <v-chip
                  v-if="item.imageAspectRatio"
                  size="x-small"
                  color="secondary"
                  variant="tonal"
                >
                  {{ item.imageAspectRatio }}
                </v-chip>
              </div>
            </template>

            <!-- PERSON 전용: 선택 옵션 + 목적 + 추가 지시 -->
            <template v-else-if="item.promptType === 'PERSON'">
              <div v-if="(item.optionNames && item.optionNames.length > 0) || item.imageAspectRatio" class="d-flex flex-wrap gap-1 mb-3">
                <span class="text-caption text-medium-emphasis mr-1 align-self-center">
                  <v-icon size="14" class="mr-1">mdi-account-details</v-icon>선택 옵션
                </span>
                <v-chip
                  v-for="opt in item.optionNames"
                  :key="opt"
                  size="x-small"
                  color="deep-purple"
                  variant="tonal"
                >
                  {{ opt }}
                </v-chip>
                <v-chip
                  v-if="item.imageAspectRatio"
                  size="x-small"
                  color="secondary"
                  variant="tonal"
                >
                  {{ item.imageAspectRatio }}
                </v-chip>
              </div>
              <div v-if="item.purpose" class="mb-2">
                <span class="text-caption text-medium-emphasis mr-1">
                  <v-icon size="14" class="mr-1">mdi-target</v-icon>생성 목적
                </span>
                <span class="text-body-2">{{ item.purpose }}</span>
              </div>
              <div v-if="item.additionalNotes" class="mb-3">
                <span class="text-caption text-medium-emphasis mr-1">
                  <v-icon size="14" class="mr-1">mdi-note-text-outline</v-icon>추가 지시
                </span>
                <span class="text-body-2">{{ item.additionalNotes }}</span>
              </div>
            </template>

            <!-- 프롬프트 텍스트 (메인) -->
            <v-textarea
              :model-value="item.promptText"
              readonly
              variant="outlined"
              density="compact"
              rows="5"
              auto-grow
              hide-details
              class="font-mono mb-3"
            />

            <!-- 하단 버튼 영역 -->
            <div class="d-flex align-center gap-2 flex-wrap">
              <!-- 클립보드 복사 -->
              <v-btn
                :color="copiedId === item.id ? 'success' : 'primary'"
                variant="tonal"
                size="small"
                :prepend-icon="copiedId === item.id ? 'mdi-check' : 'mdi-content-copy'"
                @click="copyToClipboard(item.promptText, item.id)"
              >
                {{ copiedId === item.id ? '복사됨!' : '클립보드 복사' }}
              </v-btn>

              <!-- 이미지 확인 토글 버튼 -->
              <v-btn
                v-if="item.imageUrls && item.imageUrls.length > 0"
                :color="expandedImages[item.id] ? 'success' : 'teal'"
                variant="tonal"
                size="small"
                :prepend-icon="expandedImages[item.id] ? 'mdi-chevron-up' : 'mdi-image-multiple-outline'"
                @click="toggleImages(item.id)"
              >
                {{ expandedImages[item.id] ? '이미지 닫기' : `이미지 확인 (${item.imageUrls.length}장)` }}
              </v-btn>

              <v-spacer />

              <!-- 삭제 버튼 (ADMIN 전용) -->
              <v-btn
                v-if="isAdmin"
                color="error"
                variant="text"
                size="small"
                prepend-icon="mdi-delete-outline"
                @click="onDeleteClick(item.id)"
              >
                삭제
              </v-btn>
            </div>

            <!-- 이미지 패널 (펼침/접힘) -->
            <v-expand-transition>
              <div v-if="expandedImages[item.id] && item.imageUrls && item.imageUrls.length > 0">
                <v-divider class="my-4" />
                <v-row>
                  <v-col
                    v-for="(url, idx) in item.imageUrls"
                    :key="idx"
                    cols="12"
                    sm="4"
                  >
                    <v-card variant="outlined" class="pa-1">
                      <v-img
                        :src="url"
                        max-height="300"
                        contain
                        class="rounded"
                      >
                        <template #error>
                          <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                            <v-icon size="40" color="grey">mdi-image-broken-variant</v-icon>
                          </div>
                        </template>
                      </v-img>
                      <v-card-actions class="pa-1 pt-2 justify-center">
                        <v-btn
                          variant="tonal"
                          color="primary"
                          size="small"
                          prepend-icon="mdi-download"
                          block
                          @click="downloadImage(url)"
                        >
                          저장 {{ idx + 1 }}
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 페이지네이션 -->
    <div v-if="pages > 1" class="d-flex justify-center mt-6">
      <v-pagination
        :model-value="pageNum"
        :length="pages"
        :total-visible="7"
        rounded="circle"
        @update:model-value="fetchHistories"
      />
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="d-flex align-center gap-2 pa-4">
          <v-icon color="error">mdi-alert-circle-outline</v-icon>
          이력 삭제
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4 text-body-1">
          이력을 삭제하시겠습니까?<br />
          <span class="text-medium-emphasis text-body-2">연결된 이미지 파일도 함께 삭제됩니다.</span>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn
            variant="text"
            :disabled="deleteLoading"
            @click="deleteDialog = false"
          >
            취소
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteLoading"
            @click="confirmDelete"
          >
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.font-mono :deep(textarea) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
}
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
</style>
