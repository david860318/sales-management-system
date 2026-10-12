<!-- src/views/TargetSettings.vue -->
<template>
  <div class="settings-container">
    <el-card class="box-card" style="max-width: 600px; margin: 0 auto;">
      <template #header>
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span>🎯 業績目標設定</span>
          <!-- 加入月份選擇器 -->
          <el-date-picker 
            v-model="selectedMonth" 
            type="month" 
            placeholder="選擇設定月份" 
            value-format="YYYY-MM"
            @change="loadTargetForMonth"
            style="width: 150px;"
            :clearable="false"
          />
        </div>
      </template>
      
      <el-form :model="form" label-width="120px" label-position="left">
        <el-form-item label="總業績目標">
          <el-input-number v-model="form.total" :min="0" :step="50000" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="新客業績目標">
          <el-input-number v-model="form.newClient" :min="0" :step="10000" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="舊客業績目標">
          <el-input-number v-model="form.existingClient" :min="0" :step="10000" style="width: 100%" />
        </el-form-item>

        <el-alert
          v-if="form.newClient + form.existingClient !== form.total"
          title="提示：新客與舊客目標相加不等於總目標，請確認是否為特殊設定。"
          type="warning" show-icon style="margin-bottom: 20px;" :closable="false"
        />

        <el-form-item>
          <el-button type="primary" @click="saveTargets" style="width: 100%">儲存 {{ selectedMonth }} 設定</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()

// 預設選擇當前月份
const selectedMonth = ref(new Date().toISOString().substring(0, 7))

const form = reactive({
  total: 0,
  newClient: 0,
  existingClient: 0
})

// 根據選中的月份，從 Store 讀取資料填入表單
const loadTargetForMonth = () => {
  const target = salesStore.targets[selectedMonth.value] || { total: 0, newClient: 0, existingClient: 0 }
  form.total = target.total
  form.newClient = target.newClient
  form.existingClient = target.existingClient
}

onMounted(() => {
  loadTargetForMonth()
})

const saveTargets = () => {
  if (!selectedMonth.value) return
  salesStore.updateTargets(selectedMonth.value, {
    total: form.total,
    newClient: form.newClient,
    existingClient: form.existingClient
  })
  ElMessage.success(`${selectedMonth.value} 業績目標已成功更新！`)
}
</script>

<style scoped>
.settings-container { padding: 20px; }
.card-header { font-weight: bold; font-size: 18px; }
</style>