# TODO

> **프로젝트**: ns-creative-studio-fo
> **상태**: ✅ 전체 완료 (Phase 9 — 프롬프트 생성 API 타임아웃 버그 수정)
> **최종 업데이트**: 2026-03-30 (Phase 9 — 프롬프트 생성 Axios 타임아웃 60초 상향)

---

## 결정 필요 사항

- [x] 카테고리 드릴다운 UI 방식 결정 → **옵션 A: 가로 3단계 셀렉트박스 (`v-select` 3개)**
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
- [x] 카테고리 드릴다운 컴포넌트 (가로 3단계 v-select)
  - [x] LCS 목록 조회 (`GET /api/categories?parentId=`)
  - [x] 선택 시 하위 단계 순차 조회 (MCS → SCS)
  - [x] SCS 최종 선택값 상태 관리
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
- [x] 요청 body `categoryId: selectedDcs.value` → `goodsCategoryId: selectedScs.value`
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

## Step 8. 인물 프롬프트 구조 관리 화면 (`/manage/human-prompts`) ✅

> **참고 API 명세**: `temp/frontend-human-prompt-step-attr-option-cud.md`  
> **권한**: MANAGER+  
> **도메인 구조**: Step → Attr → Option (3단계 계층)

### 결정 사항

- [x] **UI 레이아웃 방식** — **2패널 + 오른쪽 확장** (TagView 패턴 확장)
  - 왼쪽: Step 목록 (고정 5개)
  - 오른쪽: 선택된 Step의 Attr 목록, 각 Attr 행 펼치면 Option 목록 인라인 표시
- [x] **네비게이션 메뉴명** — **"인물 속성 관리"**

### 신규 파일 / 설정 변경

- [x] `src/views/manage/HumanPromptStructureView.vue` 생성
- [x] `src/router/index.js` — 라우트 추가 (`/manage/human-prompts`, MANAGER+, `manage-human-prompts`)
- [x] `src/layouts/DefaultLayout.vue` — navItems에 메뉴 항목 추가 (MANAGER+ 조건)
- [x] `docs/pages.md` — 화면 스펙 섹션 추가
- [x] `CLAUDE.md` / `GEMINI.md` — 소스 구조·화면 목록 업데이트

### 데이터 로드

- [x] 마운트 시 `GET /api/human-prompts/steps` 로 전체 트리 로드

### Step CUD

- [x] Step 생성 다이얼로그 — `stepNumber`(number), `stepCode`(string), `name`(string)
- [x] Step 수정 다이얼로그 — `stepNumber`, `name`만 수정 가능 (`stepCode` 필드 disabled 표시)
- [x] Step 삭제 확인 다이얼로그 — 하위 Attr 존재 시 400 → `response.data.message` 표시

### Attr CUD

- [x] Attr 생성 다이얼로그 — `name`, `isMultiSelect`(switch), `isRequired`(switch), `sortOrder`(number)
- [x] Attr 수정 다이얼로그 — 동일 필드 (`stepId` 변경 불가 — 폼에서 제외)
- [x] Attr 삭제 확인 다이얼로그 — 하위 Option 존재 시 400 → `response.data.message` 표시

### Option CUD

- [x] Option 생성 다이얼로그 — `name`(한국어 표시명), `promptValue`(Gemini 전달 영문값), `sortOrder`(number)
- [x] Option 수정 다이얼로그 — 동일 필드 (`attrId` 변경 불가 — 폼에서 제외)
- [x] Option 삭제 확인 다이얼로그 — 이력 참조 중 400 → `response.data.message` 표시

### ⚠️ 기술적 주의사항 (구현 시 반드시 확인)

| 상황 | `isMultiSelect` 필드명 | `isRequired` 필드명 |
|---|---|---|
| `GET /api/human-prompts/steps` 조회 응답 | `multiSelect` (is 접두사 **없음**) | `required` (is 접두사 **없음**) |
| `POST/PUT` 요청 body 및 응답 | `isMultiSelect` (is 접두사 **있음**) | `isRequired` (is 접두사 **있음**) |

→ 수정 다이얼로그 open 시 GET 응답 데이터를 폼에 bind할 때 필드명 변환 필요  
→ `attr.multiSelect` → `form.isMultiSelect`, `attr.required` → `form.isRequired`

---

---

## Step 9. 사용자 사용량 표시 ✅

