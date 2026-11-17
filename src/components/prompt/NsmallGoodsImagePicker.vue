<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import api from '@/api'
import { cropPixels, exportSize, parseGoodsCode } from '@/utils/goodsImage'

const props = defineProps({ availableSlots: { type: Number, default: 3 } })
const emit = defineEmits(['select'])
const open = ref(false)
const query = ref('')
const product = ref(null)
const selected = ref(null)
const loading = ref(false)
const imageLoading = ref(false)
const saving = ref(false)
const error = ref('')
const imageUrl = ref('')
const imageElement = ref(null)
const previewCanvas = ref(null)
const imageSize = ref({ width: 0, height: 0 })
const selection = ref(null)
const cropEnabled = ref(false)
let drag = null
let searchController = null
let imageController = null

const crop = computed(() => selection.value && imageSize.value.width
  ? cropPixels(selection.value, imageSize.value.width, imageSize.value.height) : null)
const isLongImage = computed(() => imageSize.value.height > imageSize.value.width * 4)
const cropValid = computed(() => crop.value && crop.value.width >= 32 && crop.value.height >= 32)
const canUse = computed(() => !imageLoading.value && !saving.value && imageSize.value.width > 0
  && props.availableSlots > 0 && (selection.value ? cropValid.value : !isLongImage.value))
const selectionStyle = computed(() => selection.value ? {
  left: `${selection.value.x * 100}%`, top: `${selection.value.y * 100}%`,
  width: `${selection.value.width * 100}%`, height: `${selection.value.height * 100}%`,
} : {})

function clearImage() {
  imageController?.abort()
  imageController = null
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = ''
  imageSize.value = { width: 0, height: 0 }
  selection.value = null
  selected.value = null
  imageLoading.value = false
  drag = null
}

async function search() {
  const goodsCd = parseGoodsCode(query.value)
  if (!goodsCd) { error.value = '상품번호 또는 NS몰 상품 URL을 확인해 주세요.'; return }
  searchController?.abort()
  const controller = new AbortController()
  searchController = controller
  clearImage()
  product.value = null
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(`/goods/${goodsCd}/images`, { signal: controller.signal, timeout: 25000 })
    if (controller.signal.aborted) return
    product.value = response.data.data
    if (product.value.images.length) await chooseImage(product.value.images[0])
  } catch (err) {
    if (!controller.signal.aborted) error.value = err.response?.data?.message || '상품을 가져오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (searchController === controller) loading.value = false
  }
}

async function chooseImage(image) {
  clearImage()
  selected.value = image
  imageLoading.value = true
  error.value = ''
  const controller = new AbortController()
  imageController = controller
  try {
    // Fetch with the existing JWT client, then use a local blob so canvas is not tainted by CDN CORS.
    const response = await api.get(`/goods/${product.value.goodsCd}/images/${image.id}`, {
      responseType: 'blob', signal: controller.signal, timeout: 30000,
    })
    if (!controller.signal.aborted) imageUrl.value = URL.createObjectURL(response.data)
  } catch (err) {
    if (!controller.signal.aborted) {
      let message
      try { message = JSON.parse(await err.response?.data?.text()).message } catch { /* use fallback */ }
      error.value = message || '이미지를 불러오지 못했습니다. 다른 이미지를 선택해 주세요.'
      imageLoading.value = false
    }
  }
}

function imageLoaded() {
  const image = imageElement.value
  imageSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  cropEnabled.value = isLongImage.value
  imageLoading.value = false
}

function point(event) {
  const rect = imageElement.value.getBoundingClientRect()
  return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }
}

function startSelection(event) {
  if (!cropEnabled.value || imageLoading.value || saving.value || (event.pointerType === 'mouse' && event.button !== 0)) return
  event.preventDefault()
  event.currentTarget.setPointerCapture(event.pointerId)
  drag = { ...point(event), pointerId: event.pointerId }
  selection.value = { x: drag.x, y: drag.y, width: 0, height: 0 }
}

function moveSelection(event) {
  if (!drag || drag.pointerId !== event.pointerId) return
  const end = point(event)
  selection.value = { x: Math.min(drag.x, end.x), y: Math.min(drag.y, end.y),
    width: Math.abs(end.x - drag.x), height: Math.abs(end.y - drag.y) }
}

function endSelection(event) {
  moveSelection(event)
  drag = null
}

