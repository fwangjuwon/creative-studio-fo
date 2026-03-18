# 작업 계획 — 상품 카테고리 4단계 → 3단계 변경

> 작성일: 2026-03-18
> 참고 문서: `temp/frontend.md`

---

## 변경 범위 요약

| 파일 | 수정 여부 | 주요 변경 내용 |
|---|---|---|
| `src/views/prompt/PromptNewView.vue` | **수정 필요** | DCS 관련 ref·watch·UI 제거, SCS를 최종 선택 단계로 변경 |
| `src/views/manage/CategoryView.vue` | **수정 필요** | CATEGORY_TYPES에서 DCS 제거, panels 배열 3개로 축소 |
| `src/views/prompt/PromptHistoryView.vue` | 수정 불필요 | `categoryPath`는 백엔드 반환 문자열 그대로 출력 중 |
| `docs/pages.md` | **수정 필요** | 4단계 → 3단계로 설명 업데이트, DCS 언급 제거 |
| `docs/todo.md` | **수정 필요** | Step 3/5 항목 내 DCS 언급 수정, 이번 변경 이력 추가 |
| `CLAUDE.md` | **수정 필요** | 카테고리 계층·흐름 설명 3단계로 수정 |
| `GEMINI.md` | **수정 필요** | 동일 내용 3단계로 수정 |
| `.cursor/rules/project-context.mdc` | **수정 필요** | 카테고리 계층 설명 3단계로 수정 |

---

## Task 1 — `PromptNewView.vue` 수정

### 1-1. 상태 변수 제거

DCS 관련 ref 3개 모두 제거한다. `loadingDcs`가 존재할 경우 함께 제거.

```diff
- const dcsItems = ref([])
- const selectedDcs = ref(null)
- const loadingDcs = ref(false)   // 존재 시 제거
```

`lcsItems / mcsItems / scsItems`, `selectedLcs / selectedMcs / selectedScs` 는 유지.

### 1-2. SCS watch 완전 제거

기존 SCS watch의 유일한 목적이 DCS 목록 API 호출이었으므로, watch 블록 자체를 완전히 제거한다.
빈 watch로 남기지 않는다.

```diff
- watch(selectedScs, async (val) => {
-   selectedDcs.value = null
-   dcsItems.value = []
-   if (!val) return
-   loadingDcs.value = true
-   try {
-     dcsItems.value = await fetchCategories(val)
-   } finally {
-     loadingDcs.value = false
-   }
- })
```

### 1-3. 상위 watch에서 DCS 초기화 코드 제거

LCS·MCS 변경 시 하위를 초기화하는 코드에서 DCS 관련 항목만 제거한다.

```diff
watch(selectedLcs, async (val) => {
  selectedMcs.value = null
  selectedScs.value = null
- selectedDcs.value = null
  mcsItems.value = []
  scsItems.value = []
- dcsItems.value = []
  ...
})

watch(selectedMcs, async (val) => {
  selectedScs.value = null
- selectedDcs.value = null
  scsItems.value = []
- dcsItems.value = []
  ...
})
```

### 1-4. `canGenerate` computed 수정

```diff
- const canGenerate = computed(() => !!selectedDcs.value)
+ const canGenerate = computed(() => !!selectedScs.value)
```

### 1-5. 프롬프트 생성 API 호출 수정

```diff
  await api.post('/prompts/goods', {
-   goodsCategoryId: selectedDcs.value,
+   goodsCategoryId: selectedScs.value,
    tagIds: allSelectedTagIds.value,
    promptStyle,
    ...
  })
```

### 1-6. 템플릿 — 세분류 `v-select` 제거

```diff
  <v-select v-model="selectedLcs" ... label="대분류" />
  <v-select v-model="selectedMcs" ... label="중분류" />
  <v-select v-model="selectedScs" ... label="소분류" />
- <v-select v-model="selectedDcs" ... label="세분류" />
```

---

## Task 2 — `CategoryView.vue` 수정

### 2-1. `CATEGORY_TYPES` 상수에서 DCS 제거

```diff
- const CATEGORY_TYPES = ['LCS', 'MCS', 'SCS', 'DCS']
+ const CATEGORY_TYPES = ['LCS', 'MCS', 'SCS']
```

### 2-2. `panels` 배열에서 DCS 패널 제거

```diff
  const panels = ref([
    { label: '대분류 (LCS)', level: 1, parentId: null, items: [], loading: false, selectedId: null },
    { label: '중분류 (MCS)', level: 2, parentId: null, items: [], loading: false, selectedId: null },
    { label: '소분류 (SCS)', level: 3, parentId: null, items: [], loading: false, selectedId: null },
-   { label: '세분류 (DCS)', level: 4, parentId: null, items: [], loading: false, selectedId: null },
  ])
```

### 2-3. `onCategorySelect` — 하위 패널 로드 조건 수정

SCS(index=2) 선택 시 더 이상 하위 패널을 로드하지 않도록 조건 변경.

```diff
- if (panelIndex < 3) {
+ if (panelIndex < 2) {
    panels.value[panelIndex + 1].parentId = item.id
    fetchCategories(panelIndex + 1)
  }
```

