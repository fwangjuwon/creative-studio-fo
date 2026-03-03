# TODO

> **프로젝트**: ns-creative-studio-fo
> **상태**: 🟡 Step 5 완료, Step 6·7 진행 예정 / Refactor 진행 예정
> **최종 업데이트**: 2026-03-03 (BO 리팩터링 반영 + Phase 2 리팩터링 todo 추가)

---

## 결정 필요 사항

- [x] 카테고리 드릴다운 UI 방식 결정 → **옵션 A: 가로 4단계 셀렉트박스 (`v-select` 4개)**
- [ ] 프롬프트 이력 표시 방식 결정
  - 옵션 A: 카드 리스트
  - 옵션 B: 데이터 테이블 (`v-data-table`)
- [x] 네비게이션 구조 결정 → **옵션 A: 좌측 사이드바 (Step 2에서 구현 완료)**

---

## Step 1. 프로젝트 기반 설정

- [x] Vite + Vue 3 + Vuetify 프로젝트 초기화
- [x] Vue Router 설정 (기본 라우트: `/`, `/auth/login`)
- [x] Pinia 인증 스토어 (`auth.js`)
- [x] Axios 인스턴스 + 인터셉터 (JWT 주입, 401 자동 리다이렉트)
- [x] 로그인 화면 기본 틀 (`LoginView.vue`)
- [x] 홈 화면 기본 틀 (`HomeView.vue`)
- [ ] `CLAUDE.md` 작성 (AI 진입점 문서)
- [x] `docs/pages.md` 작성 (화면 설계 문서)
- [x] `docs/todo.md` 작성 (개발 진행 현황)

---

## Step 2. 인증 연동

