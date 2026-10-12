<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <el-tabs v-model="activeTab" class="dashboard-tabs" type="border-card">
      
      <!-- ========================================== -->
      <!-- 區塊 1：單月詳細狀態查詢 -->
      <!-- ========================================== -->
      <el-tab-pane label="🔍 單月詳細狀態" name="single">
        <div class="filter-section">
          <span class="filter-label">選擇查詢月份：</span>
          <el-date-picker
            v-model="salesStore.dashboardSingleMonth"
            type="month"
            placeholder="選擇單一月份"
            value-format="YYYY-MM"
            :clearable="false"
            style="width: 200px;"
          />
        </div>

        <el-row :gutter="20" class="kpi-row">
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card target">
              <div class="kpi-title">🏆 {{ salesStore.dashboardSingleMonth }} 目標</div>
              <div class="kpi-value">$ {{ salesStore.singleTarget.total.toLocaleString() }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card actual">
              <div class="kpi-title">✅ 單月實際達成</div>
              <div class="kpi-value">$ {{ salesStore.singleActualRevenue.toLocaleString() }}</div>
              <div class="kpi-sub">
                達成率: {{ salesStore.singleTarget.total ? ((salesStore.singleActualRevenue / salesStore.singleTarget.total) * 100).toFixed(1) : 0 }}%
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card gap">
              <div class="kpi-title">📉 單月目標差距</div>
              <div class="kpi-value">
                $ {{ Math.max(salesStore.singleTarget.total - salesStore.singleActualRevenue, 0).toLocaleString() }}
              </div>
              <div class="kpi-sub gap-details">
                <span>🆕 缺口: ${{ Math.max(salesStore.singleTarget.newClient - salesStore.singleNewClientRevenue, 0).toLocaleString() }}</span>
                <span>♻️ 缺口: ${{ Math.max(salesStore.singleTarget.existingClient - salesStore.singleExistingClientRevenue, 0).toLocaleString() }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card pipeline">
              <div class="kpi-title">🔮 單月潛在商機</div>
              <div class="kpi-value">$ {{ salesStore.singlePipelineRevenue.toLocaleString() }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">📋 {{ salesStore.dashboardSingleMonth }} 業績詳細明細</div>
          </template>
          <!-- 加入 sortable 與對應的 prop -->
          <el-table :data="salesStore.singleFilteredRecords" style="width: 100%" border stripe>
            <el-table-column prop="clientName" label="客戶名稱" width="150" sortable />
            <el-table-column prop="productName" label="產品名稱" sortable />
            <el-table-column prop="clientType" label="屬性" width="100" align="center" sortable>
              <template #default="scope">
                <el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'" size="small">{{ scope.row.clientType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="狀態" width="140" align="center" sortable>
              <template #default="scope">
                <el-tag :type="getStatusColor(scope.row.status)" effect="plain" size="small">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="合約金額" align="right" sortable>
              <template #default="scope">$ {{ scope.row.amount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="netRevenue" label="實際認列" align="right" sortable>
              <template #default="scope"><strong style="color: #f56c6c;">$ {{ scope.row.netRevenue.toLocaleString() }}</strong></template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ========================================== -->
      <!-- 區塊 2：區間圖表與總表分析 -->
      <!-- ========================================== -->
      <el-tab-pane label="📊 區間圖表與總表分析" name="range">
        <div class="filter-section">
          <span class="filter-label">查詢區間：</span>
          <el-date-picker
            v-model="salesStore.dashboardDateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="開始月份"
            end-placeholder="結束月份"
            value-format="YYYY-MM"
            :clearable="false"
            style="width: 300px;"
          />
        </div>

        <el-row :gutter="20" class="kpi-row">
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card target">
              <div class="kpi-title">🏆 區間總目標</div>
              <div class="kpi-value">$ {{ salesStore.currentTarget.total.toLocaleString() }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card actual">
              <div class="kpi-title">✅ 區間實際達成</div>
              <div class="kpi-value">$ {{ salesStore.actualRevenue.toLocaleString() }}</div>
              <div class="kpi-sub">
                達成率: {{ salesStore.currentTarget.total ? ((salesStore.actualRevenue / salesStore.currentTarget.total) * 100).toFixed(1) : 0 }}%
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card gap">
              <div class="kpi-title">📉 區間目標差距</div>
              <div class="kpi-value">
                $ {{ Math.max(salesStore.currentTarget.total - salesStore.actualRevenue, 0).toLocaleString() }}
              </div>
              <div class="kpi-sub gap-details">
                <span>🆕 缺口: ${{ Math.max(salesStore.currentTarget.newClient - salesStore.newClientRevenue, 0).toLocaleString() }}</span>
                <span>♻️ 缺口: ${{ Math.max(salesStore.currentTarget.existingClient - salesStore.existingClientRevenue, 0).toLocaleString() }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="kpi-card pipeline">
              <div class="kpi-title">🔮 區間潛在商機</div>
              <div class="kpi-value">$ {{ salesStore.pipelineRevenue.toLocaleString() }}</div>
              <div class="kpi-sub">
                預估落點: $ {{ (salesStore.actualRevenue + salesStore.pipelineRevenue).toLocaleString() }}
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header><div class="card-header">🤝 區間：新客 vs 舊客 業績佔比</div></template>
              <div class="chart-wrapper"><v-chart class="chart" :option="pieOption" autoresize /></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header><div class="card-header">🚀 區間：業績達成進度分析</div></template>
              <div class="chart-wrapper"><v-chart class="chart" :option="barOption" autoresize /></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 區間各月份總表 -->
        <el-row style="margin-top: 20px;">
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header" v-if="salesStore.dashboardDateRange">
                  📅 {{ salesStore.dashboardDateRange[0] }} 至 {{ salesStore.dashboardDateRange[1] }} 各月份業績總表
                </div>
              </template>
              <el-table :data="rangeSummaryData" style="width: 100%" border stripe>
                <el-table-column prop="month" label="月份" width="120" align="center">
                  <template #default="scope"><strong>{{ scope.row.month }}</strong></template>
                </el-table-column>
                <el-table-column label="總目標" align="right">
                  <template #default="scope">$ {{ scope.row.targetTotal.toLocaleString() }}</template>
                </el-table-column>
                <el-table-column label="實際總達成" align="right">
                  <template #default="scope">$ {{ scope.row.actualTotal.toLocaleString() }}</template>
                </el-table-column>
                <el-table-column label="新客達成" align="right">
                  <template #default="scope"><span style="color: #409EFF">$ {{ scope.row.actualNew.toLocaleString() }}</span></template>
                </el-table-column>
                <el-table-column label="舊客達成" align="right">
                  <template #default="scope"><span style="color: #67C23A">$ {{ scope.row.actualOld.toLocaleString() }}</span></template>
                </el-table-column>
                <el-table-column label="總達成率" align="right" width="120">
                  <template #default="scope">
                    <el-tag :type="scope.row.rate >= 100 ? 'success' : (scope.row.rate > 0 ? 'warning' : 'info')">
                      {{ scope.row.rate }}%
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSalesStore } from '../stores/salesStore'

const salesStore = useSalesStore()
const activeTab = ref('single')

const getStatusColor = (status) => {
  if (status.includes('輸單') || status.includes('開發票')) return 'success'
  if (status.includes('流單')) return 'info'
  return 'warning'
}

// 根據 dashboardDateRange 自動產生區間內的所有月份資料
const rangeSummaryData = computed(() => {
  if (!salesStore.dashboardDateRange || salesStore.dashboardDateRange.length !== 2) return []
  
  const [startStr, endStr] = salesStore.dashboardDateRange
  let [startYear, startMonth] = startStr.split('-').map(Number)
  const [endYear, endMonth] = endStr.split('-').map(Number)
  
  const data = []
  
  while (startYear < endYear || (startYear === endYear && startMonth <= endMonth)) {
    const monthStr = `${startYear}-${String(startMonth).padStart(2, '0')}`
    
    const target = salesStore.targets[monthStr] || { total: 0, newClient: 0, existingClient: 0 }
    const monthRecords = salesStore.records.filter(r => r.month === monthStr)
    const actualTotal = monthRecords.filter(r => r.status.includes('輸單') || r.status.includes('開發票')).reduce((sum, r) => sum + r.netRevenue, 0)
    const actualNew = monthRecords.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0)
    const actualOld = monthRecords.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0)
    
    data.push({
      month: monthStr, targetTotal: target.total, actualTotal, actualNew, actualOld,
      rate: target.total ? ((actualTotal / target.total) * 100).toFixed(1) : 0
    })

    startMonth++
    if (startMonth > 12) {
      startMonth = 1
      startYear++
    }
  }
  return data
})

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' }, legend: { top: '5%', left: 'center' }, color: ['#409EFF', '#67C23A'],
  series: [{
    name: '業績貢獻', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }, label: { show: false, position: 'center' },
    emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
    data: [{ value: salesStore.newClientRevenue, name: '新客業績' }, { value: salesStore.existingClientRevenue, name: '舊客業績' }]
  }]
}))

const barOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: {}, grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' }, yAxis: { type: 'category', data: ['區間業績'] },
  series: [
    { name: '實際達成', type: 'bar', stack: 'total', label: { show: true }, data: [salesStore.actualRevenue], itemStyle: { color: '#67C23A' } },
    { name: '潛在商機', type: 'bar', stack: 'total', label: { show: true }, data: [salesStore.pipelineRevenue], itemStyle: { color: '#E6A23C' } },
    { name: '未達標差距', type: 'bar', stack: 'total', label: { show: true }, data: [Math.max(salesStore.currentTarget.total - salesStore.actualRevenue - salesStore.pipelineRevenue, 0)], itemStyle: { color: '#F56C6C', opacity: 0.3 } }
  ]
}))
</script>

<style scoped>
.dashboard-container { padding: 0 10px 50px 10px; }

/* 標籤頁可愛化 */
:deep(.el-tabs--border-card) {
  border-radius: 24px;
  border: 2px solid #e7f5fe;
  box-shadow: 0 8px 24px rgba(140, 187, 241, 0.15);
  overflow: hidden;
}
:deep(.el-tabs__header) {
  background-color: #f8fbff;
  border-bottom: 2px solid #e7f5fe;
}
:deep(.el-tabs__item) {
  font-weight: bold;
  color: #8cbbf1;
  height: 50px;
  line-height: 50px;
}
:deep(.el-tabs__item.is-active) {
  color: #6b89a8;
  background-color: #fff;
  border-radius: 20px 20px 0 0;
}

