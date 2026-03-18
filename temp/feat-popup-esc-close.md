# feat: ESC 키로 팝업(다이얼로그) 닫기

## 현황 분석

### 다이얼로그가 있는 파일 (총 4개 View, 21개 다이얼로그)

| View | 다이얼로그 | 개수 |
|---|---|---|
| `CategoryView.vue` | addDialog, editDialog, deleteDialog | 3 |
| `TagView.vue` | addGroupDialog, editGroupDialog, deleteGroupDialog, addTagDialog, editTagDialog, deleteTagDialog | 6 |
| `UserView.vue` | createDialog, editDialog, deleteDialog | 3 |
| `HumanPromptStructureView.vue` | addStepDialog, editStepDialog, deleteStepDialog, addAttrDialog, editAttrDialog, deleteAttrDialog, addOptionDialog, editOptionDialog, deleteOptionDialog | 9 |

### 현재 문제 원인

모든 `v-dialog`에 `persistent` prop이 적용되어 있음.

```html
<v-dialog v-model="addStepDialog" max-width="400" persistent>
```

Vuetify `v-dialog`의 `persistent` prop은 **ESC 키 및 외부 클릭으로 닫히는 것을 모두 차단**함.
따라서 현재는 X 버튼이나 취소 버튼 클릭만 가능.

### 닫기 방식 패턴

닫기 전용 함수 없이, 취소 버튼에서 직접 dialog ref를 false로 변경함.
```html
<v-btn @click="addDialog = false">취소</v-btn>
```

---

## 구현 전략

### 왜 `persistent` 제거만으로는 안 되나?

`persistent`를 제거하면 ESC + **외부 클릭(backdrop click)** 모두 다이얼로그를 닫아버림.
폼 작성 중 실수로 외부를 클릭해도 닫혀버리는 UX 문제가 생김.

### 채택 방식: `useEscClose` Composable

- `persistent`는 **그대로 유지** (외부 클릭 차단 유지)
- `keydown` 이벤트로 ESC만 별도 감지하여 열려 있는 다이얼로그를 닫음
- Composable로 추출하여 4개 View에서 재사용

---

## 구현 계획

### Step 1: Composable 생성

**`src/composables/useEscClose.js`** 신규 생성

> `src/composables/` 는 현재 프로젝트에 없는 신규 디렉토리.
> 코딩 컨벤션 SFC 작성 순서 섹션 2("store / **composable**")에 composable 사용이 명시되어 있으므로
> 디렉토리 추가는 컨벤션에 부합함. 파일명은 Vue 표준(use prefix + camelCase)을 따름.

```js
import { onMounted, onUnmounted } from 'vue'

/**
 * ESC 키를 누르면 열려 있는 다이얼로그를 닫는 Composable.
 * 인자로 전달된 dialog ref 중 열려 있는 첫 번째를 닫음.
 * @param {...import('vue').Ref<boolean>} dialogRefs
 */
export function useEscClose(...dialogRefs) {
  function onKeydown(e) {
    if (e.key !== 'Escape') return
    for (const ref of dialogRefs) {
      if (ref.value) {
        ref.value = false
        break
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
```

동시에 두 다이얼로그가 열리는 케이스는 없으므로, 첫 번째로 열린 것을 닫는 단순 로직으로 충분.

---

### Step 2: 각 View에 Composable 적용

#### SFC 작성 순서 및 배치 위치

코딩 컨벤션의 SFC 작성 순서:

```
// 1. import
// 2. store / composable
// 4. reactive state   ← dialog ref는 여기에 선언됨
```

`useEscClose(...dialogRefs)` 호출은 인자로 받는 **dialog ref들이 선언된 이후**에만 실행 가능하다.
따라서 이 composable 호출은 **section 4 (reactive state) 마지막 dialog ref 선언 직후**에 위치시킨다.
(section 2에 배치 불가 — refs 미선언 상태이므로 인자 전달 불가)

```js
// 1. import
import { ref, onMounted } from 'vue'
import api from '@/api'
import { useEscClose } from '@/composables/useEscClose'

// 4. reactive state
const addDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
// ↑ 마지막 dialog ref 선언 직후에 호출
useEscClose(addDialog, editDialog, deleteDialog)
```

#### CategoryView.vue

```js
import { useEscClose } from '@/composables/useEscClose'

// deleteDialog 선언 직후
useEscClose(addDialog, editDialog, deleteDialog)
```

#### TagView.vue