> **배경**: 백엔드에 사용량 조회 API 신규 추가 (`GET /api/users/me/usage`, `GET /api/users/usage`)

### 홈 화면 (`HomeView.vue`) ✅

- [x] `GET /api/users/me/usage` 연동 — 본인 금일 사용량 조회
- [x] 사용자 정보 카드에 **오늘 사용량: N / M** 표시
- [x] `remainingCount === 0` 시 경고 알림 표시 (error 색상)
- [x] 로딩 중 `v-progress-circular` 표시, 실패 시 `-` 표시

### 사용자 관리 화면 (`UserView.vue`) ✅

- [x] `GET /api/users/usage` 연동 — 전체 회원 사용량 목록 조회 (ADMIN 전용)
- [x] `usageMap` 빌드 (`userId` 기준 매핑)
- [x] `GET /api/users` + `GET /api/users/usage` 병렬 호출 (`Promise.all`) — 응답 시간 최소화
- [x] 생성/수정/삭제/검색 후 재조회 시 `loadAll()`로 통일
- [x] 테이블에 **금일 사용량** 컬럼 추가 (`todayUsedCount / dailyLimit` 표시)
- [x] `remainingCount === 0` 시 빨간 볼드 텍스트 강조

---

## Phase 3. UX 개선

### feat: ESC 키로 다이얼로그 닫기

- [x] `src/composables/useEscClose.js` 생성
- [x] `CategoryView.vue` — useEscClose 적용 (3개 다이얼로그)
- [x] `TagView.vue` — useEscClose 적용 (6개 다이얼로그)
- [x] `UserView.vue` — useEscClose 적용 (3개 다이얼로그)
- [x] `HumanPromptStructureView.vue` — useEscClose 적용 (9개 다이얼로그)
- [x] 문서 업데이트 (coding-convention, CLAUDE.md, GEMINI.md)

---

## feat/category-depth-3 반영 (2026-03-18)

> **배경**: 백엔드에서 상품 카테고리 계층을 4단계(LCS/MCS/SCS/DCS)에서 3단계(LCS/MCS/SCS)로 변경.
> 소분류(SCS)가 최종 선택 단계가 되며, `goodsCategoryId`에 SCS id를 전달해야 함.

- [x] `PromptNewView.vue` — `dcsItems`, `selectedDcs`, `loadingDcs` ref 제거
- [x] `PromptNewView.vue` — SCS watch 블록 완전 제거 (DCS 목록 API 호출 제거)
- [x] `PromptNewView.vue` — LCS/MCS watch에서 DCS 초기화 코드 제거
- [x] `PromptNewView.vue` — `canGenerate` 조건 `selectedScs`로 변경
- [x] `PromptNewView.vue` — `goodsCategoryId: selectedScs.value` 전달
- [x] `PromptNewView.vue` — 세분류 `v-select` 제거, 3단계 컬럼 레이아웃 적용
- [x] `CategoryView.vue` — `CATEGORY_TYPES`에서 `'DCS'` 제거
- [x] `CategoryView.vue` — `panels` 배열 3개로 축소
- [x] `CategoryView.vue` — `onCategorySelect` 조건 `panelIndex < 2`로 수정
- [x] `CategoryView.vue` — `clearPanelsFrom` 반복 범위 3으로 수정
- [x] `CategoryView.vue` — 3단계 컬럼 레이아웃 적용

---

---

## Phase 4. 이미지 생성 기능 확장

### feat: 상품 탭 이미지 생성 버튼 추가 (2026-03-10)

- [x] `PromptNewView.vue` (TAB 1) — 이미지 생성(NanoBanana) 버튼 추가
- [x] `goodsPromptHistoryId` 저장 후 `POST /api/prompts/goods/generate-image` 호출
- [x] TAB 1/TAB 2 이미지 표시 영역 + 에러 처리 추가 (TAB 2와 동일 구조)

### feat: 이미지 3장 그리드 & 이력 이미지 토글 (2026-03-11)

- [x] `PromptNewView.vue` — 이미지 결과 3장 그리드 레이아웃 + 각 이미지 다운로드 버튼
- [x] `PromptHistoryView.vue` — `imageUrls[]` 배열 기반으로 변경
- [x] `PromptHistoryView.vue` — '이미지 확인(N장)' 버튼 클릭 시 `v-expand-transition` 펼침
- [x] `PromptHistoryView.vue` — 'N장 생성됨' 이미지 뱃지 표시

