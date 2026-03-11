# 인물 이미지 프롬프트 구조 관리 API 명세

> **목적**: 프론트엔드 구현용 API 명세서
> **작성일**: 2026-03-11
> **대상**: 인물 프롬프트 5단계 구조 (Step → Attr → Option) CUD 관리 화면

---

## 전제 지식 — 도메인 구조

인물 이미지 프롬프트는 5단계 계층 구조를 가진다.

```
Step (단계)           예: "A. 기본 정보"
 └── Attr (세부항목)   예: "성별" (단일선택), "분위기" (복수선택)
       └── Option (선택지)  예: { name: "남성", promptValue: "male" }
```

- **Step**: 고정 5단계(A~E). 추가/수정/삭제 가능하나 일반적으로 변경 드묾.
- **Attr**: 각 Step에 속하는 세부 설정 항목. `isMultiSelect`로 체크박스/라디오 결정.
- **Option**: 각 Attr의 선택지. `promptValue`는 Gemini API에 전달되는 영문 값.

### 기존 조회 API (참고용 — 이미 구현됨)

`GET /api/human-prompts/steps` → Step → Attr → Option 전체 트리 반환  
이 API는 프롬프트 생성 탭에서 사용 중. **이번 작업과 별개임.**

---

## 공통 사항

### 인증 / 권한

```
Authorization: Bearer {accessToken}    // 모든 API 헤더 필수
권한: MANAGER 이상 (MANAGER, ADMIN)
```

### 공통 응답 래퍼

모든 API 응답은 아래 형태로 감싸진다.

```json
{
  "code": 200,
  "message": "OK",
  "data": { ... }
}
```

- 성공 시 HTTP 상태코드는 **항상 200** (생성/수정/삭제 모두)
- 삭제 성공 시 `data: null`
- 실패 시 `code`는 4xx, `data: null`, `message`에 오류 설명

---

## 1. Step 관리 — `POST/PUT/DELETE /api/human-prompts/steps`

### 1-1. Step 생성

```
POST /api/human-prompts/steps
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**

```json
{
  "stepNumber": 6,
  "stepCode": "F",
  "name": "추가 설정"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `stepNumber` | number | ✅ | 단계 순서 번호 |
| `stepCode` | string | ✅ | 단계 코드 (A, B, C … 알파벳 권장). **생성 후 수정 불가** |
| `name` | string | ✅ | 화면에 표시되는 단계명 |

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 6,
    "stepNumber": 6,
    "stepCode": "F",
    "name": "추가 설정"
  }
}
```

---

### 1-2. Step 수정

```
PUT /api/human-prompts/steps/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**

```json
{
  "stepNumber": 6,
  "name": "수정된 단계명"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `stepNumber` | number | - | 단계 순서 번호 |
| `name` | string | - | 단계명 |

> ⚠️ `stepCode`는 수정 불가 — 요청 Body에 포함해도 무시됨

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 6,
    "stepNumber": 6,
    "stepCode": "F",
    "name": "수정된 단계명"
  }
}
```

---

### 1-3. Step 삭제

```
DELETE /api/human-prompts/steps/{id}
Authorization: Bearer {token}
```

**Response (200 — 성공)**

```json
{
  "code": 200,
  "message": "OK",
  "data": null
}
```

**Response (400 — 하위 Attr 존재 시)**

```json
{
  "code": 400,
  "message": "하위 세부항목이 존재하여 삭제할 수 없습니다.",
  "data": null
}
```

**Response (400 — 미존재)**

```json
{
  "code": 400,
  "message": "존재하지 않는 단계입니다.",
  "data": null
}
```

---

## 2. Attr 관리 — `POST/PUT/DELETE /api/human-prompts/attrs`

### 2-1. Attr 생성

