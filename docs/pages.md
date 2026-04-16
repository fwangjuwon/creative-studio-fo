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
- **UI**: 카카오톡 말풍선 스타일 챗봇 UI — 엔송이(nsonge.png) 아바타와 사용자 아이콘 아바타로 구성
- **기능**:
  - 사용자 정보 카드 (role 뱃지, loginId)
  - 오늘 사용량: `todayUsedCount / dailyLimit` 표시
  - `remainingCount === 0` 시 한도 도달 경고 알림 표시
- **API**: `GET /api/users/me/usage`
- **참고**: 사용자 정보(role 칩 + loginId + 오늘 사용량)는 `DefaultLayout` 앱바 우측에도 표시됨
- **상태**: ✅ 구현됨

---

### 4-3. 프롬프트 (USER / MANAGER / ADMIN)

#### `/prompt/new` — 프롬프트 생성
- **레이아웃**: DefaultLayout
- **접근 권한**: 전 역할 (로그인 필수)
- **탭 구조**: 상품 사진 프롬프트 / 인물 사진 프롬프트 두 탭으로 구성
- **상태**: ✅ 구현됨

##### TAB 1: 상품 사진 프롬프트
- **기능**:
  1. **카테고리 선택** (3단계 드릴다운)
     - 대분류(LCS) 목록 표시 → 선택
     - 중분류(MCS) 목록 표시 → 선택
     - 소분류(SCS) 목록 표시 → **최종 선택** (필수)
  2. **태그 선택** (태그 그룹별 칩 UI)
     - 태그 그룹 목록 조회 → 그룹별로 태그 칩 렌더링
     - `is_multi_select = false`: 단일 선택 (라디오 동작)
     - `is_multi_select = true`: 복수 선택 (체크박스 동작)
  3. **이미지 비율 선택** (`imageAspectRatio`)
     - 이미지 사이즈 태그 그룹은 `tagIds`에서 분리하여 `imageAspectRatio` 필드로 별도 전송
     - 선택한 비율이 이미지 미리보기에 적용됨
  4. **프롬프트 생성** 버튼 — 스타일 2종
     - `NanoBanana` 스타일 버튼 (`NANO_BANANA`)
     - `MidJourney` 스타일 버튼 (`MID_JOURNEY`)
     - 카테고리 미선택 시 버튼 비활성화
     - 한 버튼 생성 중 나머지 버튼 비활성화
  5. **결과 표시**
     - 생성된 영문 프롬프트 텍스트 박스 (스타일 뱃지 표시)
     - 클립보드 복사 버튼
     - 재생성 버튼 (마지막 사용 스타일로 재호출)
     - **초기화 버튼** — 카테고리·태그·결과 전체 상태 리셋
  6. **이미지 생성** (NanoBanana)
     - **참조 이미지 첨부** (선택 사항) — 허용 형식: `jpg, jpeg, png, webp` / 최대 15MB
       - 클라이언트 검증: MIME 타입 + 확장자 + 파일 크기 (검증 실패 시 즉시 에러 메시지 표시)
       - 서버 검증: MIME 타입 (백엔드에서 추가 방어)
     - 이미지 생성 버튼 — `goodsPromptHistoryId` 저장 후 이미지 생성 API 호출
     - 결과: 이미지 **3장 그리드** 표시 + 각 이미지 **다운로드 버튼**
- **API**:
  - `GET /api/categories?parentId=` (단계별 반복 호출)
  - `GET /api/tag-groups`
  - `GET /api/tags?tagGroupId=`
  - `POST /api/prompts/goods` → 요청: `{ goodsCategoryId, tagIds[], imageAspectRatio, promptStyle }` / 응답: `{ id, promptText }`
  - `POST /api/prompts/goods/generate-image` → 이미지 생성 (타임아웃 2분, multipart/form-data)
    - 요청: `{ historyId, promptText, imageAspectRatio, referenceImage? }`
    - 응답: `{ imageUrls[] }`
- **참고**: USER는 일일 생성 한도 초과 시 에러 메시지 표시 (에러코드 `P001`)