### fix: 인물 프롬프트 생성 필수 항목 검증 (2026-03-11)

- [x] `PromptNewView.vue` — `required` Attr 미선택 시 에러 메시지 표시 후 생성 중단

---

## Phase 5. 캐싱 & 테마 & 환경 설정

### feat: 태그 캐싱 — KeepAlive 적용 (2026-03-12)

- [x] `DefaultLayout.vue` — `<keep-alive include="PromptNewView">` 적용
  - 프롬프트 생성 화면 컴포넌트 상태(태그 목록 등)를 라우트 이동 후에도 유지

### feat: 홈 화면 엔송이 챗봇 UI & 전체 핑크 테마 적용 (2026-03-16)

- [x] `HomeView.vue` — 카카오톡 말풍선 스타일 챗봇 UI (엔송이 아바타 + 사용자 아이콘)
- [x] `DefaultLayout.vue` — 앱바 흰색 배경 + `banner.png` 적용
- [x] `DefaultLayout.vue` — 사이드바 연핑크(`#F0C3C1`) 테마 적용
- [x] `DefaultLayout.vue` — 앱바 우측에 role 칩 + loginId + 오늘 사용량 이동
- [x] `AuthLayout.vue` / `LoginView.vue` — 로그인 배경 핑크 그라데이션 테마 적용
- [x] `vuetify.js` — primary 핑크 테마(`#9D6D6F` / `#F0C3C1`) 적용
- [x] `PromptNewView.vue` — 초기화 버튼 추가 (상품/인물 탭별 전체 상태 리셋)
- [x] `PromptNewView.vue` — `canGeneratePerson` 조건 추가 (인물 탭 필수 항목 선택 시 버튼 활성화)

### chore: 환경별 API baseURL 분리 & 실행 스크립트 추가 (2026-03-24~25)

- [x] `.env` / `.env.local` / `.env.development` 환경 변수 파일 생성 (`.env.example` 포함)
- [x] `src/api/index.js` — `baseURL: import.meta.env.VITE_API_BASE_URL || '/api'` 적용
- [x] `package.json` — `npm run local` 스크립트 추가 (`--mode localhost`)
- [x] `package.json` — `npm run build:dev` 스크립트 추가 (`--mode development`)

### fix: 로그인 실패 시 401 인터셉터 리다이렉트 문제 수정 (2026-03-25)

- [x] `src/api/index.js` — `/auth/login` URL은 401 리다이렉트 대상에서 제외

---

## Phase 6. 이미지 비율(imageAspectRatio) 지원

### feat: 이미지 사이즈 선택 및 이력 표시 지원 (2026-03-23~24)

- [x] `PromptNewView.vue` — 이미지 사이즈 태그 그룹을 `tagIds`에서 분리, `imageAspectRatio`로 별도 전송 (상품/인물 모두)
- [x] `PromptNewView.vue` — 이미지 미리보기에 선택한 aspect ratio 적용
- [x] `PromptHistoryView.vue` — 이력 목록에 `imageAspectRatio` 칩 표시 (상품/인물 모두)

---

## feat/prompt-history-filter 반영 (2026-03-30)

> BO `feat/prompt-history-filter` 반영 — 프롬프트 이력 조회 API 검색 필터 파라미터 추가

- [x] `PromptHistoryView.vue` — 검색 필터 state 추가 (`filterLoginId`, `filterPromptType`, `filterPromptStyle`, `filterDateFrom`, `filterDateTo`)
- [x] `PromptHistoryView.vue` — `fetchHistories` 수정: 빈 값은 파라미터 미전송 (빈 문자열 전송 금지)
- [x] `PromptHistoryView.vue` — `onSearch` 함수 추가: 검색 버튼 클릭 시 `pageNum=1` 리셋 후 재조회
- [x] `PromptHistoryView.vue` — `onReset` 함수 추가: 전체 필터 초기화 + `pageNum=1` 재조회
- [x] `PromptHistoryView.vue` — 검색 필터 UI 추가 (생성자 텍스트 입력, 종류·스타일 드롭다운, 생성일 범위)
- [x] `PromptHistoryView.vue` — 생성자 `clearable` X 버튼 클릭 시 `null.trim()` 오류 수정 (`?.` 옵셔널 체이닝)
- [x] `PromptHistoryView.vue` — 생성일 역전 유효성 검사 추가 (시작일 > 종료일 시 조회 차단 + 에러 표시)
- [x] `docs/pages.md` — `/prompt/history` 기능 및 API 파라미터 현행화
- [x] `CLAUDE.md` / `GEMINI.md` — 프롬프트 이력 조회 흐름 다이어그램 추가
- [x] `.cursor/rules/project-context.mdc` — 이력 검색 필터 파라미터 섹션 추가