```
POST /api/human-prompts/attrs
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**

```json
{
  "stepId": 1,
  "name": "헤어스타일",
  "isMultiSelect": false,
  "isRequired": true,
  "sortOrder": 5
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `stepId` | number | ✅ | 부모 Step의 id |
| `name` | string | ✅ | 세부항목명 (화면 표시) |
| `isMultiSelect` | boolean | ✅ | `true` → 복수 선택 가능 (체크박스), `false` → 단일 선택 (라디오) |
| `isRequired` | boolean | ✅ | `true` → 필수 선택 |
| `sortOrder` | number | ✅ | 화면 표시 순서 (낮을수록 위) |

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 10,
    "stepId": 1,
    "name": "헤어스타일",
    "isMultiSelect": false,
    "isRequired": true,
    "sortOrder": 5
  }
}
```

> ⚠️ **주의**: 응답 JSON의 boolean 필드명은 `isMultiSelect`, `isRequired` (is 접두사 포함)

---

### 2-2. Attr 수정

```
PUT /api/human-prompts/attrs/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "수정된 세부항목명",
  "isMultiSelect": true,
  "isRequired": false,
  "sortOrder": 3
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✅ | 세부항목명 |
| `isMultiSelect` | boolean | ✅ | 복수 선택 허용 여부 |
| `isRequired` | boolean | ✅ | 필수 선택 여부 |
| `sortOrder` | number | ✅ | 정렬 순서 |

> ⚠️ `stepId`(부모 Step) 변경 불가 — 요청 Body에 포함해도 무시됨

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 10,
    "stepId": 1,
    "name": "수정된 세부항목명",
    "isMultiSelect": true,
    "isRequired": false,
    "sortOrder": 3
  }
}
```

---

### 2-3. Attr 삭제

```
DELETE /api/human-prompts/attrs/{id}
Authorization: Bearer {token}
```

**Response (200 — 성공)**

```json
{
  "code": 200,
  "message": "OK",
  "data": null
}
```

**Response (400 — 하위 Option 존재 시)**

```json
{
  "code": 400,
  "message": "하위 선택지가 존재하여 삭제할 수 없습니다.",
  "data": null
}
```

**Response (400 — 미존재)**

```json
{
  "code": 400,
  "message": "존재하지 않는 세부항목입니다.",
  "data": null
}
```

---

## 3. Option 관리 — `POST/PUT/DELETE /api/human-prompts/options`

### 3-1. Option 생성

```
POST /api/human-prompts/options
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**

```json
{
  "attrId": 10,
  "name": "단발",
  "promptValue": "short hair, bob cut",
  "sortOrder": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `attrId` | number | ✅ | 부모 Attr의 id |
| `name` | string | ✅ | 선택지 표시명 (한국어) |
| `promptValue` | string | ✅ | Gemini API에 전달할 영문 값 |
| `sortOrder` | number | ✅ | 화면 표시 순서 |

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 100,
    "attrId": 10,
    "name": "단발",
    "promptValue": "short hair, bob cut",
    "sortOrder": 1
  }
}
```

---

### 3-2. Option 수정

```
PUT /api/human-prompts/options/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "단발 (수정)",
  "promptValue": "short hair, bob cut, neat",
  "sortOrder": 2
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✅ | 선택지 표시명 |
| `promptValue` | string | ✅ | 영문 프롬프트 값 |
| `sortOrder` | number | ✅ | 정렬 순서 |

> ⚠️ `attrId`(부모 Attr) 변경 불가

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 100,
    "attrId": 10,
    "name": "단발 (수정)",
    "promptValue": "short hair, bob cut, neat",
    "sortOrder": 2
  }
}
```

---

### 3-3. Option 삭제

```
DELETE /api/human-prompts/options/{id}
Authorization: Bearer {token}
```

**Response (200 — 성공)**

```json
{
  "code": 200,
  "message": "OK",
  "data": null
}
```

**Response (400 — 이력 참조 중)**

```json
{
  "code": 400,
  "message": "프롬프트 이력에서 사용 중인 선택지는 삭제할 수 없습니다.",
  "data": null
}
```

**Response (400 — 미존재)**

```json
{
  "code": 400,
  "message": "존재하지 않는 선택지입니다.",
  "data": null
}
```

---

## 4. 기존 조회 API — 참고 (수정 없음)

관리 화면에서 현재 구조를 불러와 렌더링할 때 사용.

```
GET /api/human-prompts/steps
Authorization: Bearer {token}    // USER 이상 권한
```

