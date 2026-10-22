<!-- src/views/SalesRecords.vue -->
<template>
  <div class="records-container">
    <!-- 搜尋條件卡片 -->
    <el-card shadow="never" class="search-card" style="margin-bottom: 16px;">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="進件月份">
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

    <!-- 工具列（新增、匯入、下載範本、匯出） -->
    <div class="action-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增合約專案</el-button>
        <el-button type="primary" plain :icon="Upload" @click="openImportDialog">批次匯入分期 (Excel)</el-button>
        <el-button type="info" plain :icon="Document" @click="downloadTemplate">下載母子分期範本 (.xlsx)</el-button>
      </div>
      <div>
        <el-button type="success" :icon="Download" @click="exportCSV">匯出報表 (CSV)</el-button>
      </div>
    </div>

    <!-- 桌機版表格：支援 row 展開看分期明細 -->
    <div class="desktop-view-only">
      <el-table :data="filteredTableData" border style="width: 100%" v-loading="loading" row-key="id">
        <!-- 展開列：檢視跨月分期明細 -->
        <el-table-column type="expand" width="50">
          <template #default="props">
            <div class="expand-schedule-box">
              <div class="esb-head">
                <span class="esb-title">📅 跨月分期認列進度明細 (共 {{ props.row.schedules?.length || 1 }} 期)</span>
                <span class="esb-sum">合約總額：${{ Number(props.row.amount || 0).toLocaleString() }} ｜ 已排定總額：${{ getSchedulesTotalAmount(props.row.schedules).toLocaleString() }}</span>
              </div>
              <el-table :data="props.row.schedules" border size="small" style="width: 100%; margin-top: 8px;">
                <el-table-column prop="stageName" label="期別名稱" width="160" />
                <el-table-column prop="month" label="認列月份" width="110" align="center" />
                <el-table-column prop="status" label="期別推進狀態" width="180" align="center">
                  <template #default="scope">
                    <el-tag :type="getStatusColor(scope.row.status)" size="small" effect="dark" round>
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="本期金額" align="right" width="130">
                  <template #default="scope">$ {{ Number(scope.row.amount || 0).toLocaleString() }}</template>
                </el-table-column>
                <el-table-column prop="cost" label="本期成本" align="right" width="120">
                  <template #default="scope">$ {{ Number(scope.row.cost || 0).toLocaleString() }}</template>
                </el-table-column>
                <el-table-column prop="netRevenue" label="實際認列" align="right" width="130">
                  <template #default="scope">
                    <strong style="color: #f28b9c;">$ {{ Number(scope.row.netRevenue || 0).toLocaleString() }}</strong>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="month" label="進件月份" width="105" align="center" sortable />
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
        <el-table-column label="分期期數" width="95" align="center">
          <template #default="scope">
            <el-tag size="small" type="info" round>{{ scope.row.schedules?.length || 1 }} 期</el-tag>
          </template>
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
            <span>合約總額：</span>
            <strong class="revenue-val">$ {{ Number(item.amount || 0).toLocaleString() }}</strong>
          </div>

          <div class="m-schedules-list" v-if="item.schedules && item.schedules.length > 0">
            <div class="ms-title">📌 分期認列進度：</div>
            <div v-for="(sch, sIdx) in item.schedules" :key="sIdx" class="ms-item">
              <span>{{ sch.stageName }} ({{ sch.month }})</span>
              <strong>${{ Number(sch.netRevenue || 0).toLocaleString() }}</strong>
            </div>
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

    <!-- 1. 新增 / 編輯對話框 (支援跨月分期) -->
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '編輯合約與分期設定' : '新增合約與分期設定'" width="780px" @closed="resetForm">
      <el-form :model="form" :label-position="isMobile ? 'top' : 'left'" label-width="110px">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="進件月份"><el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="客戶屬性">
              <el-radio-group v-model="form.clientType"><el-radio value="新客">新客</el-radio><el-radio value="舊客">舊客</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="客戶名稱"><el-input v-model="form.clientName" placeholder="輸入客戶名稱" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="產業類別"><el-input v-model="form.industry" placeholder="輸入產業類別" /></el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="專案名稱"><el-input v-model="form.projectName" placeholder="輸入專案名稱" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="產品名稱"><el-input v-model="form.productName" placeholder="輸入產品名稱" /></el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="商機來源"><el-input v-model="form.source" placeholder="例如：官網名單、轉介紹" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="預計結案日"><el-date-picker v-model="form.expectedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="合約總額">
          <el-input-number v-model="form.amount" :min="0" :step="10000" style="width: 100%" @change="onTotalAmountChange" />
        </el-form-item>

        <!-- 跨月分期設定卡片 -->
        <div class="schedules-editor-card">
          <div class="sec-header">
            <div class="sec-left">
              <span class="sec-title">📑 跨月份分期認列規劃 (Schedules)</span>
              <span class="sec-badge">{{ form.schedules.length }} 個期別</span>
            </div>
            <el-button type="primary" size="small" plain @click="addScheduleRow">＋ 新增分期</el-button>
          </div>

          <div v-for="(sch, sIndex) in form.schedules" :key="sch.id || sIndex" class="schedule-input-row">
            <div class="sir-cell" style="flex: 2;">
              <span class="sir-label">期別名稱</span>
              <el-input v-model="sch.stageName" placeholder="例：訂金(30%)" size="small" />
            </div>
            <div class="sir-cell" style="flex: 2;">
              <span class="sir-label">認列月份 *</span>
              <el-date-picker v-model="sch.month" type="month" value-format="YYYY-MM" placeholder="月份" size="small" style="width: 100%" />
            </div>
            <div class="sir-cell" style="flex: 2.5;">
              <span class="sir-label">該期狀態 *</span>
              <el-select v-model="sch.status" size="small" style="width: 100%">
                <el-option label="A初步洽談" value="A初步洽談" />
                <el-option label="B報價中" value="B報價中" />
                <el-option label="C調整報價" value="C調整報價" />
                <el-option label="D提供合約 (列入潛在業績)" value="D提供合約 (列入潛在業績)" />
                <el-option label="E輸單" value="E輸單" />
                <el-option label="F開發票 (列入實際達成)" value="F開發票 (列入實際達成)" />
                <el-option label="G流單 (不列入計算)" value="G流單 (不列入計算)" />
              </el-select>
            </div>
            <div class="sir-cell" style="flex: 2;">
              <span class="sir-label">本期金額 *</span>
              <el-input-number v-model="sch.amount" :min="0" :controls="false" size="small" style="width: 100%" @change="recalcScheduleNet(sch)" />
            </div>
            <div class="sir-cell" style="flex: 1.5;">
              <span class="sir-label">成本</span>
              <el-input-number v-model="sch.cost" :min="0" :controls="false" size="small" style="width: 100%" @change="recalcScheduleNet(sch)" />
            </div>
            <div class="sir-cell" style="flex: 2;">
              <span class="sir-label">實際認列</span>
              <span class="sir-net">$ {{ Number(sch.netRevenue || 0).toLocaleString() }}</span>
            </div>
            <div class="sir-action" v-if="form.schedules.length > 1">
              <el-button type="danger" link size="small" @click="removeScheduleRow(sIndex)">✕</el-button>
            </div>
          </div>

          <!-- 分期平衡檢驗 -->
          <div class="schedules-balance-bar" :class="{ 'is-balanced': isSchedulesBalanced }">
            <span>各期金額加總：<strong>${{ schedulesSumAmount.toLocaleString() }}</strong> / 合約總額：<strong>${{ Number(form.amount || 0).toLocaleString() }}</strong></span>
            <el-tag :type="isSchedulesBalanced ? 'success' : 'danger'" size="small" effect="dark" round>
              {{ isSchedulesBalanced ? '金額已平衡 ✅' : `差額 $${Math.abs(form.amount - schedulesSumAmount).toLocaleString()} ⚠️` }}
            </el-tag>
          </div>
        </div>

        <el-form-item label="備註說明" style="margin-top: 14px;">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="填寫合約與分期備註說明..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">確認儲存</el-button>
      </template>
    </el-dialog>

    <!-- 2. Excel 批次匯入對話框 (支援母子單合併) -->
    <el-dialog v-model="importDialogVisible" title="📤 批次匯入合約與跨月分期 (Excel)" width="580px" @closed="resetImport">
      <div class="import-tip-box">
        <p><strong>💡 母子單匯入規範：</strong></p>
        <p>1. 同一合約若有多個分期，請填寫相同的<strong>「客戶名稱 ＋ 專案名稱」</strong>，系統將自動合併為同一合約下的跨月分期！</p>
        <p>2. 狀態欄位可填完整名稱或<strong>直接填入 A、B、C、D、E、F、G 代碼</strong>。</p>
      </div>

      <el-upload
        ref="uploadRef"
        drag
        action=""
        :auto-upload="false"
        :limit="1"
        accept=".xlsx, .xls"
        :on-change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">將 Excel 拖曳至此處，或<em>點擊選取檔案</em></div>
      </el-upload>

      <div v-if="parsedRecords.length > 0" class="import-preview-box">
        <el-alert
          :title="`成功解析 ${parsedRecords.length} 筆合約（共含 ${parsedTotalSchedules} 個跨月分期認列）！`"
          type="success"
          :closable="false"
          show-icon
        />
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" :disabled="parsedRecords.length === 0" @click="confirmBatchImport">
          確認匯入 ({{ parsedRecords.length }} 筆合約)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Download, Search, Upload, UploadFilled, Document } from '@element-plus/icons-vue'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

