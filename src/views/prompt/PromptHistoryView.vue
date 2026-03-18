<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const histories = ref([])
const loading = ref(false)
const errorMessage = ref('')

const pageNum         = ref(1)
const pageSize        = ref(10)
const total           = ref(0)
const pages           = ref(0)
const hasPreviousPage = ref(false)
const hasNextPage     = ref(false)

// 이미지 패널 펼침 상태 (historyId → boolean)
const expandedImages = ref({})
function toggleImages(id) {
  expandedImages.value[id] = !expandedImages.value[id]
}

// 프롬프트 타입 표시
const promptTypeLabel = (type) => type === 'PERSON' ? '인물 사진' : '상품 사진'
const promptTypeColor = (type) => type === 'PERSON' ? 'deep-purple' : 'primary'
const promptTypeIcon  = (type) => type === 'PERSON' ? 'mdi-account-outline' : 'mdi-image-outline'

// 프롬프트 스타일 표시
const promptStyleLabel = (style) => style === 'MID_JOURNEY' ? 'MidJourney' : 'NanoBanana'
const promptStyleColor = (style) => style === 'MID_JOURNEY' ? 'teal' : 'primary'
const promptStyleIcon  = (style) => style === 'MID_JOURNEY' ? 'mdi-format-list-bulleted' : 'mdi-creation'

// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// 이미지 다운로드
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

// 복사
const copiedId = ref(null)
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

// 이력 조회
async function fetchHistories(page = pageNum.value) {
  pageNum.value = page  // v-pagination 스냅백 방지: 렌더링 전에 먼저 반영
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get('/prompts', { params: { pageNum: page, pageSize: pageSize.value } })
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

onMounted(() => fetchHistories(1))
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
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
              <div v-if="item.tagNames && item.tagNames.length > 0" class="d-flex flex-wrap gap-1 mb-3">
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
              </div>
            </template>

            <!-- PERSON 전용: 선택 옵션 + 목적 + 추가 지시 -->
            <template v-else-if="item.promptType === 'PERSON'">
              <div v-if="item.optionNames && item.optionNames.length > 0" class="d-flex flex-wrap gap-1 mb-3">
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
                        aspect-ratio="1"
                        cover
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
                          @click="downloadImage(url, idx)"
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
