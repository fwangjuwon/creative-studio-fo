# GEMINI.md

이 파일은 Gemini CLI가 프로젝트를 이해하기 위한 진입점 문서입니다.
코드 작성 전 반드시 이 문서와 `docs/pages.md` 를 참조하세요.

---

## 프로젝트 개요

**ns-creative-studio-fo** — 이미지 생성형 AI용 프롬프트 자동 생성 서비스의 프론트엔드

사용자가 **상품 카테고리(어떤 상품)** 와 **이미지 스타일 태그(어떻게 보일지)** 를 선택하면,
백엔드(ns-creative-studio-bo)를 통해 Gemini API가 최적화된 **영문 이미지 생성 프롬프트**를 자동 생성한다.
생성된 프롬프트를 복사하여 이미지 생성 AI(nanobanana, Midjourney 등)에 직접 사용한다.

> 이 프로젝트는 UI 레이어만 담당한다. 실제 프롬프트 생성 로직과 DB는 백엔드(ns-creative-studio-bo) 담당.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | Vue 3.4 (Composition API, `<script setup>`) |
| Build | Vite 5.2 |
| UI 라이브러리 | Vuetify 3.5 (`autoImport: true`) |
| 상태 관리 | Pinia 2.1 |
| 라우터 | Vue Router 4.3 |
| HTTP 클라이언트 | Axios 1.6 |
| 아이콘 | Material Design Icons (`@mdi/font`) |

---

## 실행

```bash
# 의존성 설치
npm install

# 개발 서버 (Vite 프록시 경유 — /api → localhost:8080)
npm run dev

# 로컬 직접 연결 (.env.local 사용 — VITE_API_BASE_URL=http://localhost:8080/api)
npm run local

# 개발 서버 빌드 (.env.development 사용 — 개발 서버 도메인 직접 연결)
npm run build:dev

# 프로덕션 빌드
npm run build
```

> ⚠️ 백엔드(ns-creative-studio-bo)가 8080 포트에서 실행 중이어야 API 연동 가능.

---

## 환경 변수 & 배포

### 환경 변수 파일

| 파일 | 적용 모드 | VITE_API_BASE_URL | 용도 |
|------|-----------|-------------------|------|
| `.env` | 기본 | `http://localhost:8080/api` | Vite 프록시 사용 시 기본값 (fallback) |
| `.env.local` | `localhost` | `http://localhost:8080/api` | `npm run local` — 로컬 직접 연결 |
| `.env.development` | `development` | `https://nsm-dev-creative-bo.nsmall.com/api` | `npm run build:dev` — 개발 서버 빌드 |
| `.env.example` | — | `http://localhost:8080/api` | 환경 변수 예제 파일 |

- `src/api/index.js`: `baseURL: import.meta.env.VITE_API_BASE_URL || '/api'`
- 환경변수 미설정 시 `/api`(Vite 프록시 경유)가 fallback

### Docker 배포

```dockerfile
FROM nsm-cloud-registry.nsmall.com/nsm-images/nginx:1.25.5
COPY /dist /usr/share/nginx/html
EXPOSE 80
```

`npm run build` → `/dist` 결과물을 nginx 컨테이너에 복사하여 배포.

---

## 소스 구조

```
src/
├── api/
│   └── index.js          # Axios 인스턴스 + 인터셉터 (JWT 주입, 401 처리)
├── assets/
│   └── styles/
│       └── main.css
├── components/
│   └── common/
│       └── PageTitle.vue
├── composables/
│   └── useEscClose.js     # ESC 키 다이얼로그 닫기
├── layouts/
│   ├── DefaultLayout.vue  # 로그인 후 공통 레이아웃 (사이드바 + 헤더)
│   └── AuthLayout.vue     # 로그인 전 레이아웃
├── plugins/
│   └── vuetify.js
├── router/
│   └── index.js           # 라우트 정의 + 인증 가드
├── stores/
│   └── auth.js            # 인증 상태 (token, user, login/logout)
├── views/
│   ├── HomeView.vue
│   ├── LoginView.vue
│   ├── prompt/
│   │   ├── PromptNewView.vue
│   │   └── PromptHistoryView.vue
│   └── manage/
│       ├── CategoryView.vue
│       ├── TagView.vue
│       ├── HumanPromptStructureView.vue
│       └── UserView.vue
├── App.vue
└── main.js
```

