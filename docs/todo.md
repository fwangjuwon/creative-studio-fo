# TODO

> **프로젝트**: ns-creative-studio-fo
> **상태**: ✅ 전체 완료 (feat/history-detailize 반영 완료)
> **최종 업데이트**: 2026-03-09 (BO feat/history-detailize 반영 — promptStyle, 이력 상세화)

---

## 결정 필요 사항

- [x] 카테고리 드릴다운 UI 방식 결정 → **옵션 A: 가로 4단계 셀렉트박스 (`v-select` 4개)**
- [x] 프롬프트 이력 표시 방식 결정 → **옵션 A: 카드 리스트**
- [x] 네비게이션 구조 결정 → **옵션 A: 좌측 사이드바 (Step 2에서 구현 완료)**

---

## Step 1. 프로젝트 기반 설정

- [x] Vite + Vue 3 + Vuetify 프로젝트 초기화
- [x] Vue Router 설정 (기본 라우트: `/`, `/auth/login`)
- [x] Pinia 인증 스토어 (`auth.js`)
- [x] Axios 인스턴스 + 인터셉터 (JWT 주입, 401 자동 리다이렉트)
- [x] 로그인 화면 기본 틀 (`LoginView.vue`)
- [x] 홈 화면 기본 틀 (`HomeView.vue`)
- [x] `CLAUDE.md` 작성 (AI 진입점 문서)
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

### TAB 1: 상품 사진 프롬프트 ✅

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

### TAB 2: 인물 사진 프롬프트 ✅

- [x] 탭 전환 시 단계 구조 로드 (`GET /api/human-prompts/steps`)
- [x] 단계(Step)별 속성(Attr) 칩 선택 UI
  - [x] `multiSelect` 여부에 따라 단일/복수 선택 분기
  - [x] `required` 속성 필수 뱃지 표시
- [x] 추가 옵션 입력 (생성 목적, 추가 지시 사항) — 선택 사항
- [x] 프롬프트 생성 버튼 2종 (`POST /api/human-prompts`)
  - [x] NanoBanana 스타일 (`NANO_BANANA`)
  - [x] MidJourney 스타일 (`MID_JOURNEY`)
  - [x] 각 버튼 독립적 로딩 상태 (한 버튼 생성 중 나머지 비활성화)
- [x] 생성 결과 표시 (스타일 뱃지 포함)
  - [x] 영문 프롬프트 텍스트 박스
  - [x] 클립보드 복사 버튼
  - [x] 재생성 버튼
- [x] 이미지 생성 버튼 (`POST /api/human-prompts/generate-image`, 타임아웃 2분)
  - [x] 생성된 이미지 표시

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

## Step 6. 프롬프트 이력 화면 (`/prompt/history`) ✅

- [x] `PromptHistoryView.vue` 구현
- [x] 이력 목록 조회 (`GET /api/prompts`)
- [x] 프롬프트 타입(상품/인물) 뱃지 표시
- [x] 클립보드 복사 버튼
- [x] 새로고침 버튼
- [x] 이미지 생성된 항목 썸네일 표시
- [x] USER: 같은 팀 이력만 표시 (백엔드 필터링)
- [x] MANAGER/ADMIN: 전체 이력 표시

### ✅ feat/history-detailize 반영 (2026-03-09)

> BO `feat/history-detailize` 반영 — 프롬프트 생성/이력 API 변경사항

- [x] 상품 프롬프트 생성 버튼 2종으로 변경 (`NanoBanana` / `MidJourney`) — `POST /api/prompts/goods` 요청에 `promptStyle` 포함
- [x] 이력 카드에 `promptStyle` 스타일 뱃지 표시 (공통)
- [x] 이력 카드에 카테고리 경로(`categoryPath`) 표시 (PRODUCT)
- [x] 이력 카드에 태그 이름(`tagNames`) 칩 목록 표시 (PRODUCT)
- [x] 이력 카드에 선택 옵션(`optionNames`) 칩 목록 표시 (PERSON)
- [x] 이력 카드에 생성 목적(`purpose`), 추가 지시(`additionalNotes`) 표시 (PERSON)

---

## Step 7. 사용자 관리 화면 (`/manage/users`) ✅

- [x] `UserView.vue` 구현 (ADMIN 전용)
- [x] 사용자 목록 조회 + 검색 필터 (`GET /api/users?name=&teamName=&role=`)
- [x] 사용자 추가 다이얼로그 (`POST /api/users`)
- [x] 사용자 수정 다이얼로그 (`PUT /api/users/{id}`)
- [x] 사용자 삭제 확인 (`DELETE /api/users/{id}`)

---

---

## Phase 2. 코드 리팩터링 (코딩 컨벤션 현행화) ✅

> **근거**: `.cursor/rules/coding-convention.mdc` — 이벤트 핸들러는 `on` + PascalCase 규칙
> **대상**: Step 1~5에서 구현된 기존 코드

