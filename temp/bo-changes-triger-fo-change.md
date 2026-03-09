# FO 반영 가이드 — feat/history-detailize (BO 변경사항)

> **작성일**: 2026-03-09
> **대상**: ns-creative-studio-fo 개발자 / 코드 에이전트
> **배경**: BO(백엔드)에서 프롬프트 생성 이력 조회 상세화 작업이 완료됨.
> 히스토리 응답에 ID만 있던 카테고리/태그 정보가 이름(텍스트) 기반으로 확장됨.
> 프롬프트 스타일 선택 기능도 신규 추가됨.

---

## 공통 정보

- **베이스 URL**: `http://localhost:8080`
- **인증**: JWT Bearer Token (`Authorization: Bearer {accessToken}`)
- **모든 응답 구조**:
  ```json
  {
    "code": 200,
    "message": "OK",
    "data": { ... }
  }
  ```

---

## 1. 변경된 API — 상품 프롬프트 생성

### `POST /api/prompts/goods`

**요청 바디 변경**: `promptStyle` 필드 추가 (선택)

#### Before
```json
{
  "goodsCategoryId": 12,
  "tagIds": [3, 7]
}
```

#### After
```json
{
  "goodsCategoryId": 12,
  "tagIds": [3, 7],
  "promptStyle": "NANO_BANANA"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `goodsCategoryId` | Long | ✅ | 최종 선택한 DCS 카테고리 ID (기존 유지) |
| `tagIds` | List\<Long\> | ❌ | 선택한 태그 ID 목록, 빈 리스트 허용 (기존 유지) |
| `promptStyle` | String | ❌ | **신규** 프롬프트 스타일. 미입력 시 `NANO_BANANA` 적용 |

`promptStyle` 허용값:
- `NANO_BANANA` — 문장형 프롬프트 (NanoBanana/Gemini 최적화, 기본값)
- `MID_JOURNEY` — 키워드 나열형 프롬프트 (MidJourney 최적화)

**응답 바디 변경**: 아래 "히스토리 조회 응답" 섹션 참조 (PRODUCT 타입).

---

## 2. 변경된 API — 인물 프롬프트 생성

### `POST /api/human-prompts`

**요청 바디 변경**: `purpose`, `additionalNotes`, `promptStyle` 필드 추가 (모두 선택)

#### Before
```json
{
  "selections": {
    "1": [101],
    "2": [201, 202]
  }
}
```

#### After
```json
{
  "selections": {
    "1": [101],
    "2": [201, 202]
  },
  "purpose": "브랜드 SNS 캠페인용",
  "additionalNotes": "밝은 배경, 미소 짓는 표정 강조",
  "promptStyle": "NANO_BANANA"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `selections` | Map\<Long, List\<Long\>\> | ✅ | key: attrId, value: optionId 목록 (기존 유지) |
| `purpose` | String | ❌ | **신규** 이미지 생성 목적 (자유 텍스트) |
| `additionalNotes` | String | ❌ | **신규** 추가 지시사항 (자유 텍스트) |
| `promptStyle` | String | ❌ | **신규** 프롬프트 스타일. 미입력 시 `NANO_BANANA` 적용 |

**응답 바디 변경**: 아래 "히스토리 조회 응답" 섹션 참조 (PERSON 타입).

---

## 3. 변경된 API — 히스토리 조회

### `GET /api/prompts`

응답 `data` 배열의 각 항목(이력 1건)에 필드가 대폭 추가됨.

### 전체 응답 구조

```json
{
  "code": 200,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "userId": 5,

      // ── 공통 필드 ──────────────────────────────────
      "promptType": "PRODUCT",          // "PRODUCT" | "PERSON"
      "promptStyle": "NANO_BANANA",     // ★ 신규 | "NANO_BANANA" | "MID_JOURNEY"
      "promptText": "A professional product photo ...",
      "imageUrl": null,                 // NanoBanana 이미지 URL (없으면 null)

      // ── PRODUCT 전용 (promptType = "PRODUCT" 일 때만 값 있음) ──
      "categoryId": 12,
      "categoryPath": "식품 > 건강식품 > 약재 > 인삼",  // ★ 신규
      "tagIds": [3, 7],
      "tagNames": ["화사한", "야외"],                    // ★ 신규

      // ── PERSON 전용 (promptType = "PERSON" 일 때만 값 있음) ──
      "purpose": null,                  // ★ 신규 (PRODUCT이면 null)
      "additionalNotes": null,          // ★ 신규 (PRODUCT이면 null)
      "optionNames": null,              // ★ 신규 (PRODUCT이면 null)

      // ── 감사 컬럼 ──
      "initRegiPic": "user01",
      "initRegiDttm": "2026-03-09T21:12:46",
      "finalRvisDttm": "2026-03-09T21:12:46"
    },
    {
      "id": 2,
      "userId": 5,
      "promptType": "PERSON",
      "promptStyle": "MID_JOURNEY",
      "promptText": "young Korean woman, soft natural daylight ...",
      "imageUrl": "/images/abc123.jpg",

      // PERSON이므로 카테고리/태그 관련은 null
      "categoryId": null,
      "categoryPath": null,
      "tagIds": null,
      "tagNames": null,

      // PERSON 전용 필드 (값 있음)
      "purpose": "브랜드 SNS 캠페인용",
      "additionalNotes": "밝은 배경, 미소 짓는 표정 강조",
      "optionNames": ["여자", "20대", "스튜디오", "비즈니스 캐주얼", "밝은"]
    }
  ]
}
```

### 신규 추가 필드 정리

| 필드 | 타입 | 대상 | 설명 |
|---|---|---|---|
| `promptStyle` | String | 공통 | `NANO_BANANA` 또는 `MID_JOURNEY` |
| `categoryPath` | String | PRODUCT만 | `"대분류 > 중분류 > 소분류 > 세분류"` 형태의 전체 경로 |
| `tagNames` | List\<String\> | PRODUCT만 | 선택한 태그 한국어 이름 목록 |
| `purpose` | String | PERSON만 | 생성 목적 텍스트 (없으면 null) |
| `additionalNotes` | String | PERSON만 | 추가 지시사항 텍스트 (없으면 null) |
| `optionNames` | List\<String\> | PERSON만 | 선택한 옵션 한국어 이름 목록 (단계 순서대로) |

> ⚠️ `promptType`에 따라 null인 필드가 다름. 렌더링 전 반드시 null 체크 필요.

---

## 4. FO에서 해야 할 작업 목록

### 4-1. 상품 프롬프트 생성 화면

- [ ] `promptStyle` 선택 UI 추가 (라디오 버튼 또는 드롭다운)
  - 선택지: `NanoBanana (기본)` → `NANO_BANANA`, `MidJourney` → `MID_JOURNEY`
  - 미선택 시 요청 바디에서 생략 (서버가 기본값 `NANO_BANANA` 적용)

> **[결정]** TAB 2(인물 사진)와 동일하게 **버튼 2개 방식**으로 구현.
> `NanoBanana 프롬프트` / `MidJourney 프롬프트` 버튼을 누르면 해당 스타일로 바로 생성.
> 사유: 두 탭 간 UX 통일. TAB 2 기존 구현(`generatingPersonStyle` 패턴) 참고.

### 4-2. 인물 프롬프트 생성 화면

- [ ] `purpose` 입력 필드 추가 (textarea 또는 input, 선택)
- [ ] `additionalNotes` 입력 필드 추가 (textarea, 선택)
- [ ] `promptStyle` 선택 UI 추가 (위와 동일)

### 4-3. 히스토리 조회 화면

- [ ] 이력 카드/행에 `promptStyle` 표시 추가
  - 예: 뱃지 형태로 `NanoBanana` / `MidJourney`
- [ ] PRODUCT 이력: 기존 `categoryId` 텍스트 → `categoryPath` 텍스트로 교체
  - Before: `카테고리 ID: 12`
  - After: `카테고리: 식품 > 건강식품 > 약재 > 인삼`
- [ ] PRODUCT 이력: 기존 `tagIds` 표시 → `tagNames` 태그 목록으로 교체
  - Before: `태그 ID: [3, 7]`
  - After: `태그: 화사한, 야외`
- [ ] PERSON 이력: `optionNames` 목록 표시 추가
  - 예: `선택 옵션: 여자 / 20대 / 스튜디오 / 비즈니스 캐주얼 / 밝은`
- [ ] PERSON 이력: `purpose` 표시 추가 (값 있을 때만)
- [ ] PERSON 이력: `additionalNotes` 표시 추가 (값 있을 때만)

---

## 5. 기존 코드 영향 범위

| 항목 | 영향 | 비고 |
|---|---|---|
| 기존 `categoryId`, `tagIds` 필드 | 유지됨 | 응답에 여전히 포함. 제거하지 않음 |
| 로그인 / 인증 흐름 | 변경 없음 | |
| 카테고리·태그 조회 API | 변경 없음 | |
| 인물 프롬프트 단계 구조 조회 (`GET /api/human-prompts/steps`) | 변경 없음 | |
| 이미지 생성 API (`POST /api/human-prompts/generate-image`) | 변경 없음 | |