---

## 핵심 도메인 개념

### 권한(Role) — 계층 구조
```
ADMIN > MANAGER > USER
```
| Role | 접근 가능 화면 |
|------|--------------|
| `ADMIN` | 전체 화면 |
| `MANAGER` | 프롬프트 생성/이력 + 카테고리·태그 관리 |
| `USER` | 프롬프트 생성, 같은 팀 이력 조회 |

- 회원가입 없음. ADMIN이 백엔드 API로 직접 계정 생성
- 로그인 후 `localStorage`의 `user` 객체에서 `role` 확인하여 UI 분기

### 카테고리 vs 태그 — 완전히 다른 개념

**카테고리** (어떤 상품을 이미지로 만들지)
- 3단계 계층: LCS(대) > MCS(중) > SCS(소)
- 단계별 드릴다운 UI — `GET /api/categories?parentId=` 를 단계별로 호출
- 사용자는 **SCS를 최종 선택**해야 프롬프트 생성 가능

**태그** (이미지 스타일/분위기)
- TagGroup → Tag 구조
- `is_multi_select = false` → 그룹 내 단일 선택 (라디오 동작)
- `is_multi_select = true` → 그룹 내 복수 선택 (체크박스 동작)
- ex: `인물(단일) → 남자/여자`, `분위기(복수) → 화사한/추운/따뜻한`

### 프롬프트 생성 흐름 (UI 관점)

**상품 사진** (`/prompt/new` TAB 1)
```
카테고리 드릴다운(SCS 선택) + 태그 칩 선택
  → NanoBanana / MidJourney 버튼 중 선택
  → POST /api/prompts/goods { goodsCategoryId, tagIds[], promptStyle }
  → 영문 프롬프트 텍스트 반환
  → 결과 표시 (스타일 뱃지) + 클립보드 복사
```

**인물 사진** (`/prompt/new` TAB 2)
```
단계별 옵션 선택 + 생성 목적/추가 지시 입력 (선택)
  → NanoBanana / MidJourney 버튼 중 선택
  → POST /api/human-prompts { selections, purpose, additionalNotes, promptStyle }
  → 영문 프롬프트 텍스트 반환
  → 결과 표시 + 클립보드 복사 + 이미지 생성
```

**프롬프트 이력 조회** (`/prompt/history`)
```
검색 필터 입력 (모두 선택 사항)
  - 생성자(loginId), 종류(PRODUCT|PERSON), 스타일(NANO_BANANA|MID_JOURNEY)
  - 생성일 범위(dateFrom, dateTo: yyyy-MM-dd)
  → 검색 버튼 → GET /api/prompts { pageNum, pageSize, loginId?, promptType?, promptStyle?, dateFrom?, dateTo? }
  → 이력 카드 목록 표시 (페이징)
  → 클립보드 복사 / 이미지 확인 (생성된 항목)
```

---

## API 연동 규칙

### 백엔드 공통 응답 형식
```json
{ "code": 200, "message": "OK", "data": { ... } }
```
- 성공은 항상 HTTP 200
- 실제 데이터는 `response.data.data` 에 있음

### Axios 인스턴스 사용 규칙
- **항상 `@/api`의 인스턴스** 사용 (baseURL `/api`, JWT 인터셉터 포함)
- `axios` 직접 import 금지

```javascript
// ✅ 올바른 방식
import api from '@/api'
const res = await api.get('/categories')
const categories = res.data.data

// ❌ 금지
import axios from 'axios'
axios.get('http://localhost:8080/api/categories')
```

### 인증 (JWT)
- JWT Access Token → `localStorage.setItem('token', ...)`
- 요청 인터셉터에서 자동으로 `Authorization: Bearer {token}` 헤더 주입
- 401 응답 시 자동으로 `localStorage` 초기화 + `/auth/login` 리다이렉트
  - ⚠️ `/auth/login` 자체 요청은 401 리다이렉트 대상에서 제외 (로그인 실패 에러 처리를 위해)
