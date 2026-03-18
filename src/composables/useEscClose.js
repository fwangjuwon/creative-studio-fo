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