function draw(canvas, rect, size) {
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('이미지 편집을 지원하는 브라우저에서 다시 시도해 주세요.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size.width, size.height)
  context.drawImage(imageElement.value, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height)
}

watch(crop, async (value) => {
  await nextTick()
  if (!value || !previewCanvas.value || !imageElement.value) return
  const scale = Math.min(1, 360 / Math.max(value.width, value.height))
  draw(previewCanvas.value, value, { width: Math.max(1, Math.round(value.width * scale)), height: Math.max(1, Math.round(value.height * scale)) })
})

async function useImage() {
  if (!canUse.value) return
  saving.value = true
  error.value = ''
  try {
    const rect = crop.value || { x: 0, y: 0, ...imageSize.value }
    const canvas = document.createElement('canvas')
    draw(canvas, rect, exportSize(rect.width, rect.height))
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) throw new Error('이미지를 저장하지 못했습니다. 영역을 다시 선택해 주세요.')
    if (blob.size > 15 * 1024 * 1024) throw new Error('선택한 영역이 너무 큽니다. 조금 더 작은 영역을 선택해 주세요.')
    const file = new File([blob], `nsmall-${product.value.goodsCd}-${selection.value ? 'crop' : selected.value.id}.jpg`, { type: 'image/jpeg' })
    emit('select', { file, goodsCd: product.value.goodsCd, productName: product.value.productName })
    open.value = false
  } catch (err) { error.value = err.message || '이미지를 첨부하지 못했습니다.' }
  finally { saving.value = false }
}

watch(open, (value) => {
  if (!value) {
    searchController?.abort()
    searchController = null
    loading.value = false
    clearImage()
    product.value = null
    error.value = ''
  }
})
onBeforeUnmount(() => { searchController?.abort(); clearImage() })
</script>

<template>
  <div class="mb-4">
    <v-btn variant="tonal" color="primary" block prepend-icon="mdi-shopping-outline"
      :disabled="availableSlots < 1" @click="open = true">NS몰 상품에서 가져오기</v-btn>
    <p class="text-caption text-medium-emphasis mt-2 mb-0">
      {{ availableSlots > 0 ? '상품번호로 원본을 불러와 필요한 부분만 사용하세요.' : '이미지 1장을 비우면 상품에서 가져올 수 있습니다.' }}
    </p>
  </div>

  <v-dialog v-model="open" max-width="1120" :persistent="saving" scrollable>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center pa-5 pb-2">
        <v-icon color="primary" class="mr-2">mdi-shopping-outline</v-icon>
        <span>NS몰 상품 이미지 가져오기</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="상품 이미지 창 닫기" :disabled="saving" @click="open = false" />
      </v-card-title>
      <v-card-text class="px-5 pb-5">
        <p class="text-body-2 text-medium-emphasis mb-4">스크린샷 없이 상품 원본에서 참조 이미지를 준비하세요.</p>
        <form class="goods-search" @submit.prevent="search">
          <v-text-field v-model="query" label="상품번호 또는 상품 URL" placeholder="예: 36149436"
            variant="outlined" density="comfortable" hide-details :disabled="saving" autocomplete="off" />
          <v-btn type="submit" color="primary" height="48" :loading="loading" :disabled="saving">상품 불러오기</v-btn>
        </form>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4" role="alert">{{ error }}</v-alert>

        <div v-if="product" class="mt-5">
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <strong>{{ product.productName }}</strong>
            <v-chip size="small" variant="tonal">{{ product.goodsCd }}</v-chip>
            <v-spacer />
            <a :href="product.productUrl" target="_blank" rel="noopener noreferrer" class="text-caption">NS몰 상품 보기 ↗</a>
          </div>
          <div class="source-list mb-4" aria-label="상품 이미지 목록">
            <button v-for="(image, index) in product.images" :key="image.id" type="button"
              class="source-item" :class="{ active: selected?.id === image.id }" :aria-pressed="selected?.id === image.id"
              :disabled="saving" @click="chooseImage(image)">
              <img v-if="image.kind === 'GALLERY'" :src="image.sourceUrl" :alt="`${image.label} ${index + 1}`" loading="lazy" />
              <v-icon v-else size="30" color="primary">mdi-image-multiple-outline</v-icon>
              <span>{{ image.label }} {{ product.images.filter(i => i.kind === image.kind).indexOf(image) + 1 }}</span>
            </button>
          </div>
          <v-alert v-if="product.unsupportedDetailImageCount > 0" type="info" variant="tonal" density="compact" class="mb-4">
            상세 이미지 {{ product.unsupportedDetailImageCount }}장은 현재 지원하지 않는 이미지 주소여서 불러오지 못했습니다.
            필요한 이미지가 보이지 않으면 NS몰 상품 페이지에서 확인해 주세요.
          </v-alert>

          <div class="editor-layout">
            <div>
              <div class="d-flex align-center flex-wrap ga-2 mb-2">
                <v-btn size="small" :variant="cropEnabled ? 'tonal' : 'outlined'" color="primary" prepend-icon="mdi-crop"
                  :disabled="imageLoading || !imageUrl || saving" @click="cropEnabled = !cropEnabled">{{ cropEnabled ? '영역 선택 중' : '영역 선택' }}</v-btn>
                <v-btn size="small" variant="text" :disabled="!selection || saving" @click="selection = null">선택 초기화</v-btn>
                <span class="text-caption text-medium-emphasis">{{ imageSize.width ? `${imageSize.width.toLocaleString()} × ${imageSize.height.toLocaleString()} px` : '' }}</span>
              </div>
              <div class="image-scroll">
                <div v-if="imageLoading" class="loading-state"><v-progress-circular indeterminate color="primary" /><span>원본 이미지를 불러오는 중입니다.</span></div>
                <div v-if="imageUrl" class="image-stage" :class="{ selecting: cropEnabled }"
                  :style="{ touchAction: cropEnabled ? 'none' : 'pan-y' }"
                  @pointerdown="startSelection" @pointermove="moveSelection" @pointerup="endSelection" @pointercancel="drag = null">
                  <img ref="imageElement" :src="imageUrl" alt="영역을 선택할 상품 원본 이미지" draggable="false"
                    @load="imageLoaded" @error="error = '원본 이미지를 표시하지 못했습니다.'; imageLoading = false" />
                  <div v-if="selection" class="crop-selection" :style="selectionStyle"><span v-if="crop">{{ crop.width }} × {{ crop.height }}</span></div>
                </div>
              </div>
              <p class="text-caption text-medium-emphasis mt-2">{{ cropEnabled ? '원하는 사진 위를 드래그하세요. 휠이나 스크롤바로 아래쪽 사진도 찾을 수 있습니다.' : '원본 그대로 사용하거나 ‘영역 선택’을 눌러 필요한 부분만 자르세요.' }}</p>
            </div>
            <aside class="crop-preview">
              <div class="text-subtitle-2 mb-3">참조 이미지 미리보기</div>
              <div v-if="selection" class="preview-frame"><canvas ref="previewCanvas" aria-label="선택 영역 미리보기" /></div>
              <img v-else-if="imageUrl && !isLongImage" :src="imageUrl" alt="첨부할 상품 이미지 미리보기" class="whole-preview" />
              <div v-else class="preview-empty"><v-icon size="36">mdi-crop-free</v-icon><span>상세 이미지에서 사용할<br />사진 영역을 선택하세요.</span></div>
              <p v-if="selection && !cropValid" class="text-caption text-error mt-2">가로·세로 32px 이상의 영역을 선택해 주세요.</p>
              <p class="text-caption text-medium-emphasis mt-3">선택한 이미지는 비어 있는 참조 이미지 칸에 추가됩니다. 기존 이미지는 유지됩니다.</p>
              <v-btn block color="primary" class="mt-4" prepend-icon="mdi-image-plus" :loading="saving" :disabled="!canUse" @click="useImage">{{ selection ? '선택 영역 첨부' : '이미지 첨부' }}</v-btn>
            </aside>
          </div>
        </div>
        <div v-else-if="!loading" class="empty-state"><v-icon size="48" color="primary">mdi-image-search-outline</v-icon><p>상품번호만 있으면 시작할 수 있어요.</p><span class="text-body-2 text-medium-emphasis">대표 이미지와 상세 이미지를 한곳에서 확인하세요.</span></div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.goods-search { display: flex; gap: 12px; align-items: center; }
