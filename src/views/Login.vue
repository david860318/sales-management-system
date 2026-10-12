<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <div class="login-logo">
        <h2>💼 業績管理系統</h2>
        <p>Sales Performance Management</p>
      </div>

      <!-- 切換 登入 / 註冊 分頁 -->
      <el-tabs v-model="activeTab" class="login-tabs" stretch>
        
        <!-- ================= 登入 Tab ================= -->
        <el-tab-pane label="系統登入" name="login">
          <el-form :model="loginForm" label-position="top" style="margin-top: 15px;">
            <el-form-item label="電子郵件 / 帳號">
              <el-input v-model="loginForm.email" placeholder="請輸入 Email" size="large" clearable />
            </el-form-item>
            <el-form-item label="密碼">
              <el-input v-model="loginForm.password" type="password" placeholder="請輸入密碼" show-password size="large" @keyup.enter="handleLogin" />
            </el-form-item>

            <div class="login-actions">
              <el-button type="text" @click="openForgotDialog">忘記密碼？</el-button>
            </div>

            <el-form-item style="margin-top: 10px;">
              <el-button type="primary" size="large" style="width: 100%; border-radius: 12px;" @click="handleLogin">登入系統</el-button>
            </el-form-item>

            <div class="divider">或</div>

            <el-form-item>
              <el-button size="large" style="width: 100%; border-radius: 12px; background-color: #fff; border: 1px solid #d0e8fc; color: #5c738b;" @click="handleGoogleLogin">
                🌐 使用 Google 帳號登入
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- ================= 註冊 Tab ================= -->
        <el-tab-pane label="創建新帳號" name="register">
          <el-form :model="registerForm" label-position="top" style="margin-top: 15px;">
            <el-form-item label="您的姓名">
              <el-input v-model="registerForm.name" placeholder="例：王小明" size="large" clearable />
            </el-form-item>
            <el-form-item label="電子郵件 (帳號)">
              <el-input v-model="registerForm.email" placeholder="請輸入正確的 Email 格式" size="large" clearable />
            </el-form-item>
            <el-form-item label="設定密碼 (至少 6 碼)">
              <el-input v-model="registerForm.password" type="password" placeholder="請輸入至少 6 位數密碼" show-password size="large" />
            </el-form-item>
            <el-form-item label="確認密碼">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次輸入密碼" show-password size="large" @keyup.enter="handleRegister" />
            </el-form-item>

            <el-form-item style="margin-top: 15px;">
              <el-button type="success" size="large" style="width: 100%; border-radius: 12px;" @click="handleRegister">立即創建帳號</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 忘記密碼彈窗 -->
    <el-dialog v-model="forgotDialogVisible" title="重設密碼 (Email 驗證)" width="420px" @closed="resetForgotForm">
      <el-form label-position="top">
        <el-form-item label="註冊的電子郵件">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input v-model="forgotForm.email" placeholder="請輸入您的 Email" clearable />
            <el-button type="primary" :disabled="countdown > 0" @click="sendVerificationCode">
              {{ countdown > 0 ? `${countdown}s` : '發送驗證碼' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="Email 驗證碼 (6位數)">
          <el-input v-model="forgotForm.code" placeholder="請輸入 6 位數驗證碼" maxlength="6" clearable />
        </el-form-item>

        <el-form-item label="新密碼 (至少 6 碼)">
          <el-input v-model="forgotForm.newPassword" type="password" placeholder="請輸入新密碼" show-password />
        </el-form-item>

        <el-form-item label="確認新密碼">
          <el-input v-model="forgotForm.confirmPassword" type="password" placeholder="再次輸入新密碼" show-password />
        </el-form-item>

        <el-form-item style="margin-top: 20px; margin-bottom: 0;">
          <el-button type="success" size="large" style="width: 100%; border-radius: 12px;" @click="submitNewPassword">確認重設密碼</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const salesStore = useSalesStore()

const activeTab = ref('login')

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const loginForm = reactive({ email: '', password: '' })

// 登入防呆與資料庫帳號存在性驗證
const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    return ElMessage.warning('請完整輸入帳號與密碼')
  }
  if (!isValidEmail(loginForm.email)) {
    return ElMessage.warning('電子郵件格式不正確')
  }

  try {
    // 傳送 email 與 password 到 Supabase 驗證
    await salesStore.login(loginForm.email, loginForm.password)
    ElMessage.success('登入成功！')
    router.push('/')
  } catch (error) {
    ElMessageBox.confirm(
      error.message || '此帳號尚未註冊，是否要立即為您前往創建新帳號？',
      '查無此帳號或密碼錯誤',
      {
        confirmButtonText: '前往註冊',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }
    ).then(() => {
      registerForm.email = loginForm.email
      activeTab.value = 'register'
    }).catch(() => {})
  }
}

