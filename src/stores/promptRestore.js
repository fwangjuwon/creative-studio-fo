import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 프롬프트 히스토리 → 생성 화면 폼 복원용 1회성 전달 store.
 *
 * 히스토리 화면에서 "이 설정으로 다시 만들기" 시 선택 항목(PromptHistoryRespDto)을
 * set()으로 담고, 생성 화면(PromptNewView)이 onActivated 시점에 consume()으로
 * 읽고 즉시 비운다. route query만으로는 담기 어려운 객체를 넘기기 위한 용도.
 */
export const usePromptRestoreStore = defineStore('promptRestore', () => {
  const payload = ref(null)

  function set(item) {
    payload.value = item
  }

  // 읽고 비우기 (1회성 소비)
  function consume() {
    const item = payload.value
    payload.value = null
    return item
  }

  return { payload, set, consume }
})
