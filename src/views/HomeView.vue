<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import promyAvatar from '@/assets/nsonge.png'

const router = useRouter()
const authStore = useAuthStore()

// ── 엔송이 초기 메시지 순차 등장 ──
const showTyping1   = ref(false)
const showMsg1      = ref(false)
const showTyping2   = ref(false)
const showMsg2      = ref(false)
const showTyping3   = ref(false)
const showMsg3      = ref(false)
const showCards     = ref(false)

// ── 카드 선택 후 대화 ──
const selectedTab     = ref(null)   // 'product' | 'person'
const showUserMsg     = ref(false)  // 사용자 말풍선 (오른쪽)
const showReplyTyping = ref(false)  // 엔송이 응답 타이핑
const showReplyMsg    = ref(false)  // 엔송이 응답 말풍선

const USER_MSGS = {
  product: '상품사진 프롬프트 생성하고 싶어요! 🛍️',
  person:  '인물사진 프롬프트 생성하고 싶어요! 👤',
}
const REPLY_MSGS = {
  product: '좋아요! 상품사진 프롬프트 생성 화면으로 이동할게요 😊',
  person:  '좋아요! 인물사진 프롬프트 생성 화면으로 이동할게요 😊',
}

onMounted(() => {
  setTimeout(() => { showTyping1.value = true  },  300)
  setTimeout(() => { showTyping1.value = false; showMsg1.value = true  },  900)
  setTimeout(() => { showTyping2.value = true  }, 1300)
  setTimeout(() => { showTyping2.value = false; showMsg2.value = true  }, 1900)
  setTimeout(() => { showTyping3.value = true  }, 2300)
  setTimeout(() => { showTyping3.value = false; showMsg3.value = true  }, 3000)
  setTimeout(() => { showCards.value = true    }, 3400)
})

function onCardClick(tab) {
  if (selectedTab.value) return  // 중복 클릭 방지
  selectedTab.value = tab
  showCards.value = false

  // 사용자 말풍선
  setTimeout(() => { showUserMsg.value = true     },  100)
  // 엔송이 타이핑
  setTimeout(() => { showReplyTyping.value = true  },  700)
  // 엔송이 응답
  setTimeout(() => { showReplyTyping.value = false; showReplyMsg.value = true }, 1500)
  // 화면 이동
  setTimeout(() => { router.push({ name: 'prompt-new', query: { tab } }) }, 3000)
}
</script>

