# 리팩토링 계획 — 프롬프트 이력 페이징 대응

> 대상 파일: `src/views/prompt/PromptHistoryView.vue`
> 변경 사유: `GET /api/prompts` 응답 구조가 배열(`[]`) → 페이징 객체(`{}`)로 변경됨

---

## 1. 변경 범위 요약

| 영역 | 변경 내용 |
|---|---|
| `<script setup>` — state | 페이징 상태 변수 추가 |
| `<script setup>` — `fetchHistories()` | 파라미터 추가, 응답 파싱 경로 변경 |
| `<template>` — 헤더 영역 | 총 건수 표시 추가 |
| `<template>` — 하단 페이지네이션 | `v-pagination` 컴포넌트 추가 |

---

## 2. Script 변경 상세

### 2-1. 기존 state 유지 (변경 없음)

```javascript
const histories  = ref([])   // 이력 목록 (items)
const loading    = ref(false)
const errorMessage = ref('')
const expandedImages = ref({})
const copiedId   = ref(null)
```

### 2-2. 페이징 state 추가 (신규)

```javascript
const pageNum         = ref(1)
const pageSize        = ref(10)
const total           = ref(0)
const pages           = ref(0)
const hasPreviousPage = ref(false)
const hasNextPage     = ref(false)
```

### 2-3. `fetchHistories` 함수 수정

**Before**
```javascript
async function fetchHistories() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get('/prompts')
    histories.value = res.data.data ?? []
  } catch (err) {
    errorMessage.value = err.response?.data?.message || '이력 조회 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
onMounted(fetchHistories)
```

**After**
```javascript
async function fetchHistories(page = pageNum.value) {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get('/prompts', { params: { pageNum: page, pageSize: pageSize.value } })
    const paged = res.data.data
    histories.value      = paged?.items ?? []
    pageNum.value        = paged?.pageNum ?? 1
    total.value          = paged?.total ?? 0
    pages.value          = paged?.pages ?? 0
    hasPreviousPage.value = paged?.hasPreviousPage ?? false
    hasNextPage.value    = paged?.hasNextPage ?? false
  } catch (err) {
    errorMessage.value = err.response?.data?.message || '이력 조회 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
onMounted(() => fetchHistories(1))
```

> - 새로고침 버튼 클릭 시: `fetchHistories(1)` 으로 1페이지부터 재조회
> - `v-pagination`의 `@update:modelValue` 이벤트: `fetchHistories(newPage)` 호출

---

## 3. Template 변경 상세

### 3-1. 헤더 영역 — 총 건수 표시 추가

```html
<!-- 기존 헤더 (새로고침 버튼 왼쪽에 추가) -->
<span v-if="total > 0" class="text-body-2 text-medium-emphasis">
  총 {{ total.toLocaleString() }}건
</span>
```

위치: `<h2>프롬프트 이력</h2>` 와 `<v-spacer />` 사이

### 3-2. 새로고침 버튼 핸들러 변경

```html
<!-- Before -->
@click="fetchHistories"

<!-- After -->
@click="fetchHistories(1)"
```

### 3-3. 빈 상태 조건 변경 (loading 완료 후에만 표시)

```html
<!-- 변경 없음, histories.length === 0 조건 그대로 유지 -->
```

### 3-4. 하단 페이지네이션 UI 추가 (이력 목록 `</v-row>` 바로 아래)

```html
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
```

> - `pages <= 1` 이면 페이지네이션 숨김
> - `total-visible="7"` — 페이지 번호 최대 7개 표시

---

## 4. 전체 데이터 흐름 (변경 후)

```
onMounted
  └─ fetchHistories(1)
       ├─ GET /api/prompts?pageNum=1&pageSize=10
       ├─ histories.value  ← paged.items
       ├─ pageNum/total/pages/hasPreviousPage/hasNextPage 갱신
       └─ 렌더링
            ├─ 헤더: "총 N건"
            ├─ 이력 카드 목록 (v-for histories)
            └─ v-pagination (pages > 1 일 때만)

v-pagination @update:model-value="fetchHistories(newPage)"
새로고침 버튼 @click="fetchHistories(1)"
```

---

## 5. 코딩 컨벤션 준수 체크

| 항목 | 준수 여부 | 비고 |
|---|---|---|
| `<script setup>` 전용 | ✅ | Options API 미사용 |
| `@/api` 인스턴스 사용 | ✅ | `axios` 직접 import 없음 |
| API 호출 위치 (view) | ✅ | `PromptHistoryView.vue` 내에서만 |
| SFC 작성 순서 | ✅ | script → template → style scoped |
| 신규 state는 `ref()` 사용 | ✅ | Composition API 스타일 |
| Vuetify autoImport | ✅ | `v-pagination` 별도 import 불필요 |
| 응답 데이터 접근 | ✅ | `res.data.data.items` 사용 |

---

## 6. 변경하지 않는 것

- 이력 카드 UI 구조 (PRODUCT / PERSON 분기, 이미지 패널 등) — **변경 없음**
- `formatDate`, `copyToClipboard`, `downloadImage`, `toggleImages` 등 헬퍼 함수 — **변경 없음**
- `<style scoped>` — **변경 없음**
