<!-- src/App.vue -->
<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSalesStore } from './stores/salesStore'

const salesStore = useSalesStore()

onMounted(async () => {
  // 檢查是否為 Google 授權跳轉回來
  await salesStore.handleGoogleCallback()

  if (salesStore.currentUser.isLoggedIn) {
    await salesStore.fetchAppData()
  }
})
</script>