### R1. `LoginView.vue` ✅

| 변경 전 | 변경 후 |
|---|---|
| `handleLogin` | `onLogin` |

### R2. `DefaultLayout.vue` ✅

| 변경 전 | 변경 후 |
|---|---|
| `handleLogout` | `onLogout` |

### R3. `CategoryView.vue` ✅

| 변경 전 | 변경 후 |
|---|---|
| `selectCategory` | `onCategorySelect` |
| `openAddDialog` | `onAddDialogOpen` |
| `openEditDialog` | `onEditDialogOpen` |
| `openDeleteDialog` | `onDeleteDialogOpen` |
| `submitAdd` | `onAddSubmit` |
| `submitEdit` | `onEditSubmit` |
| `submitDelete` | `onDeleteSubmit` |

### R4. `TagView.vue` ✅

| 변경 전 | 변경 후 |
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

### R5. `PromptNewView.vue` ✅

| 변경 전 | 변경 후 |
|---|---|
| `toggleTag` | `onTagToggle` |
| `generatePrompt` | `onGeneratePrompt` |
| `copyToClipboard` | `onCopyToClipboard` |
| `regenerate` | `onRegenerate` |

---

## Step 8. 인물 프롬프트 구조 관리 화면 (`/manage/human-prompts`) 🔲

> **참고 API 명세**: `temp/frontend-human-prompt-step-attr-option-cud.md`  
> **권한**: MANAGER+  
> **도메인 구조**: Step → Attr → Option (3단계 계층)

### 결정 사항

- [x] **UI 레이아웃 방식** — **2패널 + 오른쪽 확장** (TagView 패턴 확장)
  - 왼쪽: Step 목록 (고정 5개)
  - 오른쪽: 선택된 Step의 Attr 목록, 각 Attr 행 펼치면 Option 목록 인라인 표시
- [x] **네비게이션 메뉴명** — **"인물 속성 관리"**

### 신규 파일 / 설정 변경

- [ ] `src/views/manage/HumanPromptStructureView.vue` 생성
- [ ] `src/router/index.js` — 라우트 추가 (`/manage/human-prompts`, MANAGER+, `manage-human-prompts`)
- [ ] `src/layouts/DefaultLayout.vue` — navItems에 메뉴 항목 추가 (MANAGER+ 조건)
- [ ] `docs/pages.md` — 화면 스펙 섹션 추가
- [ ] `CLAUDE.md` / `GEMINI.md` — 소스 구조·화면 목록 업데이트

### 데이터 로드

- [ ] 마운트 시 `GET /api/human-prompts/steps` 로 전체 트리 로드

### Step CUD

- [ ] Step 생성 다이얼로그 — `stepNumber`(number), `stepCode`(string), `name`(string)
- [ ] Step 수정 다이얼로그 — `stepNumber`, `name`만 수정 가능 (`stepCode` 필드 disabled 표시)
- [ ] Step 삭제 확인 다이얼로그 — 하위 Attr 존재 시 400 → `response.data.message` 표시

### Attr CUD

- [ ] Attr 생성 다이얼로그 — `name`, `isMultiSelect`(switch), `isRequired`(switch), `sortOrder`(number)
- [ ] Attr 수정 다이얼로그 — 동일 필드 (`stepId` 변경 불가 — 폼에서 제외)
- [ ] Attr 삭제 확인 다이얼로그 — 하위 Option 존재 시 400 → `response.data.message` 표시

### Option CUD

- [ ] Option 생성 다이얼로그 — `name`(한국어 표시명), `promptValue`(Gemini 전달 영문값), `sortOrder`(number)
- [ ] Option 수정 다이얼로그 — 동일 필드 (`attrId` 변경 불가 — 폼에서 제외)
- [ ] Option 삭제 확인 다이얼로그 — 이력 참조 중 400 → `response.data.message` 표시

### ⚠️ 기술적 주의사항 (구현 시 반드시 확인)

| 상황 | `isMultiSelect` 필드명 | `isRequired` 필드명 |
|---|---|---|
| `GET /api/human-prompts/steps` 조회 응답 | `multiSelect` (is 접두사 **없음**) | `required` (is 접두사 **없음**) |
| `POST/PUT` 요청 body 및 응답 | `isMultiSelect` (is 접두사 **있음**) | `isRequired` (is 접두사 **있음**) |

→ 수정 다이얼로그 open 시 GET 응답 데이터를 폼에 bind할 때 필드명 변환 필요  
→ `attr.multiSelect` → `form.isMultiSelect`, `attr.required` → `form.isRequired`

---

## 참고 문서

- 화면 설계: [`docs/pages.md`](pages.md)
- 백엔드 개발 현황: `ns-creative-studio-bo/docs/todo.md`
- 백엔드 API: Swagger UI `http://localhost:8080/swagger-ui/index.html`
