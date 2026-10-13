<!-- src/views/SalesRecords.vue -->
<template>
  <div class="records-container">
    <!-- 搜尋條件卡片 -->
    <el-card shadow="never" class="search-card" style="margin-bottom: 16px;">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="歸屬月份">
          <el-date-picker v-model="searchForm.dateRange" type="monthrange" range-separator="至" start-placeholder="開始" end-placeholder="結束" value-format="YYYY-MM" />
        </el-form-item>
        <el-form-item label="客戶名稱">
          <el-input v-model="searchForm.clientName" placeholder="搜尋客戶名稱" clearable />
        </el-form-item>
        <el-form-item label="屬性">
          <el-select v-model="searchForm.clientType" placeholder="全部" clearable>
            <el-option label="新客" value="新客" />
            <el-option label="舊客" value="舊客" />
          </el-select>
        </el-form-item>
        <el-form-item label="狀態">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option-group label="潛在業績階段">
              <el-option label="A初步洽談" value="A初步洽談" />
              <el-option label="B報價中" value="B報價中" />
              <el-option label="C調整報價" value="C調整報價" />
              <el-option label="D提供合約 (列入潛在業績)" value="D提供合約 (列入潛在業績)" />
            </el-option-group>
            <el-option-group label="結案階段 (列入實際達成)">
              <el-option label="E輸單" value="E輸單" />
              <el-option label="F開發票 (列入實際達成)" value="F開發票 (列入實際達成)" />
            </el-option-group>
            <el-option-group label="失效階段">
              <el-option label="G流單 (不列入計算)" value="G流單 (不列入計算)" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查詢</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具列（新增、匯出） -->
    <div class="action-toolbar" style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <el-button type="primary" :icon="Plus" @click="openAddDialog">新增業績紀錄</el-button>
      <el-button type="success" :icon="Download" @click="exportCSV">匯出報表 (CSV)</el-button>
    </div>

    <!-- 桌機版表格 -->
    <div class="desktop-view-only">
      <el-table :data="filteredTableData" border style="width: 100%" v-loading="loading">
        <el-table-column prop="month" label="歸屬月份" width="105" align="center" sortable />
        <el-table-column prop="clientName" label="客戶名稱" width="130" show-overflow-tooltip sortable />
        <el-table-column prop="industry" label="產業類別" width="110" show-overflow-tooltip sortable />
        <el-table-column prop="projectName" label="專案名稱" min-width="140" show-overflow-tooltip sortable />
        <el-table-column prop="productName" label="產品名稱" width="120" show-overflow-tooltip sortable />
        <el-table-column prop="source" label="商機來源" width="110" show-overflow-tooltip sortable />
        <el-table-column prop="clientType" label="屬性" width="90" align="center" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'" round size="small">{{ scope.row.clientType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="狀態" width="170" align="center" sortable>
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)" effect="dark" round size="small">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="合約金額" align="right" width="120" sortable>
          <template #default="scope">$ {{ Number(scope.row.amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="cost" label="成本" align="right" width="110" sortable>
          <template #default="scope">$ {{ Number(scope.row.cost || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="netRevenue" label="實際認列" align="right" width="125" sortable>
          <template #default="scope"><strong style="color: #f28b9c;">$ {{ Number(scope.row.netRevenue || 0).toLocaleString() }}</strong></template>
        </el-table-column>
        <el-table-column prop="expectedDate" label="預計結案日" width="120" align="center" sortable />
        <el-table-column prop="isDualSealCompleted" label="雙用印" width="100" align="center" sortable>
          <template #default="scope">
            <div v-if="Number(scope.row.amount) > 300000 && isWonStatus(scope.row.status)">
              <el-checkbox v-model="scope.row.isDualSealCompleted" @change="(val) => updateDualSeal(scope.row, val)">
                <span :style="{ color: scope.row.isDualSealCompleted ? '#83cbb1' : '#f28b9c', fontWeight: 'bold' }">
                  {{ scope.row.isDualSealCompleted ? '已完成' : '待申請' }}
                </span>
              </el-checkbox>
            </div>
            <span v-else style="color: #a1b5c9; font-size: 12px;">無需</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <div class="table-action-group">
              <el-button type="primary" link size="small" @click="openEditDialog(scope.row)">編輯</el-button>
              <el-popconfirm title="確定要刪除這筆紀錄嗎？" confirm-button-type="danger" width="200" @confirm="handleDelete(scope.row.id)">
                <template #reference><el-button type="danger" link size="small">刪除</el-button></template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 手機版卡片清單 -->
    <div class="mobile-view-only" v-loading="loading">
      <div v-if="filteredTableData.length === 0" style="text-align: center; color: #a1b5c9; padding: 24px;">暫無業績紀錄</div>
      <div v-for="item in filteredTableData" :key="item.id" class="mobile-record-card">
        <div class="m-head">
          <span class="m-month">📅 {{ item.month }}</span>
          <div class="m-tags">
            <el-tag :type="item.clientType === '新客' ? 'primary' : 'success'" size="small">{{ item.clientType }}</el-tag>
            <el-tag :type="getStatusColor(item.status)" effect="dark" size="small">{{ item.status }}</el-tag>
          </div>
        </div>

        <div class="m-body">
          <h4 class="m-client">{{ item.clientName }}</h4>
          <p class="m-desc">專案：{{ item.projectName || '未填寫' }}</p>
          <p class="m-desc" v-if="item.productName">產品：{{ item.productName }}</p>

          <div class="m-revenue-box">
            <span>實際認列：</span>
            <strong class="revenue-val">$ {{ Number(item.netRevenue || 0).toLocaleString() }}</strong>
          </div>

          <div class="m-meta-row">
            <span>合約：${{ Number(item.amount || 0).toLocaleString() }}</span>
            <span v-if="item.cost">成本：${{ Number(item.cost || 0).toLocaleString() }}</span>
          </div>
        </div>

        <div class="m-dual-row" v-if="Number(item.amount) > 300000 && isWonStatus(item.status)">
          <el-checkbox v-model="item.isDualSealCompleted" @change="(val) => updateDualSeal(item, val)">
            雙用印：{{ item.isDualSealCompleted ? '已完成' : '待申請' }}
          </el-checkbox>
        </div>

        <div class="m-footer">
          <el-button type="primary" link size="small" @click="openEditDialog(item)">編輯</el-button>
          <el-popconfirm title="確定刪除此紀錄？" confirm-button-type="danger" width="200" @confirm="handleDelete(item.id)">
            <template #reference><el-button type="danger" link size="small">刪除</el-button></template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 新增 / 編輯對話框 -->
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '編輯業績紀錄' : '新增業績紀錄'" @closed="resetForm">
      <el-form :model="form" :label-position="isMobile ? 'top' : 'left'" label-width="110px">
        <el-form-item label="歸屬月份"><el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" style="width: 100%" /></el-form-item>
        <el-form-item label="客戶屬性">
          <el-radio-group v-model="form.clientType"><el-radio value="新客">新客</el-radio><el-radio value="舊客">舊客</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="客戶名稱"><el-input v-model="form.clientName" placeholder="輸入客戶名稱" /></el-form-item>
        <el-form-item label="產業類別"><el-input v-model="form.industry" placeholder="輸入產業類別" /></el-form-item>
        <el-form-item label="專案名稱"><el-input v-model="form.projectName" placeholder="輸入專案名稱" /></el-form-item>
        <el-form-item label="產品名稱"><el-input v-model="form.productName" placeholder="輸入產品名稱" /></el-form-item>
        <el-form-item label="商機來源"><el-input v-model="form.source" placeholder="例如：官網名單、轉介紹" /></el-form-item>
        
        <!-- 7 個推進狀態選項 -->
        <el-form-item label="推進狀態">
          <el-select v-model="form.status" style="width: 100%">
            <el-option-group label="潛在業績階段">
              <el-option label="A初步洽談" value="A初步洽談" />
              <el-option label="B報價中" value="B報價中" />
              <el-option label="C調整報價" value="C調整報價" />
              <el-option label="D提供合約 (列入潛在業績)" value="D提供合約 (列入潛在業績)" />
            </el-option-group>
            <el-option-group label="結案階段 (列入實際達成)">
              <el-option label="E輸單" value="E輸單" />
              <el-option label="F開發票 (列入實際達成)" value="F開發票 (列入實際達成)" />
            </el-option-group>
            <el-option-group label="失效階段">
              <el-option label="G流單 (不列入計算)" value="G流單 (不列入計算)" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="合約總額"><el-input-number v-model="form.amount" :min="0" :step="10000" style="width: 100%" @change="autoCalculateNet" /></el-form-item>
        <el-form-item label="成本金額"><el-input-number v-model="form.cost" :min="0" :step="1000" style="width: 100%" @change="autoCalculateNet" /></el-form-item>
        <el-form-item label="實際認列"><el-input-number v-model="form.netRevenue" :min="0" :step="10000" style="width: 100%" /></el-form-item>
        <el-form-item label="預計結案日"><el-date-picker v-model="form.expectedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="備註說明"><el-input v-model="form.notes" type="textarea" :rows="2" placeholder="填寫專案備註..." /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">確認儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Download, Search } from '@element-plus/icons-vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditId = ref(null)
