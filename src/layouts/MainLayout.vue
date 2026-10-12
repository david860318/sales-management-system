<!-- src/layouts/MainLayout.vue -->
<template>
  <el-container class="layout-container">
    <!-- 左側側邊欄 -->
    <el-aside width="220px" class="aside">
      <div class="logo-area">
        <h2>💼 業績管理系統</h2>
      </div>
      
      <!-- 選單 -->
      <el-menu
        :default-active="route.path"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <span>數據儀表板</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><List /></el-icon>
          <span>業績紀錄總表</span>
        </el-menu-item>
        <el-menu-item index="/targets">
          <el-icon><Setting /></el-icon>
          <span>目標業績設定</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右側主要內容區 -->
    <el-container>
      <!-- 上方標題列 -->
      <el-header class="header">
        <div class="header-left">
          <h3>{{ pageTitle }}</h3>
        </div>
        <div class="header-right">
          <el-avatar size="small" style="background-color: #409eff">業務</el-avatar>
          <span style="margin-left: 10px;">王大明 (Sales)</span>
        </div>
      </el-header>

      <!-- 動態內容區 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// 確保圖示有引入
import { DataLine, List, Setting } from '@element-plus/icons-vue' 

const route = useRoute()

// 根據當前路由路徑動態切換 Header 標題
const pageTitle = computed(() => {
  if (route.path === '/') return '數據儀表板 (Dashboard)'
  if (route.path === '/records') return '業績紀錄總表 (Sales Records)'
  if (route.path === '/targets') return '目標業績設定 (Targets)'
  return '業務業績管理系統'
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside {
  background-color: #a2cbf6;
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 16px rgba(140, 187, 241, 0.2);
  z-index: 10;
}
.logo-area {
  height: 70px;
  line-height: 70px;
  text-align: center;
  background-color: #8cbbf1;
  border-bottom: 2px dashed #b9daf9;
}
.logo-area h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
  font-weight: 900;
  letter-spacing: 1px;
}
.menu {
  border-right: none;
  flex: 1;
  padding-top: 10px;
}
:deep(.el-menu) {
  background-color: transparent;
}
:deep(.el-menu-item) {
  color: #eff6ff;
  font-weight: bold;
  border-radius: 20px;
  margin: 8px 15px;
  height: 45px;
  line-height: 45px;
}
:deep(.el-menu-item:hover), :deep(.el-menu-item.is-active) {
  background-color: #ffffff;
  color: #8cbbf1;
  box-shadow: 0 4px 12px rgba(140, 187, 241, 0.3);
}
.header {
  background-color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  box-shadow: 0 4px 20px rgba(140, 187, 241, 0.15);
  margin: 15px 20px 0 20px;
  border-radius: 24px; /* 標題列圓角化 */
}
.header-left h3 {
  margin: 0;
  color: #6b89a8;
  font-weight: 800;
}
.header-right {
  display: flex;
  align-items: center;
  color: #6b89a8;
  font-weight: bold;
}
.main-content {
  padding: 20px;
}
</style>