**Response (200)**

```json
{
  "code": 200,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "stepNumber": 1,
      "stepCode": "A",
      "name": "기본 정보",
      "attrs": [
        {
          "id": 1,
          "name": "성별",
          "multiSelect": false,
          "required": true,
          "sortOrder": 1,
          "options": [
            { "id": 1, "name": "남성", "promptValue": "male", "sortOrder": 1 },
            { "id": 2, "name": "여성", "promptValue": "female", "sortOrder": 2 }
          ]
        }
      ]
    }
  ]
}
```

> ⚠️ **주의**: 조회 응답의 boolean 필드명은 `multiSelect`, `required` (is 접두사 **없음**)  
> CUD 응답과 다름 — 조회 전용 DTO(`HumanPromptStepRespDto.AttrDto`)의 필드명 차이

---

## 5. 삭제 제약 정리

삭제 시 하위 데이터가 있으면 서버에서 400을 반환한다. **순서대로 하위부터 삭제**해야 한다.

```
삭제 가능 순서:
  Option 삭제 (이력 참조 없을 때)
   → Attr 삭제 (하위 Option 모두 삭제 후)
     → Step 삭제 (하위 Attr 모두 삭제 후)
```

| 삭제 대상 | 거부 조건 | 오류 메시지 |
|---|---|---|
| Step | 하위 Attr가 1개 이상 존재 | "하위 세부항목이 존재하여 삭제할 수 없습니다." |
| Attr | 하위 Option이 1개 이상 존재 | "하위 선택지가 존재하여 삭제할 수 없습니다." |
| Option | 프롬프트 생성 이력에서 참조 중 | "프롬프트 이력에서 사용 중인 선택지는 삭제할 수 없습니다." |

---

## 6. 전체 엔드포인트 요약

| Method | URL | 설명 | 권한 |
|--------|-----|------|------|
| `POST` | `/api/human-prompts/steps` | Step 생성 | MANAGER+ |
| `PUT` | `/api/human-prompts/steps/{id}` | Step 수정 | MANAGER+ |
| `DELETE` | `/api/human-prompts/steps/{id}` | Step 삭제 | MANAGER+ |
| `POST` | `/api/human-prompts/attrs` | Attr 생성 | MANAGER+ |
| `PUT` | `/api/human-prompts/attrs/{id}` | Attr 수정 | MANAGER+ |
| `DELETE` | `/api/human-prompts/attrs/{id}` | Attr 삭제 | MANAGER+ |
| `POST` | `/api/human-prompts/options` | Option 생성 | MANAGER+ |
| `PUT` | `/api/human-prompts/options/{id}` | Option 수정 | MANAGER+ |
| `DELETE` | `/api/human-prompts/options/{id}` | Option 삭제 | MANAGER+ |
| `GET` | `/api/human-prompts/steps` | 전체 구조 조회 (기존) | USER+ |

---

## 7. 구현 가이드

### 관리 화면 흐름 (권장)

```
1. GET /api/human-prompts/steps 로 현재 전체 구조 로드
2. 트리 형태로 렌더링 (Step > Attr > Option)
3. 각 노드에 수정/삭제 버튼 배치
4. 하위 노드 추가 버튼 배치 (Step → Attr 추가, Attr → Option 추가)
```

### Boolean 필드 전송 주의사항

Attr 생성/수정 시 boolean 필드를 반드시 명시적으로 전송한다.

```json
// ✅ 올바름
{ "isMultiSelect": false, "isRequired": true }

// ❌ 필드 생략 시 서버에서 400 반환 (필수 필드)
{ "name": "성별" }
```

### 에러 처리 패턴

```javascript
// 응답 code가 200이 아니면 message를 토스트/알림으로 표시
if (response.data.code !== 200) {
  showErrorToast(response.data.message);
  return;
}
```

### Swagger UI

전체 API 스펙 확인: `http://{서버주소}:8080/swagger-ui/index.html`  
태그 그룹: `HumanPromptAttr`, `HumanPromptOption` (Step CUD는 `HumanPrompt` 태그 하위)
