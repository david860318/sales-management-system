<!-- src/views/SalesRecords.vue -->
<template>
  <div class="records-container">
    <el-card shadow="never" class="search-card" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="歸屬月份區間"><el-date-picker v-model="searchForm.dateRange" type="monthrange" range-separator="至" start-placeholder="開始月份" end-placeholder="結束月份" value-format="YYYY-MM" style="width: 250px" /></el-form-item>
        <el-form-item label="客戶名稱"><el-input v-model="searchForm.clientName" placeholder="輸入關鍵字" clearable style="width: 150px" /></el-form-item>
        <el-form-item label="屬性"><el-select v-model="searchForm.clientType" placeholder="全部" clearable style="width: 100px"><el-option label="新客" value="新客" /><el-option label="舊客" value="舊客" /></el-select></el-form-item>
        <el-form-item label="狀態"><el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px"><el-option label="A初步洽談" value="A初步洽談" /><el-option label="B報價中" value="B報價中" /><el-option label="E輸單(已簽約)" value="E輸單(已簽約)" /><el-option label="F開發票" value="F開發票" /><el-option label="G流單" value="G流單" /></el-select></el-form-item>
        <el-form-item><el-button @click="resetSearch">重置條件</el-button></el-form-item>
      </el-form>
    </el-card>

    <div class="toolbar" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <el-button type="primary" :icon="Plus" @click="openAddDialog">新增業績紀錄</el-button>
      <el-button type="success" :icon="Download" @click="exportCSV">匯出報表 (目前篩選結果)</el-button>
    </div>

    <el-table :data="filteredTableData" style="width: 100%" border stripe>
      <el-table-column prop="month" label="歸屬月份" width="110" align="center" sortable />
      <el-table-column prop="clientName" label="客戶名稱" width="130" show-overflow-tooltip sortable />
      <el-table-column prop="projectName" label="專案名稱" width="150" show-overflow-tooltip />
      <el-table-column prop="clientType" label="屬性" width="100" align="center" sortable>
        <template #default="scope"><el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'">{{ scope.row.clientType }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="productName" label="產品名稱" width="120" show-overflow-tooltip />
      <el-table-column prop="status" label="狀態" width="150" align="center" sortable>
        <template #default="scope"><el-tag :type="getStatusColor(scope.row.status)" effect="dark" size="small">{{ scope.row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="amount" label="合約金額(未稅)" align="right" width="140" sortable>
        <template #default="scope">$ {{ scope.row.amount.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="cost" label="成本(實際付出)" align="right" width="140" sortable>
        <template #default="scope">$ {{ scope.row.cost.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="netRevenue" label="實際認列" align="right" width="130" sortable>
        <template #default="scope"><strong style="color: #f56c6c;">$ {{ scope.row.netRevenue.toLocaleString() }}</strong></template>
      </el-table-column>
      <el-table-column prop="expectedDate" label="預計成交日" width="130" align="center" sortable />
      
      <!-- 新增：雙用印狀態欄位 (打勾功能) -->
      <el-table-column label="雙用印" width="110" align="center" fixed="right">
        <template #default="scope">
          <!-- 條件：金額大於 30 萬 且 狀態為 E輸單 -->
          <div v-if="scope.row.amount > 300000 && scope.row.status.includes('E輸單')">
            <el-checkbox v-model="scope.row.isDualSealCompleted" @change="(val) => updateDualSeal(scope.row, val)">
              <span :style="{ color: scope.row.isDualSealCompleted ? '#83cbb1' : '#f28b9c', fontWeight: 'bold' }">
                {{ scope.row.isDualSealCompleted ? '已完成' : '待申請' }}
              </span>
            </el-checkbox>
          </div>
          <span v-else style="color: #a1b5c9; font-size: 12px;">無需</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" link size="small" @click="openEditDialog(scope.row)">編輯</el-button>
          <el-popconfirm title="確定要刪除這筆業績嗎？" @confirm="handleDelete(scope.row.id)">
            <template #reference><el-button type="danger" link size="small">刪除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '編輯業績紀錄' : '新增業績紀錄'" width="600px" @closed="resetForm">
      <el-form :model="form" label-width="120px">
        <el-divider content-position="left">基本與專案資訊</el-divider>
        <el-form-item label="業績歸屬月份"><el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" style="width: 100%" /></el-form-item>
        <el-form-item label="客戶屬性">
          <el-radio-group v-model="form.clientType"><el-radio value="新客" label="新客">新客</el-radio><el-radio value="舊客" label="舊客">舊客</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="客戶名稱"><el-input v-model="form.clientName" placeholder="輸入客戶公司或個人名稱" /></el-form-item>
        <el-form-item label="客戶產業"><el-input v-model="form.industry" placeholder="輸入客戶產業 (例：資訊科技業)" /></el-form-item>
        <el-form-item label="專案名稱"><el-input v-model="form.projectName" placeholder="輸入本次專案名稱" /></el-form-item>
        <el-form-item label="產品名稱"><el-input v-model="form.productName" placeholder="輸入本次銷售的具體項目名稱" /></el-form-item>
        <el-form-item label="業績來源">
          <el-select v-model="form.source" placeholder="選擇開發管道" style="width: 100%">
            <el-option label="陌生開發" value="陌生開發" /><el-option label="舊客回購" value="舊客回購" /><el-option label="行銷名單" value="行銷名單" /><el-option label="合作夥伴轉介" value="合作夥伴轉介" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">金額與狀態</el-divider>
        <el-form-item label="推進階段/狀態">
          <el-select v-model="form.status" style="width: 100%">
            <el-option-group label="商機階段"><el-option label="A初步洽談" value="A初步洽談" /><el-option label="B報價中" value="B報價中" /><el-option label="C調整報價" value="C調整報價" /><el-option label="D提供合約" value="D提供合約" /></el-option-group>
            <el-option-group label="結案階段"><el-option label="E輸單(已簽約)" value="E輸單(已簽約)" /><el-option label="F開發票" value="F開發票" /></el-option-group>
            <el-option-group label="失效階段"><el-option label="G流單" value="G流單" /></el-option-group>
          </el-select>
        </el-form-item>
        
        <el-form-item label="合約總金額">
          <el-input-number v-model="form.amount" :min="0" :step="10000" style="width: 100%" @change="autoCalculateNet" />
        </el-form-item>
        <el-form-item label="成本(外部費用)">
          <el-input-number v-model="form.cost" :min="0" :step="1000" style="width: 100%" @change="autoCalculateNet" />
        </el-form-item>
        <el-form-item label="實際認列業績">
          <el-input-number v-model="form.netRevenue" :min="0" :step="10000" style="width: 100%" />
          <div style="font-size: 12px; color: #909399; line-height: 1.2; margin-top: 5px;">預設為「合約總金額 - 成本」，若認列比例不同可手動修改。</div>
        </el-form-item>

        <el-divider content-position="left">其他</el-divider>
        <el-form-item label="預計成交/收款日"><el-date-picker v-model="form.expectedDate" type="date" placeholder="選擇日期" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="備註說明"><el-input v-model="form.notes" type="textarea" :rows="3" placeholder="其他補充事項或追蹤紀錄..." /></el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{ isEditMode ? '儲存變更' : '確認新增' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, Download } from '@element-plus/icons-vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const salesStore = useSalesStore()
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditId = ref(null)

