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
          <el-date-picker v-model="salesStore.dashboardSingleMonth" type="month" placeholder="選擇單一月份" value-format="YYYY-MM" :clearable="false" style="width: 200px;" />
        </div>

        <el-row :gutter="20" class="kpi-row">
          <el-col :span="6"><el-card shadow="hover" class="kpi-card target"><div class="kpi-title">🏆 {{ salesStore.dashboardSingleMonth }} 目標</div><div class="kpi-value">$ {{ salesStore.singleTarget.total.toLocaleString() }}</div></el-card></el-col>
          <el-col :span="6"><el-card shadow="hover" class="kpi-card actual"><div class="kpi-title">✅ 單月實際達成</div><div class="kpi-value">$ {{ salesStore.singleActualRevenue.toLocaleString() }}</div><div class="kpi-sub">達成率: {{ salesStore.singleTarget.total ? ((salesStore.singleActualRevenue / salesStore.singleTarget.total) * 100).toFixed(1) : 0 }}%</div></el-card></el-col>
          <el-col :span="6"><el-card shadow="hover" class="kpi-card gap"><div class="kpi-title">📉 單月目標差距</div><div class="kpi-value">$ {{ Math.max(salesStore.singleTarget.total - salesStore.singleActualRevenue, 0).toLocaleString() }}</div><div class="kpi-sub gap-details"><span>🆕 缺口: ${{ Math.max(salesStore.singleTarget.newClient - salesStore.singleNewClientRevenue, 0).toLocaleString() }}</span><span>♻️ 缺口: ${{ Math.max(salesStore.singleTarget.existingClient - salesStore.singleExistingClientRevenue, 0).toLocaleString() }}</span></div></el-card></el-col>
          <el-col :span="6"><el-card shadow="hover" class="kpi-card pipeline"><div class="kpi-title">🔮 單月潛在商機</div><div class="kpi-value">$ {{ salesStore.singlePipelineRevenue.toLocaleString() }}</div></el-card></el-col>
        </el-row>

        <el-card shadow="never" style="margin-top: 20px;">
          <template #header><div class="card-header">📋 {{ salesStore.dashboardSingleMonth }} 業績詳細明細</div></template>
          <el-table :data="salesStore.singleFilteredRecords" style="width: 100%" border stripe>
            <el-table-column prop="clientName" label="客戶名稱" width="150" sortable />
            <el-table-column prop="productName" label="產品名稱" sortable />
            <el-table-column prop="clientType" label="屬性" width="100" align="center" sortable><template #default="scope"><el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'" size="small">{{ scope.row.clientType }}</el-tag></template></el-table-column>
            <el-table-column prop="status" label="狀態" width="140" align="center" sortable><template #default="scope"><el-tag :type="getStatusColor(scope.row.status)" effect="plain" size="small">{{ scope.row.status }}</el-tag></template></el-table-column>
            <el-table-column prop="amount" label="合約金額" align="right" sortable><template #default="scope">$ {{ scope.row.amount.toLocaleString() }}</template></el-table-column>
            <el-table-column prop="netRevenue" label="實際認列" align="right" sortable><template #default="scope"><strong style="color: #f56c6c;">$ {{ scope.row.netRevenue.toLocaleString() }}</strong></template></el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ========================================== -->
      <!-- 區塊 2：區間圖表與總表分析 -->
      <!-- ========================================== -->
      <el-tab-pane label="📊 區間圖表與總表分析" name="range">
        <div class="filter-section">
          <span class="filter-label">查詢區間：</span>
          <el-date-picker v-model="salesStore.dashboardDateRange" type="monthrange" range-separator="至" start-placeholder="開始月份" end-placeholder="結束月份" value-format="YYYY-MM" :clearable="false" style="width: 300px;" />
        </div>

        <el-row :gutter="20" class="kpi-row">
          <el-col :span="6"><el-card shadow="hover" class="kpi-card target"><div class="kpi-title">🏆 區間總目標</div><div class="kpi-value">$ {{ salesStore.currentTarget.total.toLocaleString() }}</div></el-card></el-col>
          <el-col :span="6"><el-card shadow="hover" class="kpi-card actual"><div class="kpi-title">✅ 區間實際達成</div><div class="kpi-value">$ {{ salesStore.actualRevenue.toLocaleString() }}</div><div class="kpi-sub">達成率: {{ salesStore.currentTarget.total ? ((salesStore.actualRevenue / salesStore.currentTarget.total) * 100).toFixed(1) : 0 }}%</div></el-card></el-col>
          <el-col :span="6"><el-card shadow="hover" class="kpi-card gap"><div class="kpi-title">📉 區間目標差距</div><div class="kpi-value">$ {{ Math.max(salesStore.currentTarget.total - salesStore.actualRevenue, 0).toLocaleString() }}</div><div class="kpi-sub gap-details"><span>🆕 缺口: ${{ Math.max(salesStore.currentTarget.newClient - salesStore.newClientRevenue, 0).toLocaleString() }}</span><span>♻️ 缺口: ${{ Math.max(salesStore.currentTarget.existingClient - salesStore.existingClientRevenue, 0).toLocaleString() }}</span></div></el-card></el-col>
          <el-col :span="6"><el-card shadow="hover" class="kpi-card pipeline"><div class="kpi-title">🔮 區間潛在商機</div><div class="kpi-value">$ {{ salesStore.pipelineRevenue.toLocaleString() }}</div><div class="kpi-sub">預估落點: $ {{ (salesStore.actualRevenue + salesStore.pipelineRevenue).toLocaleString() }}</div></el-card></el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12"><el-card shadow="hover"><template #header><div class="card-header">🤝 區間：新客 vs 舊客 業績佔比</div></template><div class="chart-wrapper"><v-chart class="chart" :option="pieOption" autoresize /></div></el-card></el-col>
          <el-col :span="12"><el-card shadow="hover"><template #header><div class="card-header">🚀 區間：業績達成進度分析</div></template><div class="chart-wrapper"><v-chart class="chart" :option="barOption" autoresize /></div></el-card></el-col>
        </el-row>

        <!-- 區間各月份總表 (重新排序) -->
        <el-row style="margin-top: 20px;">
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;" v-if="salesStore.dashboardDateRange">
                  <span>📅 {{ salesStore.dashboardDateRange[0] }} 至 {{ salesStore.dashboardDateRange[1] }} 區間業績總表</span>
                  <el-button type="primary" size="small" @click="exportSummaryCSV">匯出總表 CSV</el-button>
                </div>
              </template>
              
              <el-table :data="rangeSummaryData" style="width: 100%" border stripe height="400">
                <el-table-column prop="month" label="月份" width="100" align="center" fixed><template #default="scope"><strong>{{ scope.row.month }}</strong></template></el-table-column>
                
                <el-table-column label="總體業績" align="center">
                  <el-table-column label="總目標" align="right" min-width="110"><template #default="scope">$ {{ scope.row.targetTotal.toLocaleString() }}</template></el-table-column>
                  <el-table-column label="目前實際達成" align="right" min-width="120"><template #default="scope">$ {{ scope.row.actualTotal.toLocaleString() }}</template></el-table-column>
                  <el-table-column label="實際達成率(E,F)" align="right" min-width="130"><template #default="scope"><el-tag :type="scope.row.actualRate >= 100 ? 'success' : 'warning'">{{ scope.row.actualRate }}%</el-tag></template></el-table-column>
                  <el-table-column label="目前樂觀達成(D,E,F)" align="right" min-width="160"><template #default="scope"><span style="color: #409EFF; font-weight: bold;">$ {{ scope.row.optTotal.toLocaleString() }}</span></template></el-table-column>
                  <el-table-column label="樂觀達成率(D,E,F)" align="right" min-width="150"><template #default="scope"><span style="color: #409EFF; font-weight: bold;">{{ scope.row.optRate }}%</span></template></el-table-column>
                </el-table-column>

                <el-table-column label="新客業績" align="center">
                  <el-table-column label="新客目標" align="right" min-width="110"><template #default="scope">$ {{ scope.row.targetNew.toLocaleString() }}</template></el-table-column>
                  <el-table-column label="新客目前實際達成" align="right" min-width="140"><template #default="scope">$ {{ scope.row.actualNew.toLocaleString() }}</template></el-table-column>
                  <el-table-column label="新客實際達成率" align="right" min-width="130"><template #default="scope">{{ scope.row.actualNewRate }}%</template></el-table-column>
                  <el-table-column label="新客目前樂觀達成" align="right" min-width="150"><template #default="scope"><span style="color: #409EFF; font-weight: bold;">$ {{ scope.row.optNew.toLocaleString() }}</span></template></el-table-column>
                  <el-table-column label="新客樂觀達成率" align="right" min-width="130"><template #default="scope">{{ scope.row.optNewRate }}%</template></el-table-column>
                </el-table-column>

                <el-table-column label="舊客業績" align="center">
                  <el-table-column label="舊客目標" align="right" min-width="110"><template #default="scope">$ {{ scope.row.targetOld.toLocaleString() }}</template></el-table-column>
                  <el-table-column label="舊客目前實際達成" align="right" min-width="140"><template #default="scope">$ {{ scope.row.actualOld.toLocaleString() }}</template></el-table-column>
                  <el-table-column label="舊客實際達成率" align="right" min-width="130"><template #default="scope">{{ scope.row.actualOldRate }}%</template></el-table-column>
                  <el-table-column label="舊客目前樂觀達成" align="right" min-width="150"><template #default="scope"><span style="color: #67C23A; font-weight: bold;">$ {{ scope.row.optOld.toLocaleString() }}</span></template></el-table-column>
                  <el-table-column label="舊客樂觀達成率" align="right" min-width="130"><template #default="scope">{{ scope.row.optOldRate }}%</template></el-table-column>
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
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const activeTab = ref('single')

