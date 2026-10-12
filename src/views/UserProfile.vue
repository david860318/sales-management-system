<!-- src/views/UserProfile.vue -->
<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 左側：基本資料編輯 -->
      <el-col :span="12">
        <el-card shadow="hover" class="profile-card">
          <template #header><div class="card-header">👤 個人基本資料設定</div></template>
          
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="姓名"><el-input v-model="profileForm.name" /></el-form-item>
            <el-form-item label="電子郵件"><el-input v-model="profileForm.email" disabled /></el-form-item>
            <el-form-item label="職稱"><el-input v-model="profileForm.title" /></el-form-item>
            <el-form-item label="連絡電話"><el-input v-model="profileForm.phone" /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile">儲存基本資料</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右側：修改密碼 -->
      <el-col :span="12">
        <el-card shadow="hover" class="profile-card">
          <template #header><div class="card-header">🔒 修改密碼</div></template>
          
          <el-form :model="passwordForm" label-width="110px">
            <el-form-item label="目前密碼"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
            <el-form-item label="新密碼"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
            <el-form-item label="確認新密碼"><el-input v-model="passwordForm.confirmPassword" type="password" show-password /></el-form-item>
            <el-form-item>
              <el-button type="success" @click="updatePassword">更新密碼</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()

const profileForm = reactive({
  name: salesStore.currentUser.name,
  email: salesStore.currentUser.email,
  title: salesStore.currentUser.title,
  phone: salesStore.currentUser.phone
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saveProfile = () => {
  salesStore.updateUserProfile(profileForm)
  ElMessage.success('個人基本資料已成功更新！')
}

const updatePassword = () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    return ElMessage.warning('請填寫完整密碼欄位')
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return ElMessage.warning('新密碼與確認密碼不相符')
  }
  ElMessage.success('密碼修改成功！下次登入請使用新密碼')
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}
</script>

<style scoped>
.profile-container { padding: 10px; }
.profile-card { border-radius: 24px; border: none; box-shadow: 0 6px 18px rgba(140, 187, 241, 0.1) !important; }
.card-header { font-weight: 800; font-size: 16px; color: #6b89a8; }
</style>