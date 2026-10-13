<!-- src/views/TargetSettings.vue -->
<template>
  <div class="target-wrapper">
    <el-card shadow="hover" class="target-card">
      <template #header>
        <div class="target-header">
          <span>🎯 {{ salesStore.currentUser.name }} 的業績目標設定</span>
          <el-button type="primary" size="small" @click="openAddDialog">新增月份目標</el-button>
        </div>
      </template>

      <!-- 需求 7: 月份搜尋篩選列 -->
      <div class="filter-bar">
        <span class="filter-label">🔍 篩選目標月份：</span>
        <el-date-picker
          v-model="filterMonth"
          type="month"
          value-format="YYYY-MM"
          placeholder="選擇月份或清空看全部"
          clearable
          style="width: 200px;"
        />
        <el-button v-if="filterMonth" size="small" @click="filterMonth = ''" style="margin-left: 8px;">重置</el-button>
      </div>

      <!-- 1. 桌機版表格 -->
      <div class="desktop-target-view">
        <el-table :data="tableData" border style="width: 100%">
          <el-table-column prop="month" label="月份" width="110" align="center" sortable />
          <el-table-column prop="total" label="總目標業績" align="right" sortable>
            <template #default="scope">$ {{ scope.row.total.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="newClient" label="新客目標" align="right" sortable>
            <template #default="scope"><span style="color: #518de1; font-weight: bold;">$ {{ scope.row.newClient.toLocaleString() }}</span></template>
          </el-table-column>
          <el-table-column prop="existingClient" label="舊客目標" align="right" sortable>
            <template #default="scope"><span style="color: #4ab382; font-weight: bold;">$ {{ scope.row.existingClient.toLocaleString() }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="openEditDialog(scope.row)">編輯</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 2. 手機版卡片清單 -->
      <div class="mobile-target-view">
        <div v-if="tableData.length === 0" class="empty-hint">尚未設定任何月份目標</div>
        <div v-for="item in tableData" :key="item.month" class="m-t-card">
          <div class="m-t-head">
            <span class="m-t-month">📅 {{ item.month }}</span>
            <el-button type="primary" size="small" plain @click="openEditDialog(item)">編輯</el-button>
          </div>
          <div class="m-t-rows">
            <div class="m-t-row"><span>總目標：</span><strong>$ {{ item.total.toLocaleString() }}</strong></div>
            <div class="m-t-row"><span>新客目標：</span><span style="color: #518de1;">$ {{ item.newClient.toLocaleString() }}</span></div>
            <div class="m-t-row"><span>舊客目標：</span><span style="color: #4ab382;">$ {{ item.existingClient.toLocaleString() }}</span></div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 對話框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '修改月份業績目標' : '新增月份業績目標'">
      <el-form :model="form" label-width="110px">
        <el-form-item label="目標月份">
          <el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" :disabled="isEdit" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="總目標金額"><el-input-number v-model="form.total" :min="0" :step="50000" style="width: 100%;" /></el-form-item>
        <el-form-item label="新客目標金額"><el-input-number v-model="form.newClient" :min="0" :step="10000" style="width: 100%;" /></el-form-item>
        <el-form-item label="舊客目標金額"><el-input-number v-model="form.existingClient" :min="0" :step="10000" style="width: 100%;" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTarget">確認儲存</el-button>
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
const isEdit = ref(false)
const filterMonth = ref('') // 需求 7: 篩選月份
const form = reactive({ month: '', total: 0, newClient: 0, existingClient: 0 })

// 依篩選月份過濾列表
const tableData = computed(() => {
  let months = Object.keys(salesStore.targets).sort()
  if (filterMonth.value) {
    months = months.filter(m => m === filterMonth.value)
  }
  return months.map(month => ({
    month,
    ...salesStore.targets[month]
  }))
})

const openAddDialog = () => {
  isEdit.value = false
  form.month = new Date().toISOString().slice(0, 7)
  form.total = 500000
  form.newClient = 200000
  form.existingClient = 300000
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  form.month = row.month
  form.total = row.total
  form.newClient = row.newClient
  form.existingClient = row.existingClient
  dialogVisible.value = true
}

// 需求 7: 儲存與防呆檢查
const saveTarget = async () => {
  if (!form.month) return ElMessage.warning('請選擇目標月份')

  // 防呆：如果是在「新增模式」，檢查該月份是否已經存在
  if (!isEdit.value && salesStore.targets[form.month]) {
    ElMessage.error(`【警告】月份 ${form.month} 的目標已經存在！請直接從列表中點擊「編輯」進行修改。`)
    return
  }

  await salesStore.updateTargets(form.month, {
    total: form.total,
    newClient: form.newClient,
    existingClient: form.existingClient
  })
  ElMessage.success(`月份 ${form.month} 目標已成功儲存`)
  dialogVisible.value = false
}
</script>

<style scoped>
.target-wrapper { width: 100%; }
.target-card { border-radius: 14px; }
.target-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #4a6583; }

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  background-color: #f8fbff;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px dashed #e7f5fe;
}
.filter-label {
  font-size: 14px;
  font-weight: bold;
  color: #6b89a8;
  margin-right: 8px;
}

.desktop-target-view { display: block; }
.mobile-target-view { display: none; }

@media screen and (max-width: 768px) {
  .desktop-target-view { display: none; }
  .mobile-target-view { display: flex; flex-direction: column; gap: 10px; }

  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .filter-bar :deep(.el-date-editor) {
    width: 100% !important;
  }

  .m-t-card {
    background: #ffffff;
    border: 1px solid #e7f5fe;
    border-radius: 12px;
    padding: 12px;
  }
  .m-t-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .m-t-month { font-weight: bold; color: #4a6583; }
  .m-t-rows { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  .m-t-row { display: flex; justify-content: space-between; background: #f8fbff; padding: 6px 10px; border-radius: 6px; }
  .empty-hint { text-align: center; color: #a1b5c9; padding: 20px; }
}
</style>