const handleGoogleLogin = async () => {
  try {
    await salesStore.loginWithGoogle()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const registerForm = reactive({ name: '', email: '', password: '', confirmPassword: '' })

const handleRegister = async () => {
  if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
    return ElMessage.warning('所有註冊欄位皆為必填項目')
  }
  if (!isValidEmail(registerForm.email)) {
    return ElMessage.warning('電子郵件格式有誤')
  }
  if (registerForm.password.length < 6) {
    return ElMessage.warning('密碼長度至少需要 6 個字元')
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    return ElMessage.warning('兩次輸入的密碼不相符')
  }

  try {
    await salesStore.register(registerForm)
    ElMessage.success(`帳號建立成功！歡迎您，${registerForm.name}`)
    router.push('/')
  } catch (error) {
    ElMessage.error(error.message || '註冊失敗')
  }
}

const forgotDialogVisible = ref(false)
const forgotForm = reactive({ email: '', code: '', newPassword: '', confirmPassword: '' })
const countdown = ref(0)
let timer = null

const openForgotDialog = () => {
  forgotForm.email = ''
  forgotForm.code = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
  countdown.value = 0
  if (timer) clearInterval(timer)
  forgotDialogVisible.value = true
}

const sendVerificationCode = () => {
  if (!forgotForm.email || !isValidEmail(forgotForm.email)) {
    return ElMessage.warning('請輸入有效的註冊信箱')
  }

  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)

  const code = salesStore.generateResetCode(forgotForm.email)
  ElMessageBox.alert(`【模擬 Email 寄送】您的 6 位數驗證碼為：<b style="color: #409EFF; font-size: 18px;">${code}</b>`, '驗證碼已發送', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '我知道了'
  })
}

const submitNewPassword = () => {
  if (!forgotForm.email || !forgotForm.code || !forgotForm.newPassword || !forgotForm.confirmPassword) {
    return ElMessage.warning('請填寫完整資訊')
  }
  if (forgotForm.code.length !== 6) {
    return ElMessage.warning('驗證碼應為 6 位數')
  }
  if (forgotForm.newPassword.length < 6) {
    return ElMessage.warning('新密碼至少 6 碼')
  }
  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    return ElMessage.warning('兩次輸入的新密碼不相符')
  }

  const success = salesStore.verifyAndResetPassword(forgotForm.email, forgotForm.code, forgotForm.newPassword)
  if (success) {
    ElMessage.success('密碼重設成功！請使用新密碼登入')
    forgotDialogVisible.value = false
    activeTab.value = 'login'
  } else {
    ElMessage.error('驗證碼錯誤或已失效')
  }
}

const resetForgotForm = () => {
  if (timer) clearInterval(timer)
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f7ff;
}
.login-card {
  width: 420px;
  border-radius: 24px;
  padding: 10px;
  border: none;
  box-shadow: 0 12px 32px rgba(140, 187, 241, 0.2);
}
.login-logo {
  text-align: center;
  margin-bottom: 15px;
}
.login-logo h2 {
  margin: 0;
  color: #6b89a8;
  font-weight: 900;
}
.login-logo p {
  margin: 5px 0 0 0;
  color: #a1b5c9;
  font-size: 12px;
}
.login-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: -5px;
}
.divider {
  text-align: center;
  color: #a1b5c9;
  font-size: 12px;
  margin: 15px 0;
}
:deep(.el-tabs__item) {
  font-weight: bold;
  color: #8cbbf1;
}
:deep(.el-tabs__item.is-active) {
  color: #6b89a8;
}
</style>