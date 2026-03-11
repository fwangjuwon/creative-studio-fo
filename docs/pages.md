# 화면 목록 (Pages)

> **프로젝트**: ns-creative-studio-fo
> **최초 작성일**: 2026-02-27
> **기반 문서**: `ns-creative-studio-bo/docs/requirements.md`
> **상태**: 초안 v1.0

---

## 1. 개요

NS Creative Studio 프론트엔드 화면 목록 및 설계 문서.

사용자가 **상품 카테고리 + 이미지 스타일 태그**를 선택하면, Gemini API를 통해 이미지 생성 프롬프트를 자동 생성하는 서비스의 UI.

---

## 2. 권한(Role) 별 접근 가능 화면

| Role | 설명 | 접근 가능 화면 |
|------|------|----------------|
| `ADMIN` | 총 관리자 | 전체 화면 |
| `MANAGER` | USER 권한 + 관리 기능 | 프롬프트 생성/이력 + 카테고리·태그·인물 속성 관리 |
| `USER` | 기본 사용자 | 프롬프트 생성, 팀 이력 조회 |

---

## 3. 레이아웃 구조

```
App.vue
├── AuthLayout.vue        ← 로그인 전 (네비게이션 없음)
│   └── LoginView.vue
└── DefaultLayout.vue     ← 로그인 후 (사이드바 + 헤더 포함)
    ├── HomeView.vue
    ├── prompt/
    │   ├── PromptNewView.vue
    │   └── PromptHistoryView.vue
    └── manage/           ← ADMIN / MANAGER만 접근
        ├── CategoryView.vue
        ├── TagView.vue
        ├── HumanPromptStructureView.vue
        └── UserView.vue  ← ADMIN만 접근
```

---

## 4. 화면 목록

### 4-1. 인증 (공통)

#### `/auth/login` — 로그인
- **레이아웃**: AuthLayout
- **접근 권한**: 비로그인 전용 (로그인 상태면 `/`로 리다이렉트)
- **기능**:
  - ID / PW 입력 → `POST /api/auth/login` 호출
  - 성공 시 JWT Access Token을 `localStorage`에 저장 후 `/`로 이동
  - 실패 시 에러 메시지 표시
- **API**: `POST /api/auth/login`
- **상태**: ✅ 구현됨 (백엔드 Step 4 완료 후 연동 가능)

---

### 4-2. 공통 (로그인 후)

#### `/` — 대시보드 (홈)
- **레이아웃**: DefaultLayout
- **접근 권한**: 로그인 필수 (전 역할 공통)
- **기능**:
  - 서비스 소개 / 빠른 메뉴 진입
  - 오늘 프롬프트 생성 횟수 / 남은 횟수 표시 (USER 기준)
- **API**: 별도 API 없음 (또는 사용자 정보 활용)
- **상태**: 🟡 기본 틀 구현됨, 내용 미구현

---

### 4-3. 프롬프트 (USER / MANAGER / ADMIN)

#### `/prompt/new` — 프롬프트 생성
- **레이아웃**: DefaultLayout
- **접근 권한**: 전 역할 (로그인 필수)
- **탭 구조**: 상품 사진 프롬프트 / 인물 사진 프롬프트 두 탭으로 구성
- **상태**: ✅ 구현됨

##### TAB 1: 상품 사진 프롬프트
- **기능**:
  1. **카테고리 선택** (4단계 드릴다운)
     - 대분류(LCS) 목록 표시 → 선택
     - 중분류(MCS) 목록 표시 → 선택
     - 소분류(SCS) 목록 표시 → 선택
     - 세분류(DCS) 목록 표시 → **최종 선택** (필수)
  2. **태그 선택** (태그 그룹별 칩 UI)
     - 태그 그룹 목록 조회 → 그룹별로 태그 칩 렌더링
     - `is_multi_select = false`: 단일 선택 (라디오 동작)
     - `is_multi_select = true`: 복수 선택 (체크박스 동작)
  3. **프롬프트 생성** 버튼 — 스타일 2종
     - `NanoBanana` 스타일 버튼 (`NANO_BANANA`)
     - `MidJourney` 스타일 버튼 (`MID_JOURNEY`)
     - 카테고리 미선택 시 버튼 비활성화
     - 한 버튼 생성 중 나머지 버튼 비활성화
  4. **결과 표시**
     - 생성된 영문 프롬프트 텍스트 박스 (스타일 뱃지 표시)
     - 클립보드 복사 버튼
     - 재생성 버튼 (마지막 사용 스타일로 재호출)