- [x] `POST /api/auth/login` 실제 연동 (응답 파싱 수정 — `response.data.data`)
- [x] JWT 디코딩으로 `loginId`, `role` 추출 (`auth.js` store)
- [x] 로그인 실패 에러 메시지 처리 (LoginView 기존 구현)
- [x] 라우터 역할 기반 가드 추가 (`meta.roles` 체크 — MANAGER/ADMIN 전용 페이지 보호)
- [x] `DefaultLayout.vue` — 역할별 네비게이션 메뉴 분기
- [x] 전체 라우트 등록 (prompt/new, prompt/history, manage/*)

---

## Step 3. 카테고리 관리 화면 (`/manage/categories`) ✅

- [x] `CategoryView.vue` 구현 (MANAGER/ADMIN 전용)
- [x] 카테고리 목록 조회 (단계별 드릴다운)
- [x] 카테고리 추가 다이얼로그 (`POST /api/categories`)
- [x] 카테고리 수정 다이얼로그 (`PUT /api/categories/{id}`)
- [x] 카테고리 삭제 확인 + 에러 처리 (`DELETE /api/categories/{id}`, `C004` 처리)

---

## Step 4. 태그 관리 화면 (`/manage/tags`) ✅

- [x] `TagView.vue` 구현 (MANAGER/ADMIN 전용)
- [x] 태그 그룹 목록 (`GET /api/tag-groups`)
- [x] 태그 그룹 추가/수정/삭제 (`TG002` 에러 처리)
- [x] 그룹 선택 시 태그 목록 표시 (`GET /api/tags?tagGroupId=`)
- [x] 태그 추가/수정/삭제

---

## Step 5. 프롬프트 생성 화면 (`/prompt/new`) ✅

- [x] `PromptNewView.vue` 생성 + 라우터 등록
- [x] 카테고리 드릴다운 컴포넌트 (가로 4단계 v-select)
  - [x] LCS 목록 조회 (`GET /api/categories?parentId=`)
  - [x] 선택 시 하위 단계 순차 조회 (MCS → SCS → DCS)
  - [x] DCS 최종 선택값 상태 관리
- [x] 태그 선택 컴포넌트
  - [x] 태그 그룹 목록 조회 (`GET /api/tag-groups`)
  - [x] 그룹별 태그 조회 (`GET /api/tags?tagGroupId=`)
  - [x] `is_multi_select` 여부에 따라 단일/복수 선택 UI 분기
- [x] 프롬프트 생성 버튼 (`POST /api/prompts/goods`) ~~`POST /api/prompts`~~
  - [x] 카테고리 미선택 시 버튼 비활성화
  - [x] 로딩 스피너
- [x] 생성 결과 표시
  - [x] 영문 프롬프트 텍스트 박스
  - [x] 클립보드 복사 버튼
  - [x] 재생성 버튼
- [x] 일일 한도 초과 에러 처리 (`P001`)

### ⚠️ BO 리팩터링 반영 (2026-03-03)

> BO 상품 프롬프트 생성 API 변경사항 — `PromptNewView.vue` 수정 필요

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 엔드포인트 | `POST /api/prompts` | `POST /api/prompts/goods` |
| 요청 body 필드명 | `categoryId` | `goodsCategoryId` |
| 응답 body 필드명 | `categoryId` | `goodsCategoryId` |

**수정 파일**: `src/views/prompt/PromptNewView.vue`

- [x] `api.post('/prompts', ...)` → `api.post('/prompts/goods', ...)`
- [x] 요청 body `categoryId: selectedDcs.value` → `goodsCategoryId: selectedDcs.value`
- [x] 응답 `categoryId` 참조 확인 (현재는 `promptText`만 사용 중 → 실질 영향 없음)

> **변경 없는 것**: 히스토리 조회 `GET /api/prompts` — URL·응답 스펙 그대로 유지

---

## Step 6. 프롬프트 이력 화면 (`/prompt/history`)

- [ ] `PromptHistoryView.vue` 구현
- [ ] 이력 목록 조회 (`GET /api/prompts`) — URL·응답 스펙 변경 없음, UI 방식 결정 후 구현
- [ ] 항목 클릭 시 전체 프롬프트 텍스트 표시 (다이얼로그 또는 확장)
- [ ] 클립보드 복사 버튼
- [ ] USER: 같은 팀 이력만 표시 (팀 미배정 시 빈 목록 안내)
- [ ] MANAGER/ADMIN: 전체 이력 표시
- [ ] ⚠️ 응답 필드명 주의: 카테고리 ID는 `goodsCategoryId` (구 `categoryId` 아님)

---

## Step 7. 사용자 관리 화면 (`/manage/users`)

- [ ] `UserView.vue` 구현 (ADMIN 전용)
- [ ] 사용자 목록 조회 + 검색 필터 (`GET /api/users?name=&teamName=&role=`)
- [ ] 사용자 추가 다이얼로그 (`POST /api/users`)
- [ ] 사용자 수정 다이얼로그 (`PUT /api/users/{id}`)
- [ ] 사용자 삭제 확인 (`DELETE /api/users/{id}`)

---

---

## Phase 2. 코드 리팩터링 (코딩 컨벤션 현행화)

> **근거**: `.cursor/rules/coding-convention.mdc` — 이벤트 핸들러는 `on` + PascalCase 규칙
> **대상**: Step 1~5에서 구현된 기존 코드

### R1. `LoginView.vue` — 이벤트 핸들러 네이밍

| 현재 | 변경 후 |
|---|---|
| `handleLogin` | `onLogin` |

### R2. `DefaultLayout.vue` — 이벤트 핸들러 네이밍

| 현재 | 변경 후 |
|---|---|
| `handleLogout` | `onLogout` |

### R3. `CategoryView.vue` — 이벤트 핸들러 네이밍

| 현재 | 변경 후 |
|---|---|
| `selectCategory` | `onCategorySelect` |
| `openAddDialog` | `onAddDialogOpen` |
| `openEditDialog` | `onEditDialogOpen` |
| `openDeleteDialog` | `onDeleteDialogOpen` |
| `submitAdd` | `onAddSubmit` |
| `submitEdit` | `onEditSubmit` |
| `submitDelete` | `onDeleteSubmit` |

### R4. `TagView.vue` — 이벤트 핸들러 네이밍

| 현재 | 변경 후 |
|---|---|
| `selectGroup` | `onGroupSelect` |
| `openAddGroupDialog` | `onAddGroupDialogOpen` |
| `openEditGroupDialog` | `onEditGroupDialogOpen` |
| `openDeleteGroupDialog` | `onDeleteGroupDialogOpen` |
| `submitAddGroup` | `onAddGroupSubmit` |
| `submitEditGroup` | `onEditGroupSubmit` |
| `submitDeleteGroup` | `onDeleteGroupSubmit` |
| `openAddTagDialog` | `onAddTagDialogOpen` |
| `openEditTagDialog` | `onEditTagDialogOpen` |
| `openDeleteTagDialog` | `onDeleteTagDialogOpen` |
| `submitAddTag` | `onAddTagSubmit` |
| `submitEditTag` | `onEditTagSubmit` |
| `submitDeleteTag` | `onDeleteTagSubmit` |

### R5. `PromptNewView.vue` — 이벤트 핸들러 네이밍

| 현재 | 변경 후 |
|---|---|
| `toggleTag` | `onTagToggle` |
| `generatePrompt` | `onGeneratePrompt` |
| `copyToClipboard` | `onCopyToClipboard` |
| `regenerate` | `onRegenerate` |

---

## 참고 문서

- 화면 설계: [`docs/pages.md`](pages.md)
- 백엔드 개발 현황: `ns-creative-studio-bo/docs/todo.md`
- 백엔드 API: Swagger UI `http://localhost:8080/swagger-ui/index.html`
