<!-- src/layouts/MainLayout.vue -->
<template>
  <el-container class="layout-container">
    <!-- ========================================== -->
    <!-- 1. 桌機版側邊欄 (固定在左側 100vh，永遠常駐) -->
    <!-- ========================================== -->
    <el-aside width="230px" class="desktop-aside" v-if="!isMobile">
      <div class="sidebar-header">
        <h2 class="system-title">🚀 SPM 業績系統</h2>
        <div class="user-pill">{{ salesStore.currentUser.name || '業務專員' }}</div>
      </div>

      <!-- 選單區塊 (內部滾動，不推擠底部按鈕) -->
      <el-menu :router="true" :default-active="$route.path" class="desktop-menu">
        <el-menu-item index="/">📊 業績儀表板</el-menu-item>
        <el-menu-item index="/records">📋 業績紀錄總表</el-menu-item>
        <el-menu-item index="/targets">🎯 每月目標設定</el-menu-item>
        <el-menu-item index="/profile">⚙️ 個人帳號設定</el-menu-item>
      </el-menu>

      <!-- 側邊欄底部登出按鈕 (常駐於左下角，永遠不消失) -->
      <div class="sidebar-bottom">
        <el-button type="danger" class="desktop-logout-btn" @click="handleLogout">
          🚪 登出系統
        </el-button>
      </div>
    </el-aside>

    <!-- ========================================== -->
    <!-- 2. 手機版左上角漢堡選單 + 右上角快捷登出按鈕 -->
    <!-- ========================================== -->
    <template v-if="isMobile && salesStore.currentUser.isLoggedIn">
      <!-- 左上角懸浮漢堡選單 -->
      <div
        class="mobile-floating-trigger"
        @click="drawerVisible = true"
        title="開啟選單"
      >
        <span class="trigger-icon">☰</span>
      </div>

      <!-- 右上角懸浮快速登出按鈕 (讓手機使用者不用進選單也能隨時一鍵登出) -->
      <!-- <div
        class="mobile-floating-logout"
        @click="handleLogout"
        title="登出系統"
      >
        <span class="logout-icon">🚪</span>
        <span class="logout-text">登出</span>
      </div> -->
    </template>

    <!-- 手機版抽屜滑出式側邊欄 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="270px"
      :with-header="false"
      class="mobile-nav-drawer"
    >
      <div class="drawer-container">
        <!-- 抽屜頂部 -->
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

        <!-- 抽屜選單列表 -->
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
        </el-menu>

        <!-- 抽屜底部大型登出按鈕 -->
        <div class="drawer-footer">
          <el-button type="danger" class="drawer-logout-btn" @click="handleLogout">
            🚪 登出系統
          </el-button>
        </div>
      </div>
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
  background-color: #f3f8fe;
}

/* --- 桌機版側邊欄樣式 (寬度 > 768px) --- */
.desktop-aside {
  background: #ffffff;
  border-right: 1.5px solid #e1effe;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  box-shadow: 4px 0 16px rgba(123, 181, 249, 0.06);
  z-index: 10;
}

.sidebar-header {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1.5px dashed #e8f2fe;
}

.system-title {
  font-size: 18px;
  color: #3b5473;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.user-pill {
  font-size: 12px;
  color: #5190e8;
  background: #edf5fe;
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 800;
  border: 1px solid #d4e7fe;
}

.desktop-menu {
  border-right: none;
  flex: 1;
  padding: 10px;
  background: transparent;
  overflow-y: auto;
}

:deep(.desktop-menu .el-menu-item) {
  border-radius: 14px;
  margin-bottom: 6px;
  font-weight: 700;
  color: #5c728a;
  transition: all 0.2s ease;
}

:deep(.desktop-menu .el-menu-item:hover) {
  background-color: #f0f7fe;
  color: #6ea7f9;
  transform: translateX(4px);
}

:deep(.desktop-menu .el-menu-item.is-active) {
  background: linear-gradient(135deg, #e3effe 0%, #d3e7fe 100%);
  color: #4387ea;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(118, 174, 254, 0.2);
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1.5px dashed #e8f2fe;
  background: #ffffff;
}

.desktop-logout-btn {
  width: 100%;
  height: 42px;
  font-size: 14px;
  font-weight: 800;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #ffa2b4 0%, #ff7b94 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(255, 123, 148, 0.3) !important;
  color: #ffffff !important;
}

.desktop-logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255, 123, 148, 0.45) !important;
}

/* --- 手機版左上角懸浮漢堡按鈕 --- */
.mobile-floating-trigger {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 999;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1.5px solid #d3e7fe;
  box-shadow: 0 6px 18px rgba(109, 166, 250, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-floating-trigger:active {
  transform: scale(0.9);
}

.trigger-icon {
  font-size: 20px;
  color: #6ea7f9;
}

/* --- 手機版右上角懸浮快速登出按鈕 --- */
.mobile-floating-logout {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 999;
  height: 44px;
  padding: 0 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1.5px solid #ffd2da;
  box-shadow: 0 6px 18px rgba(255, 123, 148, 0.22);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-floating-logout:active {
  transform: scale(0.92);
}

.logout-icon {
  font-size: 16px;
}

.logout-text {
  font-size: 13px;
  font-weight: 800;
  color: #ff6b87;
}

/* --- 手機版抽屜式選單內部樣式 --- */
.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px;
  border-bottom: 1.5px dashed #e8f2fe;
  background: #f8fbfe;
}

.drawer-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drawer-avatar {
  font-size: 24px;
  background: #e1effe;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #cce3fe;
}

.drawer-user-name {
  margin: 0;
  font-size: 15px;
  color: #3d5069;
  font-weight: 800;
}

.drawer-user-email {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #8fa3b8;
}

.drawer-close-btn {
  background: #eef6fe;
  border: none;
  font-size: 16px;
  color: #7da5ce;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-menu-list {
  flex: 1;
  border-right: none;
  padding: 10px;
}

.drawer-footer {
  padding: 16px;
  border-top: 1.5px dashed #e8f2fe;
  background: #ffffff;
}

.drawer-logout-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #ffa2b4 0%, #ff7b94 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(255, 123, 148, 0.3) !important;
  color: #ffffff !important;
}

/* --- 主畫面內容 --- */
.main-wrapper {
  width: 100%;
  overflow-x: hidden;
}

.page-body {
  padding: 22px;
}

/* 手機版頂部預留間距，避免內容被左上角與右上角懸浮按鈕遮擋 */
.mobile-padding {
  padding: 68px 12px 24px 12px !important;
}
</style>