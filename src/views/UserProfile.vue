<!-- src/views/UserProfile.vue -->
<template>
  <div class="profile-container">
    <el-card shadow="hover" class="profile-card">
      <template #header>
        <div class="profile-header">
          <div class="user-avatar-badge">👤</div>
          <div>
            <h3 class="profile-title">個人帳號與業務資料設定</h3>
            <p class="profile-subtitle">維護您的聯絡方式與系統個人資料</p>
          </div>
        </div>
      </template>

      <el-form :model="profileForm" label-width="100px" class="profile-form">
        <el-form-item label="電子郵件">
          <el-input v-model="profileForm.email" disabled placeholder="登入用電子郵件" />
          <span class="field-hint">電子郵件為帳號唯一識別，無法修改</span>
        </el-form-item>

        <el-form-item label="真實姓名">
          <el-input v-model="profileForm.name" placeholder="請輸入姓名" clearable />
        </el-form-item>

        <el-form-item label="業務職稱">
          <el-input v-model="profileForm.title" placeholder="例如：資深業務經理、業務專員" clearable />
        </el-form-item>

        <el-form-item label="聯絡電話">
          <el-input v-model="profileForm.phone" placeholder="請輸入聯絡電話（例如：0912-345-678）" clearable />
        </el-form-item>

        <div class="form-btn-row">
          <el-button type="primary" :loading="saving" @click="saveProfile" class="save-btn">
            💾 儲存個人資料變更
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const saving = ref(false)

const profileForm = reactive({
  email: '',
  name: '',
  title: '',
  phone: ''
})

onMounted(() => {
  profileForm.email = salesStore.currentUser.email || ''
  profileForm.name = salesStore.currentUser.name || ''
  profileForm.title = salesStore.currentUser.title || ''
  profileForm.phone = salesStore.currentUser.phone || ''
})

const saveProfile = async () => {
  if (!profileForm.name) return ElMessage.warning('請輸入姓名')
  saving.value = true
  await salesStore.updateUserProfile({
    name: profileForm.name,
    title: profileForm.title,
    phone: profileForm.phone
  })
  saving.value = false
  ElMessage.success('個人資料已成功更新並同步至資料庫！')
}
</script>

<style scoped>
.profile-container {
  max-width: 680px;
  margin: 10px auto;
  width: 100%;
  box-sizing: border-box;
}

.profile-card {
  border-radius: 20px;
  border: 1px solid #e7f5fe;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar-badge {
  font-size: 28px;
  background: #e7f5fe;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-title {
  margin: 0;
  font-size: 17px;
  color: #4a6583;
}

.profile-subtitle {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #8fa4bc;
}

.field-hint {
  font-size: 11px;
  color: #a1b5c9;
  margin-top: 4px;
  display: block;
}

.form-btn-row {
  margin-top: 24px;
}

.save-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: bold;
  border-radius: 12px;
}

/* ==========================================================
   需求 8: 個人設定頁面專屬 RWD 響應式優化 (小於 768px)
   ========================================================== */
@media screen and (max-width: 768px) {
  .profile-container {
    padding: 0 4px;
    margin: 0 auto;
  }

  .profile-card {
    border-radius: 14px;
  }

  .profile-card :deep(.el-card__body) {
    padding: 16px 14px !important;
  }

  .profile-form :deep(.el-form-item) {
    display: flex;
    flex-direction: column !important;
    align-items: flex-start !important;
    margin-bottom: 16px !important;
  }

  .profile-form :deep(.el-form-item__label) {
    text-align: left !important;
    margin-bottom: 6px !important;
    padding: 0 !important;
    font-size: 14px;
    font-weight: bold;
    color: #4a6583;
  }

  .profile-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100% !important;
  }

  .profile-form :deep(.el-input__wrapper) {
    padding: 8px 12px;
  }

  .save-btn {
    height: 46px;
    font-size: 16px;
  }
}
</style>