### 2-4. `clearPanelsFrom` — 반복 범위 수정

```diff
  function clearPanelsFrom(fromIndex) {
-   for (let i = fromIndex; i < 4; i++) {
+   for (let i = fromIndex; i < 3; i++) {
      panels.value[i].selectedId = null
      panels.value[i].parentId = null
      panels.value[i].items = []
    }
  }
```

### 2-5. 템플릿 — DCS 패널 컬럼 제거

`v-for="(panel, index) in panels"` 방식이면 데이터만 수정하면 자동 반영.
고정 인덱스로 렌더링하는 경우 세분류(DCS) 컬럼 블록을 직접 제거.

---

## Task 3 — `PromptHistoryView.vue` 확인 (수정 불필요)

`item.categoryPath`를 백엔드 반환 문자열 그대로 출력 중이므로 별도 수정 없음.
백엔드가 3단계 경로(`"식품 > 건강식품 > 인삼"`)를 반환하면 UI에 자동 반영됨.

---

## Task 4 — 문서 업데이트

코드 수정 후 아래 문서들을 3단계 기준으로 일괄 업데이트한다.

### 4-1. `docs/pages.md`

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| TAB 1 카테고리 선택 항목 | 세분류(DCS) 목록 → 최종 선택 행 존재 | DCS 행 제거, SCS를 최종 선택으로 변경 |
| PRODUCT 이력 설명 | `대분류 > 중분류 > 소분류 > 세분류` | `대분류 > 중분류 > 소분류` |
| 카테고리 관리 기능 설명 | "4단계 계층" | "3단계 계층" |

### 4-2. `docs/todo.md`

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| 결정 사항 항목 | "가로 4단계 셀렉트박스 (`v-select` 4개)" | "가로 3단계 셀렉트박스 (`v-select` 3개)" |
| Step 5 드릴다운 항목 | `MCS → SCS → DCS`, `DCS 최종 선택값 상태 관리` | `MCS → SCS`, `SCS 최종 선택값 상태 관리` |
| BO 리팩터링 반영 항목 | `goodsCategoryId: selectedDcs.value` | `goodsCategoryId: selectedScs.value` |
| 이번 변경 이력 | — | feat/category-depth-3 반영 항목 추가 |

### 4-3. `CLAUDE.md`

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| 카테고리 개념 설명 | `4단계 계층: LCS > MCS > SCS > DCS` | `3단계 계층: LCS > MCS > SCS` |
| 카테고리 개념 설명 | "사용자는 **DCS를 최종 선택**해야 프롬프트 생성 가능" | "사용자는 **SCS를 최종 선택**해야 프롬프트 생성 가능" |
| 프롬프트 생성 흐름 | `카테고리 드릴다운(DCS 선택)` | `카테고리 드릴다운(SCS 선택)` |

### 4-4. `GEMINI.md`

`CLAUDE.md`와 동일한 항목 수정 (두 파일은 동일 내용 유지).

### 4-5. `.cursor/rules/project-context.mdc`

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| 카테고리 계층 설명 | `4단계 계층: LCS(대분류) > MCS(중분류) > SCS(소분류) > DCS(세분류)` | `3단계 계층: LCS(대분류) > MCS(중분류) > SCS(소분류)` |
| 최종 선택 단계 | "사용자는 **DCS를 최종 선택**해야 프롬프트 생성 가능" | "사용자는 **SCS를 최종 선택**해야 프롬프트 생성 가능" |

---

## 체크리스트

### 코드 수정

- [ ] `PromptNewView.vue` — `dcsItems`, `selectedDcs`, `loadingDcs` ref 제거
- [ ] `PromptNewView.vue` — SCS watch 블록 완전 제거
- [ ] `PromptNewView.vue` — LCS·MCS watch에서 DCS 초기화 코드 제거
- [ ] `PromptNewView.vue` — `canGenerate` 조건 `selectedScs`로 변경
- [ ] `PromptNewView.vue` — `goodsCategoryId`에 `selectedScs.value` 전달
- [ ] `PromptNewView.vue` — 세분류 `v-select` 제거
- [ ] `CategoryView.vue` — `CATEGORY_TYPES`에서 `'DCS'` 제거
- [ ] `CategoryView.vue` — `panels` 배열 3개로 축소
- [ ] `CategoryView.vue` — `onCategorySelect` 조건 `panelIndex < 2`로 수정
- [ ] `CategoryView.vue` — `clearPanelsFrom` 반복 범위 3으로 수정
- [ ] `PromptHistoryView.vue` — `categoryPath` 정상 표시 확인 (수정 없음)

### 문서 업데이트

- [ ] `docs/pages.md` — 4단계 → 3단계, DCS 언급 제거, categoryPath 예시 수정
- [ ] `docs/todo.md` — DCS 언급 수정, 이번 변경 이력 추가
- [ ] `CLAUDE.md` — 카테고리 계층·프롬프트 흐름 설명 3단계로 수정
- [ ] `GEMINI.md` — 동일 내용 3단계로 수정
- [ ] `.cursor/rules/project-context.mdc` — 카테고리 계층 설명 3단계로 수정
