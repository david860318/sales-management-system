<!-- src/layouts/MainLayout.vue -->
<template>
  <el-container class="layout-container">
    <!-- ========================================== -->
    <!-- 1. 桌機版側邊欄 (寬度 > 768px 時維持原狀) -->
    <!-- ========================================== -->
    <el-aside width="220px" class="desktop-aside" v-if="!isMobile">
      <div class="sidebar-header">
        <h2 class="system-title">🚀 SPM 業績系統</h2>
        <div class="user-pill">{{ salesStore.currentUser.name || '業務專員' }}</div>
      </div>

      <el-menu :router="true" :default-active="$route.path" class="desktop-menu">
        <el-menu-item index="/">📊 業績儀表板</el-menu-item>
        <el-menu-item index="/records">📋 業績紀錄總表</el-menu-item>
        <el-menu-item index="/targets">🎯 每月目標設定</el-menu-item>
        <el-menu-item index="/profile">⚙️ 個人帳號設定</el-menu-item>
      </el-menu>

      <div class="sidebar-bottom">
        <el-button type="danger" link @click="handleLogout">🚪 登出系統</el-button>
      </div>
    </el-aside>

    <!-- ========================================== -->
    <!-- 2. 手機版左上角懸浮小圖示 (寬度 <= 768px) -->
    <!-- ========================================== -->
    <div
      v-if="isMobile && salesStore.currentUser.isLoggedIn"
      class="mobile-floating-trigger"
      @click="drawerVisible = true"
      title="開啟選單"
    >
      <span class="trigger-icon">☰</span>
    </div>

    <!-- 手機版抽屜滑出式側邊欄 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="260px"
      :with-header="false"
      class="mobile-nav-drawer"
    >
      <div class="drawer-header">
        <div class="drawer-user-info">
          <div class="drawer-avatar">👤</div>
          <div>
            <h4 class="drawer-user-name">{{ salesStore.currentUser.name || '業務專員' }}</h4>
            <p class="drawer-user-email">{{ salesStore.currentUser.email }}</p>
          </div>
        </div>
        <button class="drawer-close-btn" @click="drawerVisible = false">✕</button>
      </div>

      <el-menu
        :router="true"
        :default-active="$route.path"
        @select="drawerVisible = false"
        class="drawer-menu-list"
      >
        <el-menu-item index="/">📊 業績儀表板</el-menu-item>
        <el-menu-item index="/records">📋 業績紀錄總表</el-menu-item>
        <el-menu-item index="/targets">🎯 每月目標設定</el-menu-item>
        <el-menu-item index="/profile">⚙️ 個人帳號設定</el-menu-item>
        <el-menu-item @click="handleLogout" class="drawer-logout-item">🚪 登出系統</el-menu-item>
      </el-menu>
    </el-drawer>

    <!-- ========================================== -->
    <!-- 3. 主內容區 -->
    <!-- ========================================== -->
    <el-container class="main-wrapper">
      <el-main class="page-body" :class="{ 'mobile-padding': isMobile }">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const router = useRouter()
const isMobile = ref(false)
const drawerVisible = ref(false)

const checkDevice = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})

const handleLogout = () => {
  drawerVisible.value = false
  salesStore.logout()
  ElMessage.success('已安全登出系統')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: #f8fbff;
}

/* --- 桌機版側邊欄樣式 (寬度 > 768px) --- */
.desktop-aside {
  background: #ffffff;
  border-right: 1px solid #e7f5fe;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1px dashed #e7f5fe;
}
.system-title {
  font-size: 17px;
  color: #4a6583;
  margin: 0 0 8px 0;
}
.user-pill {
  font-size: 13px;
  color: #518de1;
  background: #e7f5fe;
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: bold;
}
.desktop-menu {
  border-right: none;
  flex: 1;
  margin-top: 10px;
}
.sidebar-bottom {
  padding: 16px;
  border-top: 1px dashed #e7f5fe;
  text-align: center;
}

/* --- 手機版左上角懸浮小圖示 (寬度 <= 768px) --- */
.mobile-floating-trigger {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 999;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid #d0e7ff;
  box-shadow: 0 4px 14px rgba(81, 141, 225, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.mobile-floating-trigger:active {
  transform: scale(0.92);
  box-shadow: 0 2px 6px rgba(81, 141, 225, 0.15);
}
.trigger-icon {
  font-size: 22px;
  color: #518de1;
  line-height: 1;
}

/* --- 手機版抽屜式選單內部樣式 --- */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 16px;
  border-bottom: 1px dashed #e7f5fe;
  background: #fdfefe;
}
.drawer-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.drawer-avatar {
  font-size: 26px;
  background: #e7f5fe;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.drawer-user-name {
  margin: 0;
  font-size: 15px;
  color: #4a6583;
}
.drawer-user-email {
  margin: 3px 0 0 0;
  font-size: 12px;
  color: #8fa4bc;
}
.drawer-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #a1b5c9;
  cursor: pointer;
  padding: 4px;
}
.drawer-menu-list {
  border-right: none;
  padding-top: 8px;
}
.drawer-logout-item {
  color: #f28b9c !important;
  margin-top: 15px;
}

/* --- 主畫面內容 --- */
.main-wrapper {
  width: 100%;
  overflow-x: hidden;
}
.page-body {
  padding: 20px;
}

/* 手機版頂部預留間距，避免內容被左上角懸浮小按鈕遮擋 */
.mobile-padding {
  padding: 64px 12px 20px 12px !important;
}
</style>