##### TAB 2: 인물 사진 프롬프트
- **기능**:
  1. **단계별 속성 선택** (백엔드에서 단계 구조 동적 로드)
     - 각 단계(Step)는 여러 속성(Attr)을 포함
     - 속성별 `multiSelect` 여부에 따라 단일/복수 선택 칩 UI
     - `required` 속성은 필수 뱃지 표시
  2. **이미지 비율 선택** (`imageAspectRatio`)
     - 상품 탭과 동일하게 이미지 사이즈 선택 UI 제공
     - `imageAspectRatio` 필드로 별도 전송
  3. **추가 옵션** (선택 사항)
     - 생성 목적 (예: SNS 광고용, 커머스 상세페이지)
     - 추가 지시 사항 (Gemini에게 직접 전달할 자유 텍스트)
  4. **프롬프트 생성** 버튼 — 스타일 2종
     - `NanoBanana` 스타일 (`NANO_BANANA`)
     - `MidJourney` 스타일 (`MID_JOURNEY`)
     - **필수 항목 미선택 시 에러 메시지 표시 후 중단** (`required = true` Attr 검증)
  5. **결과 표시**
     - 생성된 영문 프롬프트 텍스트 박스 (스타일 뱃지 표시)
     - 클립보드 복사 버튼
     - 재생성 버튼
     - **초기화 버튼** — 선택 옵션·결과 전체 상태 리셋
  6. **이미지 생성** (NanoBanana)
     - 이미지 생성 버튼 — NanoBanana API로 직접 이미지 생성
     - 결과: 이미지 **3장 그리드** 표시 + 각 이미지 **다운로드 버튼**
- **API**:
  - `GET /api/human-prompts/steps` → 단계/속성/옵션 구조 조회
    - 응답: `[{ id, stepNumber, name, attrs: [{ id, name, multiSelect, required, options: [{ id, name }] }] }]`
  - `POST /api/human-prompts` → 프롬프트 생성
    - 요청: `{ selections: { attrId: [optionId] }, purpose, additionalNotes, imageAspectRatio, promptStyle }`
    - 응답: `{ id, promptText }`
  - `POST /api/human-prompts/generate-image` → 이미지 생성 (타임아웃 2분)
    - 요청: `{ historyId, promptText }`
    - 응답: `{ imageUrls[] }`

---

#### `/prompt/history` — 프롬프트 이력
- **레이아웃**: DefaultLayout
- **접근 권한**: 전 역할 (로그인 필수)
- **기능**:
  - **검색 필터 영역** (화면 상단 — 모든 필터 선택 사항)
    - 생성자(`loginId`) 텍스트 입력 — Enter 키 검색 지원
    - 종류 드롭다운 — 전체 / 상품(`PRODUCT`) / 인물(`PERSON`)
    - 스타일 드롭다운 — 전체 / NanoBanana(`NANO_BANANA`) / MidJourney(`MID_JOURNEY`)
    - 생성일 시작(`dateFrom`) / 종료(`dateTo`) 날짜 선택 (`yyyy-MM-dd`)
    - 검색 버튼 클릭 시 `pageNum=1`로 리셋 후 재조회
    - 필터 초기화 버튼
    - 빈 필터는 파라미터 미전송 (빈 문자열 전송 금지)
    - 페이지 변경 시 현재 필터 조건 유지
  - 프롬프트 생성 이력 카드 목록 표시 (페이지당 10건)
  - 헤더에 총 건수 표시 (`총 N건`)
  - 각 항목: 생성일시, 생성자, 프롬프트 타입(상품/인물) 뱃지, 스타일 뱃지(NanoBanana/MidJourney), 프롬프트 텍스트
  - **PRODUCT** 항목: 카테고리 경로(`대분류 > 중분류 > 소분류`), 선택 태그 칩 목록, `imageAspectRatio` 칩
  - **PERSON** 항목: 선택 옵션 칩 목록, `imageAspectRatio` 칩, 생성 목적, 추가 지시 사항 (값 있을 때만)
  - 이미지 생성된 항목: **'이미지 확인(N장)'** 버튼 클릭 시 `v-expand-transition`으로 이미지 펼침
    - **'N장 생성됨'** 뱃지 표시
    - 이미지는 기본 숨김 → 버튼 클릭 시 토글
  - 클립보드 복사 버튼
  - 새로고침 버튼 (1페이지로 초기화 후 재조회)
  - 하단 페이지네이션 (`v-pagination`, 2페이지 이상일 때만 표시)
  - **USER**: 같은 팀 이력만 표시 (백엔드에서 필터링)
  - **MANAGER / ADMIN**: 전체 이력 표시
  - **ADMIN 전용**: 각 이력 카드 우측 하단에 삭제 버튼 표시
    - 삭제 버튼 클릭 → 확인 다이얼로그 표시 ("이력을 삭제하시겠습니까? 연결된 이미지 파일도 함께 삭제됩니다.")
    - 확인 시 → `DELETE /api/prompts/{id}` 호출 → 현재 페이지 재조회 (total/pages 동기화)
      - 삭제 후 현재 페이지에 항목이 없으면 이전 페이지로 이동
    - 실패 시 → 상단 에러 알림 표시
    - 삭제된 이력 및 연결 이미지 파일 복구 불가
