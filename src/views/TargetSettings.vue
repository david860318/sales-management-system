<!-- src/views/TargetSettings.vue -->
<template>
  <div class="settings-container">
    <el-card shadow="hover" class="settings-card">
      <template #header>
        <div class="card-header">
          <span>🎯 {{ salesStore.currentUser.name }} 的每月業績目標設定</span>
          <el-button type="primary" size="small" @click="openAddTargetDialog">新增月份目標</el-button>
        </div>
      </template>

      <el-table :data="targetTableData" style="width: 100%" border class="cute-table">
        <el-table-column prop="month" label="月份" width="120" align="center" sortable>
          <template #default="scope"><strong>{{ scope.row.month }}</strong></template>
        </el-table-column>
        <el-table-column prop="total" label="總目標業績" align="right" sortable>
          <template #default="scope">$ {{ scope.row.total.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="newClient" label="新客目標業績" align="right" sortable>
          <template #default="scope"><span class="text-opt-blue">$ {{ scope.row.newClient.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="existingClient" label="舊客目標業績" align="right" sortable>
          <template #default="scope"><span class="text-opt-green">$ {{ scope.row.existingClient.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="openEditTargetDialog(scope.row)">編輯目標</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '修改月份業績目標' : '新增月份業績目標'" width="500px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="目標月份">
          <el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" placeholder="選擇月份" :disabled="isEditMode" style="width: 100%" />
        </el-form-item>
        <el-form-item label="總目標金額">
          <el-input-number v-model="form.total" :min="0" :step="50000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="新客目標金額">
          <el-input-number v-model="form.newClient" :min="0" :step="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="舊客目標金額">
          <el-input-number v-model="form.existingClient" :min="0" :step="10000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTargetForm">確認儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const dialogVisible = ref(false)
const isEditMode = ref(false)

const form = reactive({ month: '', total: 0, newClient: 0, existingClient: 0 })

const targetTableData = computed(() => {
  return Object.keys(salesStore.targets).sort().map(month => ({
    month,
    ...salesStore.targets[month]
  }))
})

const openAddTargetDialog = () => {
  isEditMode.value = false
  form.month = new Date().toISOString().substring(0, 7)
  form.total = 500000
  form.newClient = 200000
  form.existingClient = 300000
  dialogVisible.value = true
}

const openEditTargetDialog = (row) => {
  isEditMode.value = true
  form.month = row.month
  form.total = row.total
  form.newClient = row.newClient
  form.existingClient = row.existingClient
  dialogVisible.value = true
}

const submitTargetForm = async () => {
  if (!form.month) return ElMessage.warning('請選擇月份')
  
  await salesStore.updateTargets(form.month, {
    total: form.total,
    newClient: form.newClient,
    existingClient: form.existingClient
  })

  ElMessage.success(`月份 ${form.month} 目標已成功儲存至您的帳號！`)
  dialogVisible.value = false
}
</script>

<style scoped>
.settings-container { padding: 10px; }
.settings-card { border-radius: 24px; border: none; box-shadow: 0 6px 18px rgba(140, 187, 241, 0.1) !important; }
.card-header { font-weight: 800; font-size: 16px; color: #6b89a8; display: flex; justify-content: space-between; align-items: center; }
.cute-table { color: #6b89a8; font-weight: 600; }
:deep(.el-table) { border-radius: 16px; overflow: hidden; border: 2px solid #e7f5fe; }
:deep(.el-table th.el-table__cell) { background-color: #e7f5fe; color: #6b89a8; font-weight: 800; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px dashed #e7f5fe; }
.text-opt-blue { color: #518de1; font-weight: bold; }
.text-opt-green { color: #4ab382; font-weight: bold; }
</style>