const salesStore = useSalesStore()
const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditId = ref(null)
const isMobile = ref(false)

const importDialogVisible = ref(false)
const importing = ref(false)
const parsedRecords = ref([])
const uploadRef = ref(null)

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
  isDualSealCompleted: false,
  schedules: [
    { id: 'sch-1', stageName: '單期全額', month: '', status: 'E輸單', amount: 0, cost: 0, netRevenue: 0 }
  ]
}
const form = reactive({ ...defaultForm })

const STATUS_CODE_MAP = {
  'A': 'A初步洽談',
  'B': 'B報價中',
  'C': 'C調整報價',
  'D': 'D提供合約 (列入潛在業績)',
  'E': 'E輸單',
  'F': 'F開發票 (列入實際達成)',
  'G': 'G流單 (不列入計算)'
}

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
    const matchDate = (!appliedSearch.dateRange || appliedSearch.dateRange.length !== 2) ||
      (r.schedules?.some(s => s.month >= appliedSearch.dateRange[0] && s.month <= appliedSearch.dateRange[1])) ||
      (r.month >= appliedSearch.dateRange[0] && r.month <= appliedSearch.dateRange[1])
    const matchName = !appliedSearch.clientName || (r.clientName && r.clientName.includes(appliedSearch.clientName))
    const matchType = !appliedSearch.clientType || r.clientType === appliedSearch.clientType
    const matchStatus = !appliedSearch.status || r.status === appliedSearch.status
    return matchDate && matchName && matchType && matchStatus
  })
})