const searchForm = reactive({ dateRange: [], clientName: '', clientType: '', status: '' })
const defaultForm = { month: '', clientType: '新客', clientName: '', industry: '', projectName: '', productName: '', source: '', status: 'A初步洽談', amount: 0, cost: 0, netRevenue: 0, expectedDate: '', notes: '', isDualSealCompleted: false }
const form = reactive({ ...defaultForm })

const filteredTableData = computed(() => {
  return salesStore.records.filter(r => {
    const matchDate = (!searchForm.dateRange || searchForm.dateRange.length !== 2) || (r.month >= searchForm.dateRange[0] && r.month <= searchForm.dateRange[1])
    const matchName = !searchForm.clientName || r.clientName.includes(searchForm.clientName)
    const matchType = !searchForm.clientType || r.clientType === searchForm.clientType
    const matchStatus = !searchForm.status || r.status === searchForm.status
    return matchDate && matchName && matchType && matchStatus
  })
})

const resetSearch = () => { searchForm.dateRange = []; searchForm.clientName = ''; searchForm.clientType = ''; searchForm.status = '' }

const getStatusColor = (status) => {
  if (status.includes('輸單') || status.includes('開發票')) return 'success'
  if (status.includes('流單')) return 'info'
  return 'warning'
}

const autoCalculateNet = () => { form.netRevenue = form.amount - form.cost }

const openAddDialog = () => { isEditMode.value = false; Object.assign(form, defaultForm); dialogVisible.value = true }