- Refresh Token 없음 (만료 시 재로그인)

---

## 화면 목록 (요약)

| 경로 | 화면 | 권한 | 상태 |
|------|------|------|------|
| `/auth/login` | 로그인 | 공통 | ✅ 구현됨 |
| `/` | 대시보드 | 공통 | ✅ 구현됨 |
| `/prompt/new` | 프롬프트 생성 | 공통 | ✅ 구현됨 |
| `/prompt/history` | 프롬프트 이력 | 공통 | ✅ 구현됨 |
| `/manage/categories` | 카테고리 관리 | MANAGER+ | ✅ 구현됨 |
| `/manage/tags` | 태그 관리 | MANAGER+ | ✅ 구현됨 |
| `/manage/human-prompts` | 인물 속성 관리 | MANAGER+ | ✅ 구현됨 |
| `/manage/users` | 사용자 관리 | ADMIN | ✅ 구현됨 |

> 화면 상세 스펙: [`docs/pages.md`](docs/pages.md)

---

## UI 테마 & 레이아웃

- **테마 색상**: primary 핑크 테마 (`#9D6D6F` / `#F0C3C1`) — `src/plugins/vuetify.js`
- **사이드바**: 연핑크(`#F0C3C1`) 배경
- **앱바**: 흰색 배경 + `banner.png` 이미지
- **앱바 우측**: role 칩 + loginId + 오늘 사용량 표시
- **홈 화면**: 카카오톡 말풍선 스타일 챗봇 UI (엔송이 아바타 + 사용자 아이콘)
- **로그인 화면**: 핑크 그라데이션 배경

## 태그 캐싱

`DefaultLayout.vue`에서 `<keep-alive include="PromptNewView">`를 적용하여 프롬프트 생성 화면(`PromptNewView`)의 컴포넌트 상태(태그 목록 포함)를 라우트 이동 후에도 유지한다.

```vue
<!-- DefaultLayout.vue -->
<router-view v-slot="{Component}">
  <keep-alive include="PromptNewView">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

---

## 코딩 컨벤션 핵심 규칙

> 세부 규칙 전체는 `.cursor/rules/coding-convention.mdc` 참조

### SFC 작성 순서
```vue
<script setup> ... </script>
<template> ... </template>
<style scoped> ... </style>
```

### 상태 관리 (Pinia)
- 전역 상태는 `src/stores/` 에 Pinia store로 관리
- store 내부는 Composition API 스타일 (`defineStore` + setup 함수)

### API 호출 위치
- API 호출은 **view 또는 store 내부**에서만 수행
- 컴포넌트(components/)에서 직접 API 호출 금지

### 파일 네이밍
| 대상 | 규칙 | 예시 |
|------|------|------|
| View | PascalCase + `View` suffix | `PromptNewView.vue` |
| Component | PascalCase | `CategorySelector.vue` |
| Store | camelCase 파일명, `use` prefix 함수명 | `useAuthStore` |
| Composable | camelCase 파일명, `use` prefix 함수명 | `useEscClose` |
| API 모듈 | camelCase | `promptApi.js` |

### 다이얼로그 ESC 처리
`v-dialog` 를 포함하는 모든 View는 반드시 `useEscClose` composable을 적용한다.
- dialog ref 선언 직후에 `useEscClose(...dialogRefs)` 를 호출
- 열려 있는 첫 번째 dialog ref를 ESC 키로 닫음 (인자 전달 순서가 우선순위)

```javascript
import { useEscClose } from '@/composables/useEscClose'

const deleteDialog = ref(false)
useEscClose(deleteDialog)
```

---

## 참고 문서

- 화면 설계: [`docs/pages.md`](docs/pages.md)
- 개발 진행 현황: [`docs/todo.md`](docs/todo.md)
- 코딩 컨벤션 전체: [`.cursor/rules/coding-convention.mdc`](.cursor/rules/coding-convention.mdc)
- 백엔드 API 명세: Swagger UI `http://localhost:8080/swagger-ui/index.html`
- 백엔드 요구사항: `ns-creative-studio-bo/docs/requirements.md`