---

## Phase 7. 검색 UX 개선

### feat: 사용자 관리 팀명 검색 부분일치 개선 (2026-03-26)

- [x] `UserView.vue` — 팀명 검색 완전일치(`===`) → 부분일치(`includes()`)로 변경
  - 백엔드 API 변경 없이 클라이언트 사이드 필터링

---

## Phase 8. 보안 UX 개선

### feat: 참조 이미지 업로드 클라이언트 유효성 검증 (2026-03-25)

> **배경**: 백엔드에서 MIME 타입 검증 구현 완료 → 프론트엔드에서도 즉각적인 피드백 제공

- [x] `PromptNewView.vue` — `ALLOWED_IMAGE_TYPES` / `ALLOWED_IMAGE_EXTENSIONS` 상수 정의 (`jpg, jpeg, png, webp`)
- [x] `PromptNewView.vue` — 파일 크기 상한 상수 정의 (`MAX_IMAGE_SIZE_MB = 10`)
- [x] `PromptNewView.vue` — `onGoodsReferenceImageChange` 에 3단계 검증 추가
  1. MIME 타입 검증 (`file.type` — 허용 목록 외 차단)
  2. 확장자 검증 (`file.name` 기반 이중 방어)
  3. 파일 크기 검증 (10MB 초과 차단)
  - 검증 실패 시: 파일 입력 초기화(`fileInputKey++`) + `goodsReferenceImageError` 에러 메시지 세트
- [x] `PromptNewView.vue` — `accept` 속성 `image/*` → `.jpg,.jpeg,.png,.webp` 명시적 목록으로 변경
- [x] `PromptNewView.vue` — `v-file-input` 라벨에 허용 형식 안내 문구 추가
- [x] `PromptNewView.vue` — `v-alert` (error/tonal) 에러 메시지 표시 + 닫기 버튼
- [x] `PromptNewView.vue` — `resetProduct()` 에 `goodsReferenceImageError` 초기화 추가

---

## Phase 9. 버그 수정

### fix: 프롬프트 생성 API 타임아웃 10초 → 60초 상향 (2026-03-30)

> **원인**: Gemini API 응답이 10초를 초과하면 Axios 기본 타임아웃(10s)에 걸려
> 요청이 중단(NS_BINDING_ABORTED)되며 프론트엔드에 오류 표시.
> 백엔드는 요청을 계속 처리해 DB에는 정상 저장되는 간헐적 버그.

- [x] `PromptNewView.vue` — `onGeneratePrompt` (상품 탭) `{ timeout: 60000 }` 추가
- [x] `PromptNewView.vue` — `generatePersonPrompt` (인물 탭) `{ timeout: 60000 }` 추가

---

## Phase 10. 코드리뷰 개선사항 반영

### fix: 404 Not Found 페이지 추가 (2026-04-02)

> **배경**: 코드리뷰 지적사항 [LOW] — 라우터 catch-all이 `/`로 리다이렉트만 하여
> 존재하지 않는 URL 접근 시 사용자가 왜 홈으로 이동했는지 알 수 없는 UX 문제.

- [x] `src/views/NotFoundView.vue` 신규 생성
  - http.cat 404 이미지 표시 (`https://http.cat/images/404.jpg`)
  - 이미지 로드 전 `v-skeleton-loader` 표시 (로딩 UX 개선)
  - 이미지 로드 실패 시 자연스럽게 숨김 처리 (`@error`)
  - "홈으로 돌아가기" 버튼 (`secondary` 컬러, 프로젝트 핑크 테마 적용)
- [x] `src/router/index.js` — catch-all 라우트 `redirect: '/'` → `NotFoundView` 렌더링으로 변경

---

## 참고 문서

- 화면 설계: [`docs/pages.md`](pages.md)
- 백엔드 개발 현황: `ns-creative-studio-bo/docs/todo.md`
- 백엔드 API: Swagger UI `http://localhost:8080/swagger-ui/index.html`