const openEditDialog = (row) => { isEditMode.value = true; currentEditId.value = row.id; Object.assign(form, row); dialogVisible.value = true }

const handleDelete = (id) => { salesStore.deleteRecord(id); ElMessage.success('業績紀錄已刪除') }

// 處理雙用印打勾狀態
const updateDualSeal = (row, val) => {
  salesStore.updateRecord(row.id, { ...row, isDualSealCompleted: val })
  if (val) {
    ElMessage.success('已標記雙用印為「完成」！')
  }
}

const submitForm = () => {
  if (!form.clientName || !form.month) return ElMessage.warning('請填寫客戶名稱與歸屬月份')
  
  // 核心條件：合約金額超過 30 萬 且 狀態為 E輸單(已簽約) 且 尚未標記完成雙用印
  const isHighValueE = form.amount > 300000 && form.status.includes('E輸單')
  const needsReminder = isHighValueE && !form.isDualSealCompleted

  if (isEditMode.value) {
    salesStore.updateRecord(currentEditId.value, { ...form })
    ElMessage.success('業績紀錄已更新！')
  } else {
    salesStore.addRecord({ ...form })
    ElMessage.success('業績新增成功！')
  }
  
  dialogVisible.value = false

  // 若符合雙用印條件，彈出強烈提醒框
  if (needsReminder) {
    setTimeout(() => {
      ElMessageBox.alert(
        '此筆合約金額超過 30 萬，且已進入「E輸單(已簽約)」階段。<br/><br/>請務必記得進行<b>「雙用印」申請</b>！<br/><span style="color: #909399; font-size: 12px;">申請完畢後可在列表中打勾標記為完成。</span>',
        '⚠️ 雙用印申請提醒',
        {
          confirmButtonText: '我知道了',
          type: 'warning',
          dangerouslyUseHTMLString: true,
          center: true
        }
      )
    }, 300)
  }
}

const resetForm = () => { Object.assign(form, defaultForm) }

const exportCSV = () => {
  if (filteredTableData.value.length === 0) return ElMessage.warning('目前沒有紀錄可匯出')
  
  // 匯出報表同步新增「雙用印狀態」
  const headers = ['建檔日', '歸屬月份', '客戶屬性', '客戶名稱', '客戶產業', '專案名稱', '產品名稱', '業績來源', '推進狀態', '合約總金額(未稅)', '成本(外部)', '實際認列業績', '預計成交/收款日', '備註說明', '雙用印狀態']
  const rows = filteredTableData.value.map(r => {
    // 判斷匯出文字
    let sealStatus = '無需'
    if (r.amount > 300000 && r.status.includes('E輸單')) {
      sealStatus = r.isDualSealCompleted ? '已完成' : '待申請'
    }
    
    return [
      r.createdDate, r.month, r.clientType, r.clientName, r.industry || '', r.projectName || '', r.productName || '', r.source || '', r.status, r.amount, r.cost, r.netRevenue, r.expectedDate || '', (r.notes || '').replace(/,/g, '，'), sealStatus
    ]
  })
  
  let csvContent = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(row => { csvContent += row.join(',') + '\n' })
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `業績詳細報表_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('報表下載成功！')
}
</script>

<style scoped>
.records-container { background-color: #fff; padding: 24px; border-radius: 24px; box-shadow: 0 8px 24px rgba(140, 187, 241, 0.12); }
.search-card { background-color: #f8fbff; border: 2px dashed #d0e8fc; border-radius: 20px;}
.search-card :deep(.el-form-item) { margin-bottom: 0; margin-right: 15px; }
.search-card :deep(.el-form-item__label) { color: #8cbbf1; font-weight: bold; }
.toolbar { margin-bottom: 20px; }
:deep(.el-table) { border-radius: 16px; overflow: hidden; border: 2px solid #e7f5fe; }
:deep(.el-table th.el-table__cell) { background-color: #e7f5fe; color: #6b89a8; font-weight: 800; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px dashed #e7f5fe; }
:deep(.el-dialog) { border-radius: 24px; }
:deep(.el-dialog__header) { background-color: #f8fbff; border-radius: 24px 24px 0 0; border-bottom: 2px solid #e7f5fe; margin-right: 0; padding: 20px; }
:deep(.el-dialog__title) { color: #6b89a8; font-weight: 800; }
:deep(.el-divider__text) { background-color: #f8fbff; color: #8cbbf1; font-weight: bold; }
</style>