const isWonStatus = (status) => status && (status.includes('輸單') || status.includes('開發票'))

const getStatusColor = (status) => {
  if (!status) return 'info'
  if (status.includes('輸單') || status.includes('開發票')) return 'success'
  if (status.includes('流單')) return 'info'
  if (status.includes('提供合約')) return 'warning'
  return 'primary'
}

// 分期加總計算
const schedulesSumAmount = computed(() => {
  return (form.schedules || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
})

const isSchedulesBalanced = computed(() => {
  return Number(form.amount) === schedulesSumAmount.value
})

const onTotalAmountChange = () => {
  if (form.schedules && form.schedules.length === 1) {
    form.schedules[0].amount = form.amount
    recalcScheduleNet(form.schedules[0])
  }
}

const addScheduleRow = () => {
  const nextNum = form.schedules.length + 1
  const remainAmount = Math.max(0, form.amount - schedulesSumAmount.value)
  form.schedules.push({
    id: `sch-${Date.now()}-${nextNum}`,
    stageName: `第 ${nextNum} 期款`,
    month: form.month || '',
    status: form.status || 'E輸單',
    amount: remainAmount,
    cost: 0,
    netRevenue: remainAmount
  })
}

const removeScheduleRow = (idx) => {
  form.schedules.splice(idx, 1)
}

const recalcScheduleNet = (sch) => {
  sch.netRevenue = (Number(sch.amount) || 0) - (Number(sch.cost) || 0)
}

const getSchedulesTotalAmount = (schedules) => {
  return (schedules || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
}

const openAddDialog = () => {
  isEditMode.value = false
  const currentMonth = new Date().toISOString().slice(0, 7)
  Object.assign(form, {
    ...defaultForm,
    month: currentMonth,
    schedules: [
      { id: 'sch-1', stageName: '單期全額', month: currentMonth, status: 'E輸單', amount: 0, cost: 0, netRevenue: 0 }
    ]
  })
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEditMode.value = true
  currentEditId.value = row.id
  Object.assign(form, {
    ...row,
    schedules: (row.schedules && row.schedules.length > 0)
      ? JSON.parse(JSON.stringify(row.schedules))
      : [{ id: 'sch-1', stageName: '單期全額', month: row.month, status: row.status, amount: row.amount, cost: row.cost, netRevenue: row.netRevenue }]
  })
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
  if (!form.clientName || !form.month) return ElMessage.warning('請填寫客戶名稱與合約月份')
  if (!isSchedulesBalanced.value) {
    return ElMessage.warning(`各期金額加總 ($${schedulesSumAmount.value.toLocaleString()}) 與合約總額 ($${Number(form.amount || 0).toLocaleString()}) 不符，請校對平衡！`)
  }

  // 自動彙總母單金額、成本與淨值
  form.cost = form.schedules.reduce((sum, s) => sum + (Number(s.cost) || 0), 0)
  form.netRevenue = form.schedules.reduce((sum, s) => sum + (Number(s.netRevenue) || 0), 0)
  form.status = form.schedules[form.schedules.length - 1].status

  submitting.value = true
  if (isEditMode.value) {
    await salesStore.updateRecord(currentEditId.value, { ...form })
  } else {
    await salesStore.addRecord({ ...form })
  }
  submitting.value = false
  dialogVisible.value = false
  ElMessage.success('業績紀錄與跨月分期已成功儲存！')
}

const resetForm = () => {
  Object.assign(form, defaultForm)
}

// 下載母子分期專用 Excel 範本
const downloadTemplate = () => {
  const wb = XLSX.utils.book_new()
  const headers = [
    '客戶名稱 *', '客戶屬性 *', '專案名稱 *', '產業類別', '產品名稱',
    '商機來源', '合約總額 *', '期別名稱', '認列月份 *', '期別推進狀態(A~G) *',
    '本期金額 *', '本期成本', '本期實際認列 *', '雙用印完成', '備註說明'
  ]

  const sampleData = [
    headers,
    ['台灣積體光電股份有限公司', '新客', '年度智慧廠區弱電升級案', '半導體製造', '智慧物聯監控', '官網名單', 650000, '第一期(訂金30%)', '2026-10', 'E', 195000, 50000, 145000, '是', '首期款已撥付 (合約額>30萬需雙用印)'],
    ['台灣積體光電股份有限公司', '新客', '年度智慧廠區弱電升級案', '半導體製造', '智慧物聯監控', '官網名單', 650000, '第二期(尾款70%)', '2026-12', 'D', 455000, 130000, 325000, '是', '合約審閱中，列入12月樂觀認列'],
    ['大洋國際物流集團', '舊客', '雲端ERP模組擴充', '海空運承攬', '雲端企業版', '客戶續約', 280000, '單期全額', '2026-10', 'E', 280000, 60000, 220000, '否', '單期請款無分期']
  ]

  const ws = XLSX.utils.aoa_to_sheet(sampleData)
  ws['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 26 }, { wch: 15 }, { wch: 18 }, { wch: 14 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws, '分期業績匯入範本')
  XLSX.writeFile(wb, '母子合約跨月分期匯入範本_SPM.xlsx')
  ElMessage.success('已下載母子分期專用範本檔！')
}

// 匯入分期 Excel
const openImportDialog = () => {
  parsedRecords.value = []
  importDialogVisible.value = true
}

const resetImport = () => {
  parsedRecords.value = []
  if (uploadRef.value) uploadRef.value.clearFiles()
}

const parsedTotalSchedules = computed(() => {
  return parsedRecords.value.reduce((sum, r) => sum + (r.schedules?.length || 0), 0)
})

const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      let headerRowIdx = 0
      for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
        const rowStr = (rawRows[i] || []).join(',')
        if (rowStr.includes('客戶') || rowStr.includes('專案')) {
          headerRowIdx = i
          break
        }
      }

      const headers = rawRows[headerRowIdx] || []
      const rows = rawRows.slice(headerRowIdx + 1)

      const findColIdx = (keyword) => headers.findIndex(h => h && String(h).includes(keyword))
      const idxName = findColIdx('客戶名稱')
      const idxType = findColIdx('屬性')
      const idxProject = findColIdx('專案')
      const idxIndustry = findColIdx('產業')
      const idxProduct = findColIdx('產品')
      const idxSource = findColIdx('商機')
      const idxTotalAmount = findColIdx('合約總額')
      const idxStageName = findColIdx('期別')
      const idxMonth = findColIdx('月份')
      const idxStatus = findColIdx('狀態')
      const idxAmount = findColIdx('本期金額')
      const idxCost = findColIdx('本期成本')
      const idxNet = findColIdx('認列')
      const idxDual = findColIdx('雙用印')
      const idxNotes = findColIdx('備註')

      const contractMap = new Map()

      rows.forEach((row) => {
        if (!row || row.length === 0 || row.every(c => c === undefined || c === '')) return

        const clientName = idxName !== -1 ? String(row[idxName] || '').trim() : ''
        const projectName = idxProject !== -1 ? String(row[idxProject] || '').trim() : ''
        if (!clientName) return

        const groupKey = `${clientName}___${projectName}`
        const rawMonth = idxMonth !== -1 ? String(row[idxMonth] || '').trim().slice(0, 7) : ''
        const rawStatus = idxStatus !== -1 ? String(row[idxStatus] || '').trim() : 'E'
        const cleanCode = rawStatus.toUpperCase().charAt(0)
        const status = STATUS_CODE_MAP[cleanCode] || 'E輸單'

        const schAmount = idxAmount !== -1 ? Number(row[idxAmount]) || 0 : 0
        const schCost = idxCost !== -1 ? Number(row[idxCost]) || 0 : 0
        const schNet = idxNet !== -1 ? Number(row[idxNet]) || (schAmount - schCost) : (schAmount - schCost)

        const scheduleItem = {
          id: `sch-${Math.random().toString(36).substr(2, 9)}`,
          stageName: idxStageName !== -1 ? String(row[idxStageName] || '分期款').trim() : '分期款',
          month: rawMonth,
          status,
          amount: schAmount,
          cost: schCost,
          netRevenue: schNet
        }

        if (!contractMap.has(groupKey)) {
          const dualStr = idxDual !== -1 ? String(row[idxDual] || '').trim() : ''
          contractMap.set(groupKey, {
            month: rawMonth,
            clientName,
            clientType: idxType !== -1 && String(row[idxType]).includes('舊') ? '舊客' : '新客',
            projectName,
            industry: idxIndustry !== -1 ? String(row[idxIndustry] || '').trim() : '',
            productName: idxProduct !== -1 ? String(row[idxProduct] || '').trim() : '',
            source: idxSource !== -1 ? String(row[idxSource] || '').trim() : '',
            amount: idxTotalAmount !== -1 ? Number(row[idxTotalAmount]) || 0 : schAmount,
            cost: 0,
            netRevenue: 0,
            status,
            notes: idxNotes !== -1 ? String(row[idxNotes] || '').trim() : '',
            isDualSealCompleted: dualStr === '是' || dualStr.toLowerCase() === 'true',
            schedules: [scheduleItem]
          })
        } else {
          contractMap.get(groupKey).schedules.push(scheduleItem)
        }
      })

      const result = []
      contractMap.forEach(parent => {
        parent.cost = parent.schedules.reduce((sum, s) => sum + s.cost, 0)
        parent.netRevenue = parent.schedules.reduce((sum, s) => sum + s.netRevenue, 0)
        if (!parent.amount || parent.amount === 0) {
          parent.amount = parent.schedules.reduce((sum, s) => sum + s.amount, 0)
        }
        parent.status = parent.schedules[parent.schedules.length - 1].status
        result.push(parent)
      })

      parsedRecords.value = result
      if (result.length > 0) {
        ElMessage.success(`成功解析 ${result.length} 筆合約（共含 ${parsedTotalSchedules.value} 個分期）！`)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('解析 Excel 檔案失敗，請檢查格式')
    }
  }
  reader.readAsArrayBuffer(file)
}