const getStatusColor = (status) => {
  if (status.includes('輸單') || status.includes('開發票')) return 'success'
  if (status.includes('流單')) return 'info'
  return 'warning'
}

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
    
    // 實際達成 (E, F)
    const actualRecords = monthRecords.filter(r => r.status.includes('輸單') || r.status.includes('開發票'))
    const actualTotal = actualRecords.reduce((sum, r) => sum + r.netRevenue, 0)
    const actualNew = actualRecords.filter(r => r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0)
    const actualOld = actualRecords.filter(r => r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0)

    // 樂觀達成 (D, E, F)
    const optRecords = monthRecords.filter(r => r.status.includes('提供合約') || r.status.includes('輸單') || r.status.includes('開發票'))
    const optTotal = optRecords.reduce((sum, r) => sum + r.netRevenue, 0)
    const optNew = optRecords.filter(r => r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0)
    const optOld = optRecords.filter(r => r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0)

    data.push({
      month: monthStr,
      
      targetTotal: target.total || 0,
      actualTotal,
      actualRate: target.total ? ((actualTotal / target.total) * 100).toFixed(1) : 0,
      optTotal,
      optRate: target.total ? ((optTotal / target.total) * 100).toFixed(1) : 0,

      targetNew: target.newClient || 0,
      actualNew,
      actualNewRate: target.newClient ? ((actualNew / target.newClient) * 100).toFixed(1) : 0,
      optNew, 
      optNewRate: target.newClient ? ((optNew / target.newClient) * 100).toFixed(1) : 0,

      targetOld: target.existingClient || 0,
      actualOld,
      actualOldRate: target.existingClient ? ((actualOld / target.existingClient) * 100).toFixed(1) : 0,
      optOld, 
      optOldRate: target.existingClient ? ((optOld / target.existingClient) * 100).toFixed(1) : 0
    })

    startMonth++
    if (startMonth > 12) { startMonth = 1; startYear++ }
  }
  return data
})

