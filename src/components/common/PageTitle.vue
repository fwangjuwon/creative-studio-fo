<template>
  <div class="mb-6">
    <h1 class="text-h4 font-weight-bold">{{ title }}</h1>
    <p v-if="subtitle" class="text-medium-emphasis mt-1">{{ subtitle }}</p>
    <v-divider class="mt-3" />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>