- **API**: `GET /api/prompts`, `DELETE /api/prompts/{id}` (ADMIN 전용)
  - 쿼리 파라미터:

    | 파라미터 | 타입 | 필수 | 설명 |
    |---|---|---|---|
    | `pageNum` | integer | - | 페이지 번호 (기본값 1) |
    | `pageSize` | integer | - | 페이지 크기 (기본값 10, 최대 1000) |
    | `loginId` | string | - | 생성자 필터 (선택) |
    | `promptType` | string | - | 종류 필터: `PRODUCT` \| `PERSON` (선택) |
    | `promptStyle` | string | - | 스타일 필터: `NANO_BANANA` \| `MID_JOURNEY` (선택) |
    | `dateFrom` | string | - | 생성일 시작 포함: `yyyy-MM-dd` (선택) |
    | `dateTo` | string | - | 생성일 종료 포함: `yyyy-MM-dd` (선택) |

  - 응답 `data` 구조 (페이징 객체):

    | 필드 | 타입 | 설명 |
    |---|---|---|
    | `pageNum` | integer | 현재 페이지 번호 |
    | `pageSize` | integer | 페이지 크기 |
    | `total` | long | 전체 레코드 수 |
    | `pages` | integer | 전체 페이지 수 |
    | `items` | array | 이력 목록 |
    | `hasPreviousPage` | boolean | 이전 페이지 존재 여부 |
    | `hasNextPage` | boolean | 다음 페이지 존재 여부 |

  - `items` 배열 항목 공통 필드: `id`, `userId`, `promptType` (`PRODUCT`/`PERSON`), `promptStyle`, `promptText`, `imageUrls[]`, `imageAspectRatio`, `initRegiPic`, `initRegiDttm`, `finalRvisDttm`
  - `PRODUCT` 전용: `categoryId`, `categoryPath`, `tagIds[]`, `tagNames[]`
  - `PERSON` 전용: `purpose`, `additionalNotes`, `optionNames[]`
- **상태**: ✅ 구현됨

---

### 4-4. 관리 (MANAGER / ADMIN)

#### `/manage/categories` — 카테고리 관리
- **레이아웃**: DefaultLayout
- **접근 권한**: `MANAGER`, `ADMIN`
- **기능**:
  - 카테고리 트리 구조 표시 (3단계 계층)
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
  - 사용자 목록 (ID, 로그인 ID, 이름, 권한, 팀, 일일 한도, **금일 사용량**, 등록일)
  - 금일 사용량: `todayUsedCount / dailyLimit` 표시, `remainingCount === 0` 시 빨간 강조
  - 검색 필터 (이름, 팀명, 역할)
    - 팀명 검색: **부분일치(클라이언트 사이드 `includes()`)** — 백엔드 API 변경 없이 프론트에서 필터링
    - 이름 검색: 백엔드 API 파라미터 전달
  - 사용자 추가 (ADMIN만 생성 가능 — Closed 방식, 기본 일일 한도: **3건**)
  - 사용자 수정 (이름, 역할, 팀명, 일일 한도, 비밀번호)
  - 사용자 삭제
  - 목록 조회 실패 시 에러 피드백 표시
- **API**:
  - `GET /api/users?name=&teamName=&role=` — 회원 목록
  - `GET /api/users/usage` — 전체 회원 사용량 (병렬 호출, `userId` 기준 매핑)
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