```js
import { useEscClose } from '@/composables/useEscClose'

// deleteTagDialog 선언 직후
useEscClose(addGroupDialog, editGroupDialog, deleteGroupDialog, addTagDialog, editTagDialog, deleteTagDialog)
```

#### UserView.vue

```js
import { useEscClose } from '@/composables/useEscClose'

// deleteDialog 선언 직후
useEscClose(createDialog, editDialog, deleteDialog)
```

#### HumanPromptStructureView.vue

```js
import { useEscClose } from '@/composables/useEscClose'

// deleteOptionDialog 선언 직후
useEscClose(
  addStepDialog, editStepDialog, deleteStepDialog,
  addAttrDialog, editAttrDialog, deleteAttrDialog,
  addOptionDialog, editOptionDialog, deleteOptionDialog
)
```

---

### Step 3: 문서 업데이트

`src/composables/` 는 신규 디렉토리이므로, 구현 후 아래 4개 문서를 동시에 업데이트한다.

#### `.cursor/rules/coding-convention.mdc`

① 디렉토리 구조에 `composables/` 추가

```
src/
├── api/
├── assets/
├── components/
├── composables/   # Vue Composable 함수
├── layouts/
├── plugins/
├── router/
├── stores/
└── views/
```

② 파일 네이밍 테이블에 Composable 행 추가

| 대상 | 규칙 | 예시 |
|---|---|---|
| Composable | camelCase 파일명, `use` prefix 함수명 | `useEscClose.js` → `useEscClose` |

---

#### `CLAUDE.md` / `GEMINI.md` (동일 구조이므로 두 파일 동시 수정)

① 소스 구조 섹션에 `composables/` 추가

```
src/
├── api/
│   └── index.js
├── assets/
├── components/
├── composables/
│   └── useEscClose.js   # ESC 키 다이얼로그 닫기
├── layouts/
...
```

② 파일 네이밍 테이블에 Composable 행 추가

| 대상 | 규칙 | 예시 |
|---|---|---|
| Composable | camelCase + `use` prefix | `useEscClose` |

---

#### `docs/todo.md`

현재 "✅ 전체 완료 (Step 9)" 이후에 새 항목 추가

```markdown
## Phase 3. UX 개선

### feat: ESC 키로 다이얼로그 닫기

- [ ] `src/composables/useEscClose.js` 생성
- [ ] `CategoryView.vue` — useEscClose 적용 (3개 다이얼로그)
- [ ] `TagView.vue` — useEscClose 적용 (6개 다이얼로그)
- [ ] `UserView.vue` — useEscClose 적용 (3개 다이얼로그)
- [ ] `HumanPromptStructureView.vue` — useEscClose 적용 (9개 다이얼로그)
- [ ] 문서 업데이트 (coding-convention, CLAUDE.md, GEMINI.md)
```

---

## 변경 범위 요약

| 작업 | 파일 | 변경 내용 |
|---|---|---|
| 신규 생성 | `src/composables/useEscClose.js` | Composable 구현 (신규 디렉토리 포함) |
| 수정 | `src/views/manage/CategoryView.vue` | import 1줄 + useEscClose 호출 1줄 추가 |
| 수정 | `src/views/manage/TagView.vue` | import 1줄 + useEscClose 호출 1줄 추가 |
| 수정 | `src/views/manage/UserView.vue` | import 1줄 + useEscClose 호출 1줄 추가 |
| 수정 | `src/views/manage/HumanPromptStructureView.vue` | import 1줄 + useEscClose 호출 4줄 추가 |
| 수정 | `.cursor/rules/coding-convention.mdc` | composables/ 디렉토리 + Composable 네이밍 규칙 추가 |
| 수정 | `CLAUDE.md` | composables/ 소스 구조 + Composable 네이밍 추가 |
| 수정 | `GEMINI.md` | composables/ 소스 구조 + Composable 네이밍 추가 |
| 수정 | `docs/todo.md` | Phase 3 항목 추가 |

`v-dialog` 템플릿 코드는 **변경 없음**. `persistent` prop도 **그대로 유지**.

---

## 검증 포인트

- [ ] 각 화면에서 다이얼로그 열기 → ESC 키 → 닫히는지 확인
- [ ] 다이얼로그 열기 → 외부 클릭 → **닫히지 않는지** 확인 (persistent 유지)
- [ ] 폼 입력 중 ESC → 닫힌 후 재오픈 시 이전 입력값 초기화 여부 확인 (기존 동작 유지)
- [ ] 다이얼로그가 닫힌 상태에서 ESC → 아무 동작 없는지 확인
