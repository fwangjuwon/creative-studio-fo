# 버그 & 요구사항 불일치 검사 결과

> 검사일: 2026-03-09
> 대상: ns-creative-studio-fo 전체 소스

---

## 🐛 버그 (실제 오작동)

### BUG-01. `HomeView.vue` — 사용자 이름 표시 불가
- **파일**: `src/views/HomeView.vue` line 15
- **현상**: `authStore.user.name || authStore.user.username` 참조하지만, auth store의 user 객체에는 `loginId`, `role` 필드만 존재 → 항상 빈 텍스트 렌더링
- **원인**: `auth.js`의 `login()` 함수에서 JWT 디코딩 시 `{ loginId, role }` 만 저장
- **수정 방향**: `authStore.user.loginId` 로 교체
- **상태**: [x] 수정 완료

---

## ⚠️ 도메인 요구사항 불일치

### REQ-01. `PromptHistoryView.vue` — 이력 카드에 카테고리 경로·태그 미표시
- **파일**: `src/views/prompt/PromptHistoryView.vue`
- **요구사항** (`docs/pages.md`): 각 항목에 생성일시, 생성자, **카테고리(경로)**, **선택 태그**, 프롬프트 텍스트 표시

#### 현재 `GET /api/prompts` 응답 명세 (확인된 스펙)
```json
{
  "id": 0,
  "userId": 0,
  "categoryId": 0,
  "promptType": "string",
  "promptText": "string",
  "imageUrl": "string",
  "tagIds": [0],
  "initRegiPic": "string",
  "initRegiDttm": "2026-03-09T01:42:27.580Z",
  "finalRvisDttm": "2026-03-09T01:42:27.580Z"
}
```

#### 문제점
- `categoryId`: 세분류(DCS) ID **하나만** 반환 → 카테고리 경로(`식품 > 건강식품 > 약재 > 인삼`) 표시 불가
- `tagIds`: 태그 ID 배열만 반환 → 태그 이름 표시 불가

#### 수정 방향

**[백엔드] `GET /api/prompts` 응답 DTO 필드 추가 필요**

| 추가 필드 | 타입 | 설명 |
|-----------|------|------|
| `categoryPath` | `String` | 카테고리 전체 경로 문자열 (예: `식품 > 건강식품 > 약재 > 인삼`) |
| `tags` | `List<{id, name}>` | 선택된 태그 ID + 이름 목록 |

> `categoryPath`는 DCS → SCS → MCS → LCS 순으로 부모를 타고 올라가 `>`로 연결한 문자열.
> 상품 프롬프트(`promptType = GOODS`)만 해당. 인물 프롬프트(`PERSON`)는 카테고리 없음.

**[프론트엔드] `PromptHistoryView.vue` UI 추가**

백엔드 필드 추가 완료 후 이력 카드에 아래 항목 렌더링:
- `item.categoryPath` — `<v-chip>` 또는 텍스트로 카테고리 경로 표시 (GOODS 타입만)
- `item.tags` — 태그 이름 배열을 `<v-chip>` 목록으로 표시

- **상태**: [ ] 백엔드 수정 대기 → 이후 프론트 구현

### REQ-02. `PromptHistoryView.vue` — USER 팀 미배정 안내 메시지 없음
- **파일**: `src/views/prompt/PromptHistoryView.vue`
- **요구사항** (`docs/pages.md`, `docs/todo.md`): USER가 팀 미배정인 경우 "빈 목록" 이유 안내 필요
- **현상**: 팀 없는 USER가 조회하면 일반 "생성된 프롬프트 이력이 없습니다." 메시지만 표시
- **검토 결과**: 계정 생성 자체가 ADMIN 전용 Closed 방식이므로, 팀 미배정 USER는 ADMIN의 의도적 설정이거나 관리 실수임. 프론트엔드에서 별도 안내 처리 불필요.
- **상태**: [~] 보류 (대응 불필요로 판단)

### REQ-03. `PromptNewView.vue` — "인물 사진 프롬프트" TAB 미문서화 기능
- **파일**: `src/views/prompt/PromptNewView.vue`
- **현상**: TAB 2 (인물 사진 프롬프트) 기능이 `docs/pages.md`, `docs/todo.md`, `project-context.mdc` 어디에도 없었음
- **검토 결과**: 신규 추가된 정식 기능으로 확인 — 문서화 완료
- **완료 내역**:
  - `docs/pages.md` — `/prompt/new` 섹션을 TAB 1/TAB 2 구조로 재작성, 인물 프롬프트 API 명세 추가
  - `docs/todo.md` — Step 5에 TAB 2 항목 추가 및 완료 처리
- **상태**: [x] 문서화 완료

### REQ-04. `UserView.vue` — 문서와 구현 상태 불일치
- **파일**: `src/views/manage/UserView.vue`
- **현상**: `docs/pages.md`에 ❌ 미구현, `docs/todo.md` Step 7 전체 미완료([ ])로 표기되어 있으나 실제로는 완전 구현됨
- **완료 내역**:
  - `docs/pages.md` — `/manage/tags`, `/manage/users`, `/prompt/history` 상태 ✅ 구현됨으로 업데이트
  - `docs/todo.md` — Step 6(이력), Step 7(사용자 관리) 완료 처리, 미구현 항목(REQ-01) 별도 명시
- **상태**: [x] 문서 현행화 완료

---

## 📋 코딩 컨벤션 위반

### CONV-01. `LoginView.vue` — SFC 작성 순서 위반
- **파일**: `src/views/LoginView.vue`
- **현상**: `<template>` → `<script setup>` 순서 (컨벤션: `<script setup>` 먼저)
- **상태**: [x] 수정 완료

### CONV-02. `DefaultLayout.vue` — SFC 작성 순서 위반
- **파일**: `src/layouts/DefaultLayout.vue`
- **현상**: `<template>` → `<script setup>` 순서 (컨벤션: `<script setup>` 먼저)
- **상태**: [x] 수정 완료

---

## 진행 현황

| ID | 파일 | 종류 | 상태 |
|----|------|------|------|
| BUG-01 | `HomeView.vue` | 버그 | ✅ 완료 |
| REQ-01 | `PromptHistoryView.vue` | 요구사항 불일치 | ⬜ 대기 |
| REQ-02 | `PromptHistoryView.vue` | 요구사항 불일치 | ➖ 보류 (대응 불필요) |
| REQ-03 | `PromptNewView.vue` | 미문서화 기능 | ✅ 문서화 완료 |
| REQ-04 | `UserView.vue` | 문서 불일치 | ✅ 완료 |
| CONV-01 | `LoginView.vue` | 컨벤션 위반 | ✅ 완료 |
| CONV-02 | `DefaultLayout.vue` | 컨벤션 위반 | ✅ 완료 |