const exportSummaryCSV = () => {
  if (rangeSummaryData.value.length === 0) return ElMessage.warning('目前沒有區間資料可匯出')
  
  // 更新 CSV 匯出的表頭與對應欄位 (依照新順序：實際金->實際率->樂觀金->樂觀率)
  const headers = [
    '月份', '總目標', '目前實際達成', '實際達成率(E,F)', '目前樂觀達成(D,E,F)', '樂觀達成率(D,E,F)', 
    '新客目標', '新客目前實際達成', '新客實際達成率(E,F)', '新客目前樂觀達成(D,E,F)', '新客樂觀達成率(D,E,F)',
    '舊客目標', '舊客目前實際達成', '舊客實際達成率(E,F)', '舊客目前樂觀達成(D,E,F)', '舊客樂觀達成率(D,E,F)'
  ]
  const rows = rangeSummaryData.value.map(r => [
    r.month, r.targetTotal, r.actualTotal, `${r.actualRate}%`, r.optTotal, `${r.optRate}%`,
    r.targetNew, r.actualNew, `${r.actualNewRate}%`, r.optNew, `${r.optNewRate}%`,
    r.targetOld, r.actualOld, `${r.actualOldRate}%`, r.optOld, `${r.optOldRate}%`
  ])
  
  let csvContent = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(row => { csvContent += row.join(',') + '\n' })
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `區間業績總表分析_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('區間業績總表下載成功！')
}

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' }, legend: { top: '5%', left: 'center' }, color: ['#8cbbf1', '#83cbb1'],
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
    { name: '實際達成', type: 'bar', stack: 'total', label: { show: true }, data: [salesStore.actualRevenue], itemStyle: { color: '#83cbb1' } },
    { name: '潛在商機', type: 'bar', stack: 'total', label: { show: true }, data: [salesStore.pipelineRevenue], itemStyle: { color: '#f2c76e' } },
    { name: '未達標差距', type: 'bar', stack: 'total', label: { show: true }, data: [Math.max(salesStore.currentTarget.total - salesStore.actualRevenue - salesStore.pipelineRevenue, 0)], itemStyle: { color: '#f28b9c', opacity: 0.8 } }
  ]
}))
</script>

<style scoped>
.dashboard-container { padding: 0 10px 50px 10px; }
:deep(.el-tabs--border-card) { border-radius: 24px; border: 2px solid #e7f5fe; box-shadow: 0 8px 24px rgba(140, 187, 241, 0.15); overflow: hidden; }
:deep(.el-tabs__header) { background-color: #f8fbff; border-bottom: 2px solid #e7f5fe; }
:deep(.el-tabs__item) { font-weight: bold; color: #8cbbf1; height: 50px; line-height: 50px; }
:deep(.el-tabs__item.is-active) { color: #6b89a8; background-color: #fff; border-radius: 20px 20px 0 0; }
.filter-section { background-color: #ffffff; padding: 15px 24px; border-radius: 20px; margin-bottom: 20px; border: 2px dashed #d0e8fc; display: flex; align-items: center; }
.filter-label { font-weight: 800; margin-right: 15px; color: #8cbbf1; }
:deep(.el-card) { border-radius: 24px; border: none; box-shadow: 0 6px 18px rgba(140, 187, 241, 0.1) !important; transition: transform 0.2s ease, box-shadow 0.2s ease; }
:deep(.el-card:hover) { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(140, 187, 241, 0.2) !important; }
.card-header { font-weight: 800; font-size: 16px; color: #6b89a8; }
.kpi-card { text-align: center; }
.kpi-title { font-size: 15px; color: #8cbbf1; font-weight: bold; margin-bottom: 15px; }
.kpi-value { font-size: 30px; font-weight: 900; color: #5c738b; }
.kpi-sub { margin-top: 12px; font-size: 13px; color: #a1b5c9; font-weight: bold; }
.gap-details { display: flex; justify-content: space-between; padding: 0 10px; font-size: 12px; }
.actual .kpi-value { color: #83cbb1; }
.gap .kpi-value { color: #f28b9c; }
.pipeline .kpi-value { color: #f2c76e; }
.chart-wrapper { height: 300px; width: 100%; }
.chart { width: 100%; height: 100%; }
:deep(.el-table) { border-radius: 16px; overflow: hidden; }
:deep(.el-table th.el-table__cell) { background-color: #e7f5fe; color: #6b89a8; font-weight: 800; }
</style>