- **API**:
  - `GET /api/categories?parentId=` (단계별 반복 호출)
  - `GET /api/tag-groups`
  - `GET /api/tags?tagGroupId=`
  - `POST /api/prompts/goods` → 요청: `{ goodsCategoryId, tagIds[], promptStyle }` / 응답: `{ promptText }`
- **참고**: USER는 일일 생성 한도 초과 시 에러 메시지 표시 (에러코드 `P001`)

##### TAB 2: 인물 사진 프롬프트
- **기능**:
  1. **단계별 속성 선택** (백엔드에서 단계 구조 동적 로드)
     - 각 단계(Step)는 여러 속성(Attr)을 포함
     - 속성별 `multiSelect` 여부에 따라 단일/복수 선택 칩 UI
     - `required` 속성은 필수 뱃지 표시
  2. **추가 옵션** (선택 사항)
     - 생성 목적 (예: SNS 광고용, 커머스 상세페이지)
     - 추가 지시 사항 (Gemini에게 직접 전달할 자유 텍스트)
  3. **프롬프트 생성** 버튼 — 스타일 2종
     - `NanoBanana` 스타일 (`NANO_BANANA`)
     - `MidJourney` 스타일 (`MID_JOURNEY`)
  4. **결과 표시**
     - 생성된 영문 프롬프트 텍스트 박스 (스타일 뱃지 표시)
     - 클립보드 복사 버튼
     - 재생성 버튼
     - **이미지 생성 버튼** (NanoBanana API로 직접 이미지 생성)
- **API**:
  - `GET /api/human-prompts/steps` → 단계/속성/옵션 구조 조회
    - 응답: `[{ id, stepNumber, name, attrs: [{ id, name, multiSelect, required, options: [{ id, name }] }] }]`
  - `POST /api/human-prompts` → 프롬프트 생성
    - 요청: `{ selections: { attrId: [optionId] }, purpose, additionalNotes, promptStyle }`
    - 응답: `{ id, promptText }`
  - `POST /api/human-prompts/generate-image` → 이미지 생성 (타임아웃 2분)
    - 요청: `{ historyId, promptText }`
    - 응답: `{ imageUrl }`

---

#### `/prompt/history` — 프롬프트 이력
- **레이아웃**: DefaultLayout
- **접근 권한**: 전 역할 (로그인 필수)
- **기능**:
  - 프롬프트 생성 이력 카드 목록 표시
  - 각 항목: 생성일시, 생성자, 프롬프트 타입(상품/인물) 뱃지, 스타일 뱃지(NanoBanana/MidJourney), 프롬프트 텍스트
  - **PRODUCT** 항목: 카테고리 경로(`대분류 > 중분류 > 소분류 > 세분류`), 선택 태그 칩 목록
  - **PERSON** 항목: 선택 옵션 칩 목록, 생성 목적, 추가 지시 사항 (값 있을 때만)
  - 이미지 생성된 항목은 이미지 썸네일 함께 표시
  - 클립보드 복사 버튼
  - 새로고침 버튼
  - **USER**: 같은 팀 이력만 표시 (백엔드에서 필터링)
  - **MANAGER / ADMIN**: 전체 이력 표시
- **API**: `GET /api/prompts`
  - 응답 신규 필드: `promptStyle`, `categoryPath`, `tagNames` (PRODUCT), `optionNames`, `purpose`, `additionalNotes` (PERSON)
- **상태**: ✅ 구현됨

---

### 4-4. 관리 (MANAGER / ADMIN)

#### `/manage/categories` — 카테고리 관리
- **레이아웃**: DefaultLayout
- **접근 권한**: `MANAGER`, `ADMIN`
- **기능**:
  - 카테고리 트리 구조 표시 (4단계 계층)
  - 카테고리 추가 / 수정 / 삭제
  - 삭제 시 자식 카테고리 존재하면 에러 표시 (`C004`)
- **API**:
  - `GET /api/categories?parentId=`
  - `POST /api/categories`
  - `PUT /api/categories/{id}`
  - `DELETE /api/categories/{id}`
- **상태**: ✅ 구현됨

---

#### `/manage/tags` — 태그 / 태그그룹 관리
- **레이아웃**: DefaultLayout
- **접근 권한**: `MANAGER`, `ADMIN`
- **기능**:
  - 태그 그룹 목록 (이름, 단일/복수 선택 여부)
  - 그룹 추가 / 수정 / 삭제
  - 그룹 삭제 시 소속 태그 존재하면 에러 표시 (`TG002`)
  - 태그 그룹 선택 → 해당 그룹의 태그 목록 표시
  - 태그 추가 / 수정 / 삭제
