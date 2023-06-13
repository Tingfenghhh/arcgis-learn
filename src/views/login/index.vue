<script lang="ts" setup>
  import WebGPU from '@/components/web-gpu/index.vue'
  import { ref } from 'vue'

  const arr = ref<TestItem[]>([
    {
      name: '11',
      age: 1
    }
  ])
</script>

<template>
  <div>
    <WebGPU />
  </div>
</template>

<style lang="less" scoped></style>
