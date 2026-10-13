<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- 1. 頂部檢視模式與日期篩選列 -->
    <el-card shadow="never" class="control-card">
      <div class="control-bar">
        <div class="view-mode-switch">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button value="single">單月檢視</el-radio-button>
            <el-radio-button value="range">區間累計</el-radio-button>
          </el-radio-group>
        </div>

        <div class="date-picker-wrap">
          <template v-if="viewMode === 'single'">
            <span class="picker-label">檢視月份：</span>
            <el-date-picker
              v-model="salesStore.dashboardSingleMonth"
              type="month"
              value-format="YYYY-MM"
              placeholder="選擇月份"
              style="width: 160px;"
            />
          </template>
          <template v-else>
            <span class="picker-label">區間月份：</span>
            <el-date-picker
              v-model="salesStore.dashboardDateRange"
              type="monthrange"
              range-separator="至"
              start-placeholder="開始月份"
              end-placeholder="結束月份"
              value-format="YYYY-MM"
              style="width: 240px;"
            />
          </template>
        </div>
      </div>
    </el-card>

    <!-- 2. 四大核心 KPI 數據卡片 -->
    <div class="kpi-grid">
      <!-- 實際認列 -->
      <el-card shadow="hover" class="kpi-card card-revenue">
        <div class="kpi-head">
          <span>實際認列總額</span>
          <el-tag size="small" type="danger" effect="light">已入帳/開發票</el-tag>
        </div>
        <div class="kpi-main-val text-red">$ {{ currentActualRevenue.toLocaleString() }}</div>
        <div class="kpi-sub">
          <span>目標：${{ currentTargetData.total.toLocaleString() }}</span>
          <span class="rate" :class="{ 'rate-pass': totalAchieveRate >= 100 }">{{ totalAchieveRate }}%</span>
        </div>
      </el-card>

      <!-- 商機管線 Pipeline -->
      <el-card shadow="hover" class="kpi-card card-pipeline">
        <div class="kpi-head">
          <span>商機管線總額 (Pipeline)</span>
          <el-tag size="small" type="primary" effect="light">洽談 / 報價中</el-tag>
        </div>
        <div class="kpi-main-val text-blue">$ {{ currentPipelineRevenue.toLocaleString() }}</div>
        <div class="kpi-sub">
          <span>案件筆數：{{ pipelineCount }} 筆</span>
          <span class="sub-hint">預估潛在營收</span>
        </div>
      </el-card>

      <!-- 新客認列 -->
      <el-card shadow="hover" class="kpi-card card-new">
        <div class="kpi-head">
          <span>新客認列業績</span>
          <el-tag size="small" type="success" effect="light">拓展成效</el-tag>
        </div>
        <div class="kpi-main-val text-green">$ {{ currentNewRevenue.toLocaleString() }}</div>
        <div class="kpi-sub">
          <span>目標：${{ currentTargetData.newClient.toLocaleString() }}</span>
          <span class="rate">{{ newAchieveRate }}%</span>
        </div>
      </el-card>

      <!-- 舊客認列 -->
      <el-card shadow="hover" class="kpi-card card-existing">
        <div class="kpi-head">
          <span>舊客續約/擴單</span>
          <el-tag size="small" type="warning" effect="light">基底支撐</el-tag>
        </div>
        <div class="kpi-main-val text-purple">$ {{ currentExistingRevenue.toLocaleString() }}</div>
        <div class="kpi-sub">
          <span>目標：${{ currentTargetData.existingClient.toLocaleString() }}</span>
          <span class="rate">{{ existingAchieveRate }}%</span>
        </div>
      </el-card>
    </div>

    <!-- 3. 目標達成進度條分析區 -->
    <el-card shadow="hover" class="section-card target-progress-card">
      <template #header>
        <div class="section-title">
          <span>🎯 目標達成率進度追蹤</span>
          <span class="time-badge">{{ viewMode === 'single' ? salesStore.dashboardSingleMonth : `${salesStore.dashboardDateRange[0]} ~ ${salesStore.dashboardDateRange[1]}` }}</span>
        </div>
      </template>

      <div class="progress-list">
        <div class="progress-item">
          <div class="pi-info">
            <span class="pi-name">總業績目標</span>
            <span class="pi-val">${{ currentActualRevenue.toLocaleString() }} / ${{ currentTargetData.total.toLocaleString() }} (實際 {{ totalAchieveRate }}%)</span>
          </div>
          <el-progress :percentage="Math.min(totalAchieveRate, 100)" :stroke-width="14" :color="totalAchieveRate >= 100 ? '#4ab382' : '#518de1'" />
        </div>

        <div class="progress-item">
          <div class="pi-info">
            <span class="pi-name">新客業績目標</span>
            <span class="pi-val">${{ currentNewRevenue.toLocaleString() }} / ${{ currentTargetData.newClient.toLocaleString() }} (實際 {{ newAchieveRate }}%)</span>
          </div>
          <el-progress :percentage="Math.min(newAchieveRate, 100)" :stroke-width="14" color="#4ab382" />
        </div>

        <div class="progress-item">
          <div class="pi-info">
            <span class="pi-name">舊客業績目標</span>
            <span class="pi-val">${{ currentExistingRevenue.toLocaleString() }} / ${{ currentTargetData.existingClient.toLocaleString() }} (實際 {{ existingAchieveRate }}%)</span>
          </div>
          <el-progress :percentage="Math.min(existingAchieveRate, 100)" :stroke-width="14" color="#9c8bf2" />
        </div>
      </div>
    </el-card>

    <!-- 4. 商機推進階段分佈 (Funnel) -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="section-title">📊 商機推進各階段統計 (Funnel)</div>
      </template>
      <div class="status-grid">
        <div v-for="st in stageSummary" :key="st.name" class="status-card" :class="st.class">
          <div class="st-header">
            <span class="st-name">{{ st.name }}</span>
            <span class="st-count">{{ st.count }} 件</span>
          </div>
          <div class="st-amount">$ {{ st.amount.toLocaleString() }}</div>
        </div>
      </div>
    </el-card>

    <!-- ======================================================== -->
    <!-- 5. 核心列表區：區間累計各月達成率 VS 單月案件明細 -->
    <!-- ======================================================== -->

    <!-- 【模式 A：區間累計】(無排序、雙用印清單不顯示) -->
    <el-card v-if="viewMode === 'range'" shadow="hover" class="section-card">
      <template #header>
        <div class="section-title">
          <span>📈 區間各月份業績達成分析 ({{ salesStore.dashboardDateRange[0] }} ~ {{ salesStore.dashboardDateRange[1] }})</span>
          <span class="time-badge">共 {{ monthlyBreakdown.length }} 個月份</span>
        </div>
      </template>

      <!-- 桌機版：三區塊獨立底色、無排序 -->
      <div class="desktop-view-only table-scroll-wrap">
        <el-table :data="monthlyBreakdown" border style="width: 100%" size="small" class="colored-breakdown-table">
          <el-table-column prop="month" label="月份" width="95" align="center" fixed="left" class-name="col-month">
            <template #default="scope"><strong>{{ scope.row.month }}</strong></template>
          </el-table-column>

          <!-- 1. 總體業績指標 (5 欄，淺藍底色，無排序) -->
          <el-table-column label="總體業績指標" align="center" class-name="header-total-group">
            <el-table-column prop="totalTarget" label="總目標" align="right" width="115" class-name="col-total">
              <template #default="scope">$ {{ scope.row.totalTarget.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="totalActual" label="目前實際達成" align="right" width="115" class-name="col-total">
              <template #default="scope">
                <strong style="color: #f28b9c;">$ {{ scope.row.totalActual.toLocaleString() }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="totalActualRate" label="實際達成率" align="center" width="95" class-name="col-total">
              <template #default="scope">
                <el-tag :type="scope.row.totalActualRate >= 100 ? 'success' : (scope.row.totalActualRate >= 70 ? 'primary' : 'warning')" size="small" effect="dark" round>
                  {{ scope.row.totalActualRate }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalOpt" label="樂觀達成" align="right" width="115" class-name="col-total">
              <template #default="scope">$ {{ scope.row.totalOpt.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="totalOptRate" label="樂觀達成率" align="center" width="95" class-name="col-total">
              <template #default="scope">
                <span class="rate-optimistic">{{ scope.row.totalOptRate }}%</span>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 2. 新客指標 (5 欄，淺綠底色，無排序) -->
          <el-table-column label="新客指標" align="center" class-name="header-new-group">
            <el-table-column prop="newTarget" label="目標" align="right" width="110" class-name="col-new">
              <template #default="scope">$ {{ scope.row.newTarget.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="newActual" label="目前實際達成" align="right" width="115" class-name="col-new">
              <template #default="scope">
                <span style="color: #2e8b57; font-weight: bold;">$ {{ scope.row.newActual.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="newActualRate" label="實際達成率" align="center" width="105" class-name="col-new">
              <template #default="scope">
                <span :style="{ color: scope.row.newActualRate >= 100 ? '#2e8b57' : '#518de1', fontWeight: 'bold' }">{{ scope.row.newActualRate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="newOpt" label="樂觀達成" align="right" width="110" class-name="col-new">
              <template #default="scope">$ {{ scope.row.newOpt.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="newOptRate" label="樂觀達成率" align="center" width="105" class-name="col-new">
              <template #default="scope">
                <span class="rate-optimistic">{{ scope.row.newOptRate }}%</span>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 3. 舊客指標 (5 欄，淺紫底色，無排序) -->
          <el-table-column label="舊客指標" align="center" class-name="header-existing-group">
            <el-table-column prop="existingTarget" label="目標" align="right" width="110" class-name="col-existing">
              <template #default="scope">$ {{ scope.row.existingTarget.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="existingActual" label="目前實際達成" align="right" width="115" class-name="col-existing">
              <template #default="scope">
                <span style="color: #6a4fb8; font-weight: bold;">$ {{ scope.row.existingActual.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="existingActualRate" label="實際達成率" align="center" width="105" class-name="col-existing">
              <template #default="scope">
                <span :style="{ color: scope.row.existingActualRate >= 100 ? '#6a4fb8' : '#518de1', fontWeight: 'bold' }">{{ scope.row.existingActualRate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="existingOpt" label="樂觀達成" align="right" width="110" class-name="col-existing">
              <template #default="scope">$ {{ scope.row.existingOpt.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="existingOptRate" label="樂觀達成率" align="center" width="105" class-name="col-existing">
              <template #default="scope">
                <span class="rate-optimistic">{{ scope.row.existingOptRate }}%</span>
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>
      </div>

      <!-- 手機版：各月份達成率卡片 -->
      <div class="mobile-view-only">
        <div v-for="item in monthlyBreakdown" :key="item.month" class="mobile-month-analysis-card">
          <div class="mma-head">
            <span class="mma-month">📅 {{ item.month }}</span>
            <div class="mma-badge-group">
              <el-tag size="small" :type="item.totalActualRate >= 100 ? 'success' : 'primary'" effect="dark" round>
                實際 {{ item.totalActualRate }}%
              </el-tag>
              <el-tag size="small" type="warning" effect="plain" round>
                樂觀 {{ item.totalOptRate }}%
              </el-tag>
            </div>
          </div>

          <div class="mma-section mma-section-total">
            <div class="mma-title-row">
              <span class="sec-label">總體業績</span>
              <span class="sec-target">總目標：${{ item.totalTarget.toLocaleString() }}</span>
            </div>
            <div class="mma-data-row">
              <div>目前實際達成：<strong class="text-red">${{ item.totalActual.toLocaleString() }}</strong></div>
              <div>樂觀達成：<strong>${{ item.totalOpt.toLocaleString() }}</strong></div>
            </div>
          </div>

          <div class="mma-grid">
            <div class="mma-col col-new">
              <div class="col-head">
                <span>🌱 新客</span>
                <span class="col-rates">{{ item.newActualRate }}% / {{ item.newOptRate }}%</span>
              </div>
              <div class="col-item">目標：${{ item.newTarget.toLocaleString() }}</div>
              <div class="col-item text-green">實際：${{ item.newActual.toLocaleString() }}</div>
              <div class="col-item">樂觀：${{ item.newOpt.toLocaleString() }}</div>
            </div>

            <div class="mma-col col-existing">
              <div class="col-head">
                <span>🤝 舊客</span>
                <span class="col-rates">{{ item.existingActualRate }}% / {{ item.existingOptRate }}%</span>
              </div>
              <div class="col-item">目標：${{ item.existingTarget.toLocaleString() }}</div>
              <div class="col-item text-purple">實際：${{ item.existingActual.toLocaleString() }}</div>
              <div class="col-item">樂觀：${{ item.existingOpt.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 【模式 B：單月檢視】展示當月案件推進明細列表 (僅屬性、狀態、金額、實際認列可排序) -->
    <template v-else>
      <el-card shadow="hover" class="section-card">
        <template #header>
          <div class="section-title">
            <span>📋 {{ salesStore.dashboardSingleMonth }} 當期案件推進明細 (共 {{ currentRecords.length }} 筆)</span>
            <el-button type="primary" link size="small" @click="goToRecordsWithMonth">前往完整總表 ➔</el-button>
          </div>
        </template>

        <!-- 桌機版表格 -->
        <div class="desktop-view-only">
          <el-table :data="currentRecords" border style="width: 100%">
            <el-table-column prop="month" label="歸屬月份" width="105" align="center" />
            <el-table-column prop="clientName" label="客戶名稱" width="130" show-overflow-tooltip />
            <el-table-column prop="projectName" label="專案名稱" min-width="140" show-overflow-tooltip />
            <!-- 排序欄位 1: 屬性 -->
            <el-table-column prop="clientType" label="屬性" width="90" align="center" sortable>
              <template #default="scope">
                <el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'" round size="small">{{ scope.row.clientType }}</el-tag>
              </template>
            </el-table-column>
            <!-- 排序欄位 2: 狀態 -->
            <el-table-column prop="status" label="狀態" width="130" align="center" sortable>
              <template #default="scope">
                <el-tag :type="getStatusColor(scope.row.status)" effect="dark" round size="small">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <!-- 排序欄位 3: 合約金額 -->
            <el-table-column prop="amount" label="合約金額" align="right" width="120" sortable>
              <template #default="scope">$ {{ scope.row.amount.toLocaleString() }}</template>
            </el-table-column>
            <!-- 排序欄位 4: 實際認列 -->
            <el-table-column prop="netRevenue" label="實際認列" align="right" width="125" sortable>
              <template #default="scope">
                <strong style="color: #f28b9c;">$ {{ scope.row.netRevenue.toLocaleString() }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="雙用印" width="100" align="center">
              <template #default="scope">
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
          </el-table>
        </div>

        <!-- 手機版卡片 -->
        <div class="mobile-view-only">
          <div v-if="currentRecords.length === 0" style="text-align: center; color: #a1b5c9; padding: 20px;">當期暫無任何案件資料</div>
          <div v-for="item in currentRecords" :key="item.id" class="mobile-dash-record-card">
            <div class="mdrc-top">
              <span class="mdrc-month">📅 {{ item.month }}</span>
              <div class="mdrc-tags">
                <el-tag :type="item.clientType === '新客' ? 'primary' : 'success'" size="small">{{ item.clientType }}</el-tag>
                <el-tag :type="getStatusColor(item.status)" effect="dark" size="small">{{ item.status }}</el-tag>
              </div>
            </div>
            <h4 class="mdrc-client">{{ item.clientName }}</h4>
            <p class="mdrc-project">專案：{{ item.projectName || '未填寫' }}</p>
            <div class="mdrc-revenue-box">
              <span>實際認列：</span>
              <strong class="revenue-val">$ {{ item.netRevenue.toLocaleString() }}</strong>
            </div>
            <div class="mdrc-sub">合約金額：${{ item.amount.toLocaleString() }}</div>
            <div class="mdrc-dual" v-if="item.amount > 300000 && item.status.includes('E輸單')">
              <el-checkbox v-model="item.isDualSealCompleted" @change="(val) => updateDualSeal(item, val)">
                雙用印：{{ item.isDualSealCompleted ? '已完成' : '待申請' }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 6. 雙用印待辦追蹤專區 (移至單月檢視最下方) -->
      <el-card shadow="hover" class="section-card alert-card">
        <template #header>
          <div class="section-title text-alert">
            <span>⚠️ 30 萬以上合約雙用印追蹤清單</span>
            <el-tag type="danger" size="small">{{ pendingDualSeals.length }} 件待辦</el-tag>
          </div>
        </template>

        <div v-if="pendingDualSeals.length === 0" class="empty-seal">
          🎉 太棒了！目前沒有未完成雙用印的高額合約。
        </div>

        <div v-else class="desktop-view-only">
          <el-table :data="pendingDualSeals" border size="small">
            <el-table-column prop="month" label="月份" width="100" align="center" />
            <el-table-column prop="clientName" label="客戶名稱" width="140" />
            <el-table-column prop="projectName" label="專案名稱" min-width="160" />
            <el-table-column prop="amount" label="合約金額" align="right" width="130">
              <template #default="scope">
                <strong style="color: #f28b9c;">$ {{ scope.row.amount.toLocaleString() }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="雙用印狀態" width="130" align="center">
              <template #default="scope">
                <el-checkbox v-model="scope.row.isDualSealCompleted" @change="(val) => updateDualSeal(scope.row, val)">
                  {{ scope.row.isDualSealCompleted ? '已完成' : '立即標記完成' }}
                </el-checkbox>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="pendingDualSeals.length > 0" class="mobile-view-only">
          <div v-for="item in pendingDualSeals" :key="item.id" class="mobile-dual-card">
            <div class="mdc-head">
              <span class="mdc-month">📅 {{ item.month }}</span>
              <span class="mdc-amount">$ {{ item.amount.toLocaleString() }}</span>
            </div>
            <div class="mdc-client">{{ item.clientName }}</div>
            <div class="mdc-project">專案：{{ item.projectName || '未填寫' }}</div>
            <div class="mdc-check">
              <el-checkbox v-model="item.isDualSealCompleted" @change="(val) => updateDualSeal(item, val)">
                標記雙用印已完成
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const router = useRouter()

// 需求 1: 預設為單月檢視
const viewMode = ref('single')

// 依檢視模式切換業績記錄清單
const currentRecords = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleFilteredRecords : salesStore.filteredRecords
})

// 依檢視模式切換目標
const currentTargetData = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleTarget : salesStore.currentTarget
})

// 營收數值
const currentActualRevenue = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleActualRevenue : salesStore.actualRevenue
})
const currentPipelineRevenue = computed(() => {
  return viewMode.value === 'single' ? salesStore.singlePipelineRevenue : salesStore.pipelineRevenue
})
const currentNewRevenue = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleNewClientRevenue : salesStore.newClientRevenue
})
const currentExistingRevenue = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleExistingClientRevenue : salesStore.existingClientRevenue
})

// 達成率計算輔助函式
const calcRate = (val, target) => {
  if (!target || target === 0) return 0
  return Math.round((val / target) * 100)
}

const totalAchieveRate = computed(() => calcRate(currentActualRevenue.value, currentTargetData.value.total))
const newAchieveRate = computed(() => calcRate(currentNewRevenue.value, currentTargetData.value.newClient))
const existingAchieveRate = computed(() => calcRate(currentExistingRevenue.value, currentTargetData.value.existingClient))

// 狀態標籤顏色
const getStatusColor = (status) => {
  if (status.includes('輸單') || status.includes('開發票')) return 'success'
  if (status.includes('流單')) return 'info'
  return 'warning'
}

// Pipeline 筆數
const pipelineCount = computed(() => {
  return currentRecords.value.filter(r => r.status.includes('洽談') || r.status.includes('報價') || r.status.includes('提供合約')).length
})

// 推進階段摘要 (Funnel)
const stageSummary = computed(() => {
  const stages = [
    { name: 'A初步洽談', class: 'st-talk' },
    { name: 'B報價中', class: 'st-quote' },
    { name: 'E輸單(已簽約)', class: 'st-won' },
    { name: 'F開發票', class: 'st-invoice' },
    { name: 'G流單', class: 'st-lost' }
  ]
  return stages.map(s => {
    const list = currentRecords.value.filter(r => r.status.includes(s.name.slice(0, 2)))
    const amount = list.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    return { name: s.name, count: list.length, amount, class: s.class }
  })
})

// 30 萬以上且未雙用印清單
const pendingDualSeals = computed(() => {
  return currentRecords.value.filter(r => Number(r.amount) > 300000 && r.status.includes('輸單') && !r.isDualSealCompleted)
})

// 需求 4: 點前往完整總表時，自動帶入該月份參數
const goToRecordsWithMonth = () => {
  router.push({
    path: '/records',
    query: { month: salesStore.dashboardSingleMonth }
  })
}

// 區間內月份列表
const monthsInRange = computed(() => {
  if (!salesStore.dashboardDateRange || salesStore.dashboardDateRange.length !== 2) return []
  const [start, end] = salesStore.dashboardDateRange
  const [startYear, startM] = start.split('-').map(Number)
  const [endYear, endM] = end.split('-').map(Number)
  const result = []

  let curYear = startYear
  let curMonth = startM
  while (curYear < endYear || (curYear === endYear && curMonth <= endM)) {
    const mStr = String(curMonth).padStart(2, '0')
    result.push(`${curYear}-${mStr}`)
    curMonth++
    if (curMonth > 12) {
      curMonth = 1
      curYear++
    }
  }
  return result
})

const monthlyBreakdown = computed(() => {
  return monthsInRange.value.map(m => {
    const target = salesStore.targets[m] || { total: 0, newClient: 0, existingClient: 0 }
    const monthRecords = salesStore.records.filter(r => r.month === m)

    const actualRecords = monthRecords.filter(r => r.status.includes('輸單') || r.status.includes('開發票'))
    const pipelineRecords = monthRecords.filter(r => r.status.includes('洽談') || r.status.includes('報價') || r.status.includes('提供合約'))

    const totalActual = actualRecords.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const totalPipeline = pipelineRecords.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const totalOpt = totalActual + totalPipeline

    const newTarget = Number(target.newClient) || 0
    const newActual = actualRecords.filter(r => r.clientType === '新客').reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const newPipeline = pipelineRecords.filter(r => r.clientType === '新客').reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const newOpt = newActual + newPipeline

    const existingTarget = Number(target.existingClient) || 0
    const existingActual = actualRecords.filter(r => r.clientType === '舊客').reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const existingPipeline = pipelineRecords.filter(r => r.clientType === '舊客').reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const existingOpt = existingActual + existingPipeline

    const totalTarget = Number(target.total) || 0

    return {
      month: m,
      totalTarget,
      totalActual,
      totalActualRate: calcRate(totalActual, totalTarget),
      totalOpt,
      totalOptRate: calcRate(totalOpt, totalTarget),

      newTarget,
      newActual,
      newActualRate: calcRate(newActual, newTarget),
      newOpt,
      newOptRate: calcRate(newOpt, newTarget),

      existingTarget,
      existingActual,
      existingActualRate: calcRate(existingActual, existingTarget),
      existingOpt,
      existingOptRate: calcRate(existingOpt, existingTarget)
    }
  })
})

const updateDualSeal = async (record, val) => {
  await salesStore.updateRecord(record.id, { ...record, isDualSealCompleted: val })
  ElMessage.success('已更新雙用印狀態！')
}
</script>

<style scoped>
.dashboard-container { width: 100%; }

/* 控制列 */
.control-card { margin-bottom: 16px; border-radius: 14px; }
.control-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.date-picker-wrap { display: flex; align-items: center; gap: 8px; font-weight: bold; color: #4a6583; }

/* 核心指標網格 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-card { border-radius: 16px; border: 1px solid #e7f5fe; }
.kpi-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: bold; color: #6b89a8; margin-bottom: 8px; }
.kpi-main-val { font-size: 26px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
.kpi-sub { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #8fa4bc; }
.rate { font-weight: bold; color: #518de1; font-size: 13px; }
.rate-pass { color: #4ab382; }

.text-red { color: #f28b9c; }
.text-blue { color: #518de1; }
.text-green { color: #4ab382; }
.text-purple { color: #9c8bf2; }
.rate-optimistic { color: #e6a23c; font-weight: bold; }

/* 區塊卡片通則 */
.section-card { border-radius: 16px; margin-bottom: 16px; border: 1px solid #e7f5fe; }
.section-title { font-weight: bold; font-size: 15px; color: #4a6583; display: flex; justify-content: space-between; align-items: center; }
.time-badge { font-size: 12px; color: #518de1; font-weight: normal; background: #e7f5fe; padding: 2px 8px; border-radius: 10px; }

/* 進度條清單 */
.progress-list { display: flex; flex-direction: column; gap: 16px; }
.pi-info { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-weight: bold; color: #4a6583; }
.pi-val { color: #8fa4bc; font-size: 12px; }

/* 漏斗階段網格 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}
.status-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid #e7f5fe;
}
.st-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: #6b89a8; margin-bottom: 6px; }
.st-count { background: #fff; padding: 1px 6px; border-radius: 8px; font-size: 11px; }
.st-amount { font-size: 17px; font-weight: bold; color: #4a6583; }

/* 雙用印警示 */
.text-alert { color: #d9534f; }
.empty-seal { text-align: center; color: #4ab382; font-weight: bold; padding: 16px; }
.mobile-dual-card {
  background: #fff8f8;
  border: 1px solid #fedfe2;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}
.mdc-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 6px; }
.mdc-month { font-weight: bold; color: #d9534f; }
.mdc-amount { font-weight: bold; color: #f28b9c; font-size: 15px; }
.mdc-client { font-size: 15px; font-weight: bold; color: #4a6583; }
.mdc-project { font-size: 12px; color: #8fa4bc; margin: 4px 0 8px 0; }
.mdc-check { padding-top: 6px; border-top: 1px dashed #fedfe2; }

/* 桌機橫向捲軸封裝 */
.table-scroll-wrap {
  width: 100%;
  overflow-x: auto;
}

/* ========================================================
   區間累計各月達成率 - 三大區塊獨立底色樣式 (桌機表格)
   ======================================================== */
:deep(.colored-breakdown-table th.col-month),
:deep(.colored-breakdown-table td.col-month) {
  background-color: #ffffff !important;
}

/* 1. 總體指標區塊 (淺藍色調) */
:deep(.colored-breakdown-table th.header-total-group),
:deep(.colored-breakdown-table th.col-total) {
  background-color: #e4f1fc !important;
  color: #2b5683 !important;
  font-weight: bold;
}
:deep(.colored-breakdown-table td.col-total) {
  background-color: #f2f8fe !important;
}

/* 2. 新客指標區塊 (淺綠色調) */
:deep(.colored-breakdown-table th.header-new-group),
:deep(.colored-breakdown-table th.col-new) {
  background-color: #e1f6e9 !important;
  color: #216942 !important;
  font-weight: bold;
}
:deep(.colored-breakdown-table td.col-new) {
  background-color: #f2faf5 !important;
}

/* 3. 舊客指標區塊 (淺紫色調) */
:deep(.colored-breakdown-table th.header-existing-group),
:deep(.colored-breakdown-table th.col-existing) {
  background-color: #eee8fc !important;
  color: #51368b !important;
  font-weight: bold;
}
:deep(.colored-breakdown-table td.col-existing) {
  background-color: #f7f4fe !important;
}

/* 手機版卡片 */
.mobile-month-analysis-card {
  background: #ffffff;
  border: 1px solid #e7f5fe;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(140, 187, 241, 0.08);
}
.mma-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.mma-month { font-size: 16px; font-weight: bold; color: #4a6583; }
.mma-badge-group { display: flex; gap: 6px; }

.mma-section-total {
  background: #f2f8fe;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border: 1px solid #dbeafe;
}
.mma-title-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: bold; color: #2b5683; }
.sec-target { font-size: 12px; color: #64748b; font-weight: normal; }
.mma-data-row { display: flex; justify-content: space-between; font-size: 14px; }

.mma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mma-col {
  border-radius: 10px;
  padding: 10px;
  font-size: 12px;
}
.mma-col.col-new {
  background: #f2faf5;
  border: 1px solid #d1fae5;
}
.mma-col.col-existing {
  background: #f7f4fe;
  border: 1px solid #ede9fe;
}
.col-head { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px; }
.col-rates { color: #518de1; font-size: 11px; }
.col-item { margin-bottom: 3px; color: #555; }

/* 當期案件手機卡片 */
.mobile-dash-record-card {
  background: #ffffff;
  border: 1px solid #e7f5fe;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(140, 187, 241, 0.08);
}
.mdrc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.mdrc-month { font-size: 13px; font-weight: bold; color: #518de1; }
.mdrc-tags { display: flex; gap: 6px; }
.mdrc-client { margin: 0 0 4px 0; font-size: 16px; color: #334e68; }
.mdrc-project { margin: 0 0 8px 0; font-size: 13px; color: #8fa4bc; }
.mdrc-revenue-box {
  background: #f8fbff;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 4px;
}
.revenue-val { color: #f28b9c; font-size: 17px; font-weight: bold; }
.mdrc-sub { font-size: 12px; color: #a1b5c9; margin-bottom: 6px; }
.mdrc-dual { padding-top: 6px; border-top: 1px dashed #f0f7ff; }

/* 視圖切換 classes */
.desktop-view-only { display: block; }
.mobile-view-only { display: none; }

/* 768px 手機專屬斷點 */
@media screen and (max-width: 768px) {
  .desktop-view-only { display: none !important; }
  .mobile-view-only { display: block !important; }

  .control-bar { flex-direction: column; align-items: stretch; }
  .view-mode-switch { width: 100%; display: flex; }
  .view-mode-switch :deep(.el-radio-group) { width: 100%; display: flex; }
  .view-mode-switch :deep(.el-radio-button) { flex: 1; text-align: center; }
  .view-mode-switch :deep(.el-radio-button__inner) { width: 100%; }

  .date-picker-wrap { justify-content: space-between; }
  .date-picker-wrap :deep(.el-date-editor) { flex: 1; }

  .kpi-grid { grid-template-columns: 1fr; gap: 12px; }
  .kpi-main-val { font-size: 22px; }

  .status-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .status-card { padding: 10px; }
  .st-amount { font-size: 15px; }
}
</style>