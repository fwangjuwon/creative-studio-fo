# 사용자 사용량 표시 — 프론트엔드 작업 계획

> **작성일**: 2026-03-12  
> **참고 문서**: `temp/temp.md` (백엔드 API 연동 가이드)  
> **작업 범위**: 홈 화면 + 사용자 관리 화면

---

## 개요

백엔드에 신규 추가된 사용량 조회 API를 활용하여 두 화면에 `사용량 / 할당량` 정보를 표시한다.

| 화면 | 파일 | 사용 API | 권한 |
|------|------|---------|------|
| 홈 (`/`) | `HomeView.vue` | `GET /api/users/me/usage` | 전 역할 (USER / MANAGER / ADMIN) |
| 사용자 관리 (`/manage/users`) | `UserView.vue` | `GET /api/users/usage` | ADMIN 전용 |

---

## 작업 1 — `HomeView.vue` 수정

### 현재 상태
- 사용자 정보 카드: role 뱃지 + loginId만 표시
- 사용량 관련 표시 없음

### 목표
- 사용자 정보 카드 내에 금일 사용량 표시
- 표시 형식: `오늘 사용량: N / M` (N = 사용횟수, M = 일일한도)
- `remainingCount === 0` 이면 경고 강조 (주황/빨강)

### 구현 세부

#### 추가 상태 변수
```javascript
const usage = ref(null)        // UserUsageRespDto | null
const usageLoading = ref(false)
```

#### 신규 함수
```javascript
// GET /api/users/me/usage — 본인 사용량 조회
async function fetchMyUsage() {
  usageLoading.value = true
  try {
    const res = await api.get('/users/me/usage')
    usage.value = res.data.data
  } catch {
    usage.value = null
  } finally {
    usageLoading.value = false
  }
}
```

#### 라이프사이클
```javascript
onMounted(fetchMyUsage)
```

#### 템플릿 추가 (사용자 정보 카드 내부)
- 사용량 로딩 중: `v-progress-circular` 또는 skeleton 처리
- 사용량 로드 완료: `오늘 사용량: todayUsedCount / dailyLimit`
- `remainingCount === 0` 시: `v-chip color="error"` 또는 `text-error` 색상으로 강조
- 사용량 로드 실패: 별도 에러 표시 없이 조용히 숨김 (UX 방해 최소화)

---

## 작업 2 — `UserView.vue` 수정

### 현재 상태
- 테이블 컬럼: ID | 로그인 ID | 이름 | 권한 | 팀 | 일일 한도 | 등록일 | 관리
- 사용량 관련 컬럼 없음

### 목표 컬럼
ID | 로그인 ID | 이름 | 권한 | 팀 | 일일 한도 | **금일 사용량** | 등록일 | 관리

### 표시 형식
```
일일 한도   금일 사용량
  999         0 / 999
    5         2 / 5
    5         5 / 5   ← 한도 도달 시 빨간 텍스트
```

### 구현 세부

#### 추가 상태 변수
```javascript
// userId → { todayUsedCount, remainingCount } 매핑 테이블
const usageMap = ref({})
```

#### 신규 함수
```javascript
// GET /api/users/usage — 전체 회원 사용량 목록 조회 (ADMIN 전용)
async function fetchUsage() {
  try {
    const res = await api.get('/users/usage')
    const list = res.data.data ?? []
    usageMap.value = Object.fromEntries(
      list.map(u => [u.userId, { todayUsedCount: u.todayUsedCount, remainingCount: u.remainingCount }])
    )
  } catch {
    usageMap.value = {}
  }
}
```

#### `fetchUsers()` 수정 — 병렬 호출로 변경
```javascript
// 기존: await api.get('/users', ...) 단독 호출
// 변경: Promise.all([fetchUsers(), fetchUsage()]) 병렬 호출로 응답 시간 단축
async function loadAll() {
  listLoading.value = true
  try {
    const params = { ... }
    const [usersRes] = await Promise.all([
      api.get('/users', { params }),
      fetchUsage(),
    ])
    users.value = usersRes.data.data ?? []
  } catch {
    users.value = []
  } finally {
    listLoading.value = false
  }
}
```

> 검색 버튼 클릭, 초기화, 등록/수정/삭제 후 재조회 시 `loadAll()` 호출로 통일

#### `headers` 배열 수정
```javascript
// 일일 한도 컬럼 뒤에 추가
{ title: '금일 사용량', key: 'todayUsage', width: '120px', sortable: false, align: 'center' },
```

#### 테이블 슬롯 추가
```html
<template #item.todayUsage="{ item }">
  <!-- usageMap에 해당 userId 데이터가 있을 때만 표시 -->
  <template v-if="usageMap[item.id]">
    <span :class="usageMap[item.id].remainingCount === 0 ? 'text-error font-weight-bold' : ''">
      {{ usageMap[item.id].todayUsedCount }} / {{ item.dailyLimit }}
    </span>
  </template>
  <span v-else class="text-disabled">-</span>
</template>
```

---

## 변경 파일 목록

| 파일 | 변경 유형 | 주요 변경 내용 |
|------|---------|--------------|
| `src/views/HomeView.vue` | 수정 | `fetchMyUsage()` 추가, 사용량 정보 카드 UI 추가 |
| `src/views/manage/UserView.vue` | 수정 | `fetchUsage()` 추가, `loadAll()` 병렬 호출, 테이블 컬럼 추가 |

**신규 파일 없음** — API 모듈 파일 추가 불필요 (view 파일 내 직접 호출, 컨벤션 준수)

---

## 컨벤션 체크리스트

- [x] `@/api` 인스턴스 사용 (axios 직접 import 금지)
- [x] API 호출은 view 파일 내에서만
- [x] `res.data.data`로 응답 데이터 접근
- [x] `<script setup>` Composition API 스타일
- [x] `<style scoped>` 유지
- [x] SFC 작성 순서: script → template → style

---

## 예외 처리 방침

| 상황 | 처리 방식 |
|------|---------|
| `GET /api/users/me/usage` 실패 | `usage.value = null` → 사용량 섹션 숨김 (홈 화면 전체 장애 방지) |
| `GET /api/users/usage` 실패 | `usageMap.value = {}` → 금일 사용량 컬럼 전체 `-` 표시 |
| usageMap에 userId 없음 (신규 유저 등) | `-` 표시 |
| `remainingCount === 0` | 빨간 텍스트 강조 (삭제/차단 아님) |
