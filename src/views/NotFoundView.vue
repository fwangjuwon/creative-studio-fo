<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const imgLoading = ref(true)

const onImgLoad = () => {
  imgLoading.value = false
}

const onImgError = () => {
  imgLoading.value = false
}
</script>

<template>
  <div class="not-found-container">
    <div class="img-wrapper">
      <v-skeleton-loader
        v-if="imgLoading"
        type="image"
        width="400"
        height="267"
        class="cat-skeleton"
      />
      <img
        v-show="!imgLoading"
        src="https://http.cat/images/404.jpg"
        alt="404 Not Found"
        class="cat-image"
        @load="onImgLoad"
        @error="onImgError"
      />
    </div>
    <div class="not-found-title">페이지를 찾을 수 없어요</div>
    <div class="not-found-desc">
      요청하신 페이지가 존재하지 않거나 이동되었습니다.
    </div>
    <v-btn
      color="secondary"
      variant="tonal"
      rounded="xl"
      prepend-icon="mdi-home-outline"
      class="mt-6"
      @click="router.push('/')"
    >
      홈으로 돌아가기
    </v-btn>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 32px 16px;
}

.img-wrapper {
  width: 100%;
  max-width: 400px;
  margin-bottom: 28px;
}

.cat-skeleton {
  border-radius: 16px;
  overflow: hidden;
}

.cat-image {
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(157, 109, 111, 0.2);
  display: block;
}

.not-found-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #9D6D6F;
  margin-bottom: 8px;
}

.not-found-desc {
  font-size: 0.95rem;
  color: #888;
}
</style>