.source-list { display: flex; gap: 10px; overflow-x: auto; padding: 3px; }
.source-item { flex: 0 0 108px; min-height: 104px; border: 1px solid #d9dce3; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); }
.source-item img { height: 58px; width: 80px; object-fit: contain; }
.source-item.active { border: 2px solid rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .06); }
.source-item:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.editor-layout { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 20px; align-items: start; }
.image-scroll { max-height: 52vh; min-height: 220px; overflow: auto; border: 1px solid #e0e3e8; border-radius: 10px; background: #f4f5f7; position: relative; }
.image-stage { position: relative; overflow: hidden; user-select: none; }
.image-stage.selecting { cursor: crosshair; }
.image-stage > img { display: block; width: 100%; height: auto; }
.crop-selection { position: absolute; border: 2px solid #5c62df; box-shadow: 0 0 0 100000px #10182866; pointer-events: none; }
.crop-selection span { background: #4c51bb; color: white; font-size: 11px; padding: 2px 5px; position: absolute; top: 0; left: 0; white-space: nowrap; }
.crop-preview { border: 1px solid #e0e3e8; border-radius: 10px; padding: 16px; }
.preview-frame, .preview-empty { background: #f4f5f7; border-radius: 8px; display: flex; align-items: center; justify-content: center; min-height: 170px; overflow: hidden; }
.preview-frame canvas { max-width: 100%; max-height: 250px; object-fit: contain; }
.whole-preview { display: block; max-width: 100%; max-height: 250px; object-fit: contain; margin: auto; }
.preview-empty { flex-direction: column; gap: 12px; text-align: center; font-size: 13px; color: #667085; }
.empty-state { text-align: center; padding: 50px 10px; }
.empty-state p { margin: 16px 0 6px; font-weight: 600; }
.loading-state { min-height: 220px; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 13px; }
@media (max-width: 700px) { .goods-search { flex-direction: column; align-items: stretch; } .editor-layout { grid-template-columns: 1fr; } .image-scroll { max-height: 45vh; } }
</style>
