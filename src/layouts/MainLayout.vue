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
        <!-- 新增：個人設定選單 -->
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>個人設定</span>
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
          <el-avatar size="small" style="background-color: #8cbbf1; color: white; font-weight: bold;">
            {{ salesStore.currentUser.name.charAt(0) }}
          </el-avatar>
          <span style="margin-left: 10px; font-weight: bold; color: #6b89a8;">{{ salesStore.currentUser.name }}</span>
          <el-button type="danger" link style="margin-left: 15px; font-weight: bold;" @click="handleLogout">登出</el-button>
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
import { useRoute, useRouter } from 'vue-router'
import { useSalesStore } from '../stores/salesStore'
import { DataLine, List, Setting, User } from '@element-plus/icons-vue' 
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const salesStore = useSalesStore()

const pageTitle = computed(() => {
  if (route.path === '/') return '數據儀表板 (Dashboard)'
  if (route.path === '/records') return '業績紀錄總表 (Sales Records)'
  if (route.path === '/targets') return '目標業績設定 (Targets)'
  if (route.path === '/profile') return '個人設定 (User Profile)'
  return '業務業績管理系統'
})

const handleLogout = () => {
  salesStore.logout()
  ElMessage.success('已安全登出')
  router.push('/login')
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside { background-color: #a2cbf6; color: white; display: flex; flex-direction: column; box-shadow: 4px 0 16px rgba(140, 187, 241, 0.2); z-index: 10; }
.logo-area { height: 70px; line-height: 70px; text-align: center; background-color: #8cbbf1; border-bottom: 2px dashed #b9daf9; }
.logo-area h2 { margin: 0; font-size: 20px; color: #fff; font-weight: 900; }
.menu { border-right: none; flex: 1; padding-top: 10px; background-color: transparent; }
:deep(.el-menu-item) { color: #eff6ff; font-weight: bold; border-radius: 20px; margin: 8px 15px; height: 45px; line-height: 45px; }
:deep(.el-menu-item:hover), :deep(.el-menu-item.is-active) { background-color: #ffffff; color: #8cbbf1; box-shadow: 0 4px 12px rgba(140, 187, 241, 0.3); }
.header { background-color: #ffffff; display: flex; justify-content: space-between; align-items: center; height: 70px; box-shadow: 0 4px 20px rgba(140, 187, 241, 0.15); margin: 15px 20px 0 20px; border-radius: 24px; }
.header-left h3 { margin: 0; color: #6b89a8; font-weight: 800; }
.header-right { display: flex; align-items: center; }
.main-content { padding: 20px; }
</style>