- **API**:
  - `GET /api/tag-groups`
  - `POST /api/tag-groups`
  - `PUT /api/tag-groups/{id}`
  - `DELETE /api/tag-groups/{id}`
  - `GET /api/tags?tagGroupId=`
  - `POST /api/tags`
  - `PUT /api/tags/{id}`
  - `DELETE /api/tags/{id}`
- **상태**: ✅ 구현됨

---

#### `/manage/human-prompts` — 인물 속성 관리
- **레이아웃**: DefaultLayout
- **접근 권한**: `MANAGER`, `ADMIN`
- **기능**:
  - 인물 프롬프트 구조 트리 표시 (Step → Attr → Option 3단계 계층)
  - **Step 관리**: 추가 / 수정 / 삭제
    - 생성 시 `stepCode` 지정 (생성 후 수정 불가)
    - 삭제 시 하위 Attr 존재하면 오류 메시지 표시
  - **Attr 관리**: Step 선택 후 Attr 추가 / 수정 / 삭제
    - `isMultiSelect`: 복수 선택 허용 여부 (switch)
    - `isRequired`: 필수 선택 여부 (switch)
    - 삭제 시 하위 Option 존재하면 오류 메시지 표시
  - **Option 관리**: Attr 확장 후 Option 추가 / 수정 / 삭제
    - `name`: 화면 표시명 (한국어)
    - `promptValue`: Gemini API에 전달할 영문값
    - 삭제 시 프롬프트 이력 참조 중이면 오류 메시지 표시
- **UI 레이아웃**: 2패널 — 왼쪽(Step 목록) + 오른쪽(Attr 확장 패널, 펼치면 Option 목록)
- **API**:
  - `GET /api/human-prompts/steps` — 전체 트리 조회
  - `POST/PUT/DELETE /api/human-prompts/steps/{id}` — Step CUD
  - `POST/PUT/DELETE /api/human-prompts/attrs/{id}` — Attr CUD
  - `POST/PUT/DELETE /api/human-prompts/options/{id}` — Option CUD
- **상태**: ✅ 구현됨

---

#### `/manage/users` — 사용자 관리
- **레이아웃**: DefaultLayout
- **접근 권한**: `ADMIN` 전용
- **기능**:
  - 사용자 목록 (이름, ID, 팀명, 역할, 일일 한도)
  - 검색 필터 (이름, 팀명, 역할)
  - 사용자 추가 (ADMIN만 생성 가능 — Closed 방식)
  - 사용자 수정 (이름, 역할, 팀명, 일일 한도, 비밀번호)
  - 사용자 삭제
- **API**:
  - `GET /api/users`
  - `GET /api/users?name=&teamName=&role=`
  - `POST /api/users`
  - `PUT /api/users/{id}`
  - `DELETE /api/users/{id}`
- **상태**: ✅ 구현됨

---

## 5. 라우터 구조 (목표)

```javascript
{
  path: '/',
  component: DefaultLayout,
  meta: { requiresAuth: true },
  children: [
    { path: '', name: 'home', component: HomeView },
    // 프롬프트
    { path: 'prompt/new', name: 'prompt-new', component: PromptNewView },
    { path: 'prompt/history', name: 'prompt-history', component: PromptHistoryView },
    // 관리 (MANAGER + ADMIN)
    { path: 'manage/categories', name: 'manage-categories', component: CategoryView, meta: { roles: ['MANAGER', 'ADMIN'] } },
    { path: 'manage/tags', name: 'manage-tags', component: TagView, meta: { roles: ['MANAGER', 'ADMIN'] } },
    { path: 'manage/human-prompts', name: 'manage-human-prompts', component: HumanPromptStructureView, meta: { roles: ['MANAGER', 'ADMIN'] } },
    // 관리 (ADMIN only)
    { path: 'manage/users', name: 'manage-users', component: UserView, meta: { roles: ['ADMIN'] } },
  ],
}
```

---

## 6. 참고

- 프론트엔드 개발 현황: [`docs/todo.md`](todo.md)
- 백엔드 API 명세: Swagger UI `http://localhost:8080/swagger-ui/index.html`
- 백엔드 요구사항: `ns-creative-studio-bo/docs/requirements.md`
- 백엔드 개발 현황: `ns-creative-studio-bo/docs/todo.md`
- 공통 응답 형식: `{ code, message, data }` (`CommonResponse<T>`)
- JWT: Access Token 1시간, Refresh Token 없음 (만료 시 재로그인)