<template>
  <div class="chat-container">

    <!-- AI 아바타 + 엔송이 초기 말풍선들 -->
    <div class="d-flex align-start mt-6">
      <div class="promy-avatar-wrap mr-3">
        <img class="promy-avatar" :src="promyAvatar" alt="엔송이" />
        <div class="promy-label">엔송이</div>
      </div>

      <div class="d-flex flex-column align-start">

        <Transition name="bubble">
          <div v-if="showTyping1" class="chat-bubble typing-bubble mb-2">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </Transition>

        <Transition name="bubble">
          <div v-if="showMsg1" class="chat-bubble mb-2">
            안녕하세요! 저는 <strong>엔송이</strong>예요 👋🐣
          </div>
        </Transition>

        <Transition name="bubble">
          <div v-if="showTyping2" class="chat-bubble typing-bubble mb-2">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </Transition>

        <Transition name="bubble">
          <div v-if="showMsg2" class="chat-bubble mb-2">
            NS Creative Studio의 AI 프롬프트 도우미랍니다! 🎨
          </div>
        </Transition>

        <Transition name="bubble">
          <div v-if="showTyping3" class="chat-bubble typing-bubble mb-2">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </Transition>

        <Transition name="bubble">
          <div v-if="showMsg3" class="chat-bubble mb-2">
            <strong>{{ authStore.user?.loginId }}</strong>님, 오늘은 어떤 이미지를 만들어 볼까요? ✨
          </div>
        </Transition>

      </div>
    </div>

    <!-- 카드 선택 -->
    <Transition name="cards">
      <v-row v-if="showCards" class="mt-4 mb-2">
        <v-col cols="12" sm="6">
          <v-card class="prompt-card" rounded="xl" elevation="2" @click="onCardClick('product')">
            <v-card-text class="pa-10 text-center">
              <v-icon size="60" color="secondary" class="mb-5">mdi-shopping-outline</v-icon>
              <div class="text-h6 font-weight-bold mb-2">상품 사진 프롬프트</div>
              <div class="text-body-2 text-medium-emphasis">
                카테고리 + 태그 선택으로<br>상품 이미지 AI 프롬프트 생성
              </div>
            </v-card-text>
            <v-card-actions class="justify-center pb-6">
              <v-chip color="secondary" variant="tonal" size="small" prepend-icon="mdi-arrow-right">
                시작하기
              </v-chip>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card class="prompt-card" rounded="xl" elevation="2" @click="onCardClick('person')">
            <v-card-text class="pa-10 text-center">
              <v-icon size="60" color="secondary" class="mb-5">mdi-account-outline</v-icon>
              <div class="text-h6 font-weight-bold mb-2">인물 사진 프롬프트</div>
              <div class="text-body-2 text-medium-emphasis">
                5단계 세부 선택으로<br>인물 이미지 AI 프롬프트 생성
              </div>
            </v-card-text>
            <v-card-actions class="justify-center pb-6">
              <v-chip color="secondary" variant="tonal" size="small" prepend-icon="mdi-arrow-right">
                시작하기
              </v-chip>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </Transition>

    <!-- 사용자 말풍선 (오른쪽) -->
    <Transition name="bubble">
      <div v-if="showUserMsg" class="d-flex justify-end align-start mt-3 mb-2">
        <div class="user-bubble">
          {{ USER_MSGS[selectedTab] }}
        </div>
        <div class="user-avatar-wrap ml-3">
          <div class="user-avatar">
            <v-icon size="28" color="#9D6D6F">mdi-emoticon-happy-outline</v-icon>
          </div>
          <div class="user-label">{{ authStore.user?.loginId }}</div>
        </div>
      </div>
    </Transition>

    <!-- 엔송이 응답 -->
    <div v-if="showReplyTyping || showReplyMsg" class="d-flex align-start mt-1">
      <div class="promy-avatar-wrap mr-3">
        <img class="promy-avatar" :src="promyAvatar" alt="엔송이" />
        <div class="promy-label">엔송이</div>
      </div>

      <div class="d-flex flex-column align-start">
        <Transition name="bubble">
          <div v-if="showReplyTyping" class="chat-bubble typing-bubble">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </Transition>
        <Transition name="bubble">
          <div v-if="showReplyMsg" class="chat-bubble">
            {{ REPLY_MSGS[selectedTab] }}
          </div>
        </Transition>
      </div>
    </div>

  </div>
</template>

<style scoped>
.chat-container {
  max-width: 720px;
}

/* 엔송이 아바타 */
.promy-avatar-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.promy-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 14px rgba(157, 109, 111, 0.4);
}

.promy-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #F0C3C1, #9D6D6F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 엔송이 말풍선 (왼쪽) */
.chat-bubble {
  display: inline-block;
  background: #f0f0f0;
  border-radius: 0 16px 16px 16px;
  padding: 12px 18px;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 420px;
}

/* 타이핑 인디케이터 */
.typing-bubble {
  padding: 14px 18px;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background: #aaa;
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40%           { transform: translateY(-6px); }
}

/* 사용자 아바타 */
.user-avatar-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FDE8E7 0%, #F0C3C1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(240, 195, 193, 0.5);
}

.user-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #9D6D6F;
}

/* 사용자 말풍선 (오른쪽) */
.user-bubble {
  display: inline-block;
  background: linear-gradient(135deg, #FDE8E7 0%, #F0C3C1 100%);
  color: #7A4A50;
  border-radius: 16px 0 16px 16px;
  padding: 12px 18px;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 420px;
  font-weight: 500;
}

/* 말풍선 등장 트랜지션 */
.bubble-enter-active {
  transition: all 0.35s ease;
}
.bubble-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* 카드 등장 트랜지션 */
.cards-enter-active {
  transition: all 0.45s ease;
}
.cards-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

/* 카드 hover */
.prompt-card {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.prompt-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(157, 109, 111, 0.25) !important;
}
</style>