.filter-section { 
  background-color: #ffffff; 
  padding: 15px 24px; 
  border-radius: 20px; 
  margin-bottom: 20px; 
  border: 2px dashed #d0e8fc; /* 可愛虛線框 */
  display: flex; 
  align-items: center; 
}
.filter-label { font-weight: 800; margin-right: 15px; color: #8cbbf1; }

/* 卡片可愛化與懸浮微動效 */
:deep(.el-card) {
  border-radius: 24px;
  border: none;
  box-shadow: 0 6px 18px rgba(140, 187, 241, 0.1) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
:deep(.el-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(140, 187, 241, 0.2) !important;
}
.card-header { font-weight: 800; font-size: 16px; color: #6b89a8; }

.kpi-card { text-align: center; }
.kpi-title { font-size: 15px; color: #8cbbf1; font-weight: bold; margin-bottom: 15px; }
.kpi-value { font-size: 30px; font-weight: 900; color: #5c738b; }
.kpi-sub { margin-top: 12px; font-size: 13px; color: #a1b5c9; font-weight: bold; }
.gap-details { display: flex; justify-content: space-between; padding: 0 10px; font-size: 12px; }

/* KPI 數據顏色粉嫩化 */
.actual .kpi-value { color: #83cbb1; } /* 薄荷綠 */
.gap .kpi-value { color: #f28b9c; } /* 草莓粉 */
.pipeline .kpi-value { color: #f2c76e; } /* 奶油黃 */

.chart-wrapper { height: 300px; width: 100%; }
.chart { width: 100%; height: 100%; }

/* 表格可愛化 */
:deep(.el-table) {
  border-radius: 16px;
  overflow: hidden;
}
:deep(.el-table th.el-table__cell) {
  background-color: #e7f5fe;
  color: #6b89a8;
  font-weight: 800;
}
</style>