<!-- src/App.vue -->
<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from './stores/salesStore'

const salesStore = useSalesStore()
const router = useRouter()

onMounted(async () => {
  // 1. 優先處理 Google OAuth 跳轉回來的 Token 驗證
  if (window.location.hash.includes('access_token')) {
    const success = await salesStore.handleGoogleCallback()
    if (success) {
      router.push('/') // 驗證成功直接進入系統主畫面，不需要點第二次！
      return
    }
  }

  // 2. 一般頁面重整檢查
  if (salesStore.currentUser.isLoggedIn) {
    await salesStore.fetchAppData()
  }
})
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f8fbff;
  color: #5c738b;
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #f0f7ff; }
::-webkit-scrollbar-thumb { background: #b9daf9; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #8cbbf1; }
</style>