const isMobile = ref(false)

const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

const searchForm = reactive({ dateRange: [], clientName: '', clientType: '', status: '' })
const appliedSearch = reactive({ dateRange: [], clientName: '', clientType: '', status: '' })

const defaultForm = {
  month: '',
  clientType: '新客',
  clientName: '',
  industry: '',
  projectName: '',
  productName: '',
  source: '',
  status: 'A初步洽談',
  amount: 0,
  cost: 0,
  netRevenue: 0,
  expectedDate: null,
  notes: '',
  isDualSealCompleted: false
}
const form = reactive({ ...defaultForm })

onMounted(async () => {
  handleResize()
  window.addEventListener('resize', handleResize)
  if (route.query.month) {
    const targetMonth = String(route.query.month)
    searchForm.dateRange = [targetMonth, targetMonth]
    appliedSearch.dateRange = [targetMonth, targetMonth]
  }
  loading.value = true
  await salesStore.fetchAppData()
  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleSearch = () => {
  appliedSearch.dateRange = searchForm.dateRange ? [...searchForm.dateRange] : []
  appliedSearch.clientName = searchForm.clientName
  appliedSearch.clientType = searchForm.clientType
  appliedSearch.status = searchForm.status
}

const resetSearch = () => {
  searchForm.dateRange = []
  searchForm.clientName = ''
  searchForm.clientType = ''
  searchForm.status = ''
  handleSearch()
}

const filteredTableData = computed(() => {
  return salesStore.records.filter(r => {
    const matchDate = (!appliedSearch.dateRange || appliedSearch.dateRange.length !== 2) || (r.month >= appliedSearch.dateRange[0] && r.month <= appliedSearch.dateRange[1])
    const matchName = !appliedSearch.clientName || (r.clientName && r.clientName.includes(appliedSearch.clientName))
    const matchType = !appliedSearch.clientType || r.clientType === appliedSearch.clientType
    const matchStatus = !appliedSearch.status || r.status === appliedSearch.status
    return matchDate && matchName && matchType && matchStatus
  })
})

// 判斷是否為結案狀態（E輸單 / F開發票）
const isWonStatus = (status) => {
  if (!status) return false
  return status.startsWith('E') || status.startsWith('F')
}

const getStatusColor = (status) => {
  if (!status) return 'info'
  if (status.startsWith('E') || status.startsWith('F')) return 'success' // 結案階段
  if (status.startsWith('G')) return 'info'                             // 流單失效
  if (status.startsWith('D')) return 'warning'                          // 提供合約
  return 'primary'                                                     // 洽談 / 報價中
}

const autoCalculateNet = () => {
  form.netRevenue = (Number(form.amount) || 0) - (Number(form.cost) || 0)
}

const openAddDialog = () => {
  isEditMode.value = false
  Object.assign(form, defaultForm)
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEditMode.value = true
  currentEditId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  await salesStore.deleteRecord(id)
  ElMessage.success('已刪除紀錄')
}

const updateDualSeal = async (row, val) => {
  await salesStore.updateRecord(row.id, { ...row, isDualSealCompleted: val })
}

const submitForm = async () => {
  if (!form.clientName || !form.month) return ElMessage.warning('請填寫客戶名稱與歸屬月份')
  submitting.value = true
  if (isEditMode.value) {
    await salesStore.updateRecord(currentEditId.value, { ...form })
  } else {
    await salesStore.addRecord({ ...form })
  }
  submitting.value = false
  dialogVisible.value = false
  ElMessage.success('業績紀錄已成功儲存！')
}

const resetForm = () => {
  Object.assign(form, defaultForm)
}

const exportCSV = () => {
  if (filteredTableData.value.length === 0) return ElMessage.warning('無資料可匯出')
  const headers = ['歸屬月份', '客戶名稱', '產業類別', '專案名稱', '產品名稱', '商機來源', '客戶屬性', '狀態', '合約金額', '成本', '實際認列', '預計結案日', '雙用印完成']
  const rows = filteredTableData.value.map(r => [
    r.month,
    r.clientName,
    r.industry || '',
    r.projectName || '',
    r.productName || '',
    r.source || '',
    r.clientType,
    r.status,
    r.amount,
    r.cost,
    r.netRevenue,
    r.expectedDate || '',
    r.isDualSealCompleted ? '是' : '否'
  ])
  let csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `業績報表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}
</script>

<style scoped>
.records-container { width: 100%; }

.mobile-record-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #e7f5fe;
  box-shadow: 0 2px 10px rgba(140, 187, 241, 0.08);
}
.m-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.m-month { font-size: 13px; font-weight: bold; color: #518de1; }
.m-tags { display: flex; gap: 6px; }
.m-client { margin: 0 0 4px 0; font-size: 17px; color: #334e68; }
.m-desc { margin: 0 0 4px 0; font-size: 13px; color: #8fa4bc; }
.m-revenue-box {
  background: #f8fbff;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin: 8px 0;
}
.revenue-val { color: #f28b9c; font-size: 18px; }
.m-meta-row { display: flex; gap: 15px; font-size: 12px; color: #a1b5c9; }
.m-dual-row { padding: 8px 0; border-top: 1px dashed #f0f7ff; margin-top: 8px; }
.m-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid #f8fbff; }
</style>