const confirmBatchImport = async () => {
  if (parsedRecords.value.length === 0) return
  importing.value = true
  for (const record of parsedRecords.value) {
    await salesStore.addRecord(record)
  }
  importing.value = false
  importDialogVisible.value = false
  ElMessage.success(`🎉 成功匯入 ${parsedRecords.value.length} 筆合約紀錄！`)
}

const exportCSV = () => {
  if (salesStore.records.length === 0) return ElMessage.warning('無資料可匯出')
  const headers = ['客戶名稱', '客戶屬性', '專案名稱', '合約總額', '期別名稱', '認列月份', '期別狀態', '本期金額', '本期認列毛利', '雙用印完成']
  const rows = []
  salesStore.records.forEach(p => {
    (p.schedules || []).forEach(s => {
      rows.push([
        p.clientName,
        p.clientType,
        p.projectName || '',
        p.amount,
        s.stageName,
        s.month,
        s.status,
        s.amount,
        s.netRevenue,
        p.isDualSealCompleted ? '是' : '否'
      ])
    })
  })
  let csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `合約分期報表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}
</script>

<style scoped>
.records-container { width: 100%; }

.expand-schedule-box {
  background: #f8fbff;
  border: 1px dashed #cde3fd;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 6px 10px;
}
.esb-head { display: flex; justify-content: space-between; align-items: center; }
.esb-title { font-weight: bold; color: #3b6ba8; font-size: 13px; }
.esb-sum { font-size: 12px; color: #6b89a8; }

.schedules-editor-card {
  background: #fdfefe;
  border: 1.5px solid #ddecfe;
  border-radius: 14px;
  padding: 14px;
  margin-top: 10px;
}
.sec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sec-title { font-weight: bold; color: #3d5a80; font-size: 14px; }
.sec-badge { font-size: 11px; background: #eaf3fe; color: #518de1; padding: 2px 8px; border-radius: 10px; margin-left: 6px; }

.schedule-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #f8fbfe;
  border: 1px solid #e7f2fe;
  padding: 8px 10px;
  border-radius: 10px;
  margin-bottom: 8px;
}
.sir-cell { display: flex; flex-direction: column; gap: 4px; }
.sir-label { font-size: 11px; color: #7a94b0; font-weight: bold; }
.sir-net { font-size: 13px; font-weight: bold; color: #f28b9c; height: 28px; display: flex; align-items: center; }
.sir-action { display: flex; align-items: center; height: 28px; }

.schedules-balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff3f5;
  border: 1px dashed #ffd5de;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  color: #d1274c;
  margin-top: 10px;
}
.schedules-balance-bar.is-balanced {
  background: #f0faf4;
  border-color: #c3ebd2;
  color: #217346;
}

.import-tip-box {
  background-color: #f3f8fe;
  border: 1px dashed #c9e1fe;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  color: #4a6583;
  margin-bottom: 16px;
  line-height: 1.6;
}
.import-tip-box p { margin: 2px 0; }
.mobile-record-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  border: 1.5px solid #e7f5fe;
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
.m-schedules-list {
  background: #fafcfe;
  border: 1px dashed #dbeafe;
  border-radius: 8px;
  padding: 8px;
  margin-top: 6px;
  font-size: 12px;
}
.ms-title { font-weight: bold; color: #518de1; margin-bottom: 4px; }
.ms-item { display: flex; justify-content: space-between; color: #555; margin-bottom: 2px; }
.m-dual-row { padding: 8px 0; border-top: 1px dashed #f0f7ff; margin-top: 8px; }
.m-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid #f8fbff; }
</style>