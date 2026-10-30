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

    <!-- 【模式 A：區間累計】(點擊數字可彈出詳細明細視窗) -->
    <el-card v-if="viewMode === 'range'" shadow="hover" class="section-card">
      <template #header>
        <div class="section-title">
          <span>📈 區間各月份業績達成分析 ({{ salesStore.dashboardDateRange[0] }} ~ {{ salesStore.dashboardDateRange[1] }})</span>
          <span class="time-badge">共 {{ monthlyBreakdown.length }} 個月份 ｜ 💡 點擊金額可查明細</span>
        </div>
      </template>

      <!-- 桌機版：三區塊獨立底色、無排序 -->
      <div class="desktop-view-only table-scroll-wrap">
        <el-table :data="monthlyBreakdown" border style="width: 100%" size="small" class="colored-breakdown-table">
          <el-table-column prop="month" label="月份" width="95" align="center" fixed="left" class-name="col-month">
            <template #default="scope"><strong>{{ scope.row.month }}</strong></template>
          </el-table-column>

          <!-- 1. 總體業績指標 -->
          <el-table-column label="總體業績指標" align="center" class-name="header-total-group">
            <el-table-column prop="totalTarget" label="總目標" align="right" width="115" class-name="col-total">
              <template #default="scope">$ {{ scope.row.totalTarget.toLocaleString() }}</template>
            </el-table-column>
            
            <el-table-column prop="totalActual" label="目前實際達成" align="right" width="125" class-name="col-total">
              <template #default="scope">
                <span 
                  class="clickable-amount text-red" 
                  title="點擊查看包含的業績明細" 
                  @click="openDetailsDialog(scope.row.month, 'total', 'actual')"
                >
                  $ {{ scope.row.totalActual.toLocaleString() }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="totalActualRate" label="實際達成率" align="center" width="95" class-name="col-total">
              <template #default="scope">
                <el-tag :type="scope.row.totalActualRate >= 100 ? 'success' : (scope.row.totalActualRate >= 70 ? 'primary' : 'warning')" size="small" effect="dark" round>
                  {{ scope.row.totalActualRate }}%
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="totalOpt" label="樂觀達成" align="right" width="125" class-name="col-total">
              <template #default="scope">
                <span 
                  class="clickable-amount text-orange" 
                  title="點擊查看包含的業績明細" 
                  @click="openDetailsDialog(scope.row.month, 'total', 'opt')"
                >
                  $ {{ scope.row.totalOpt.toLocaleString() }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="totalOptRate" label="樂觀達成率" align="center" width="95" class-name="col-total">
              <template #default="scope">
                <span class="rate-optimistic">{{ scope.row.totalOptRate }}%</span>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 2. 新客指標 -->
          <el-table-column label="新客指標" align="center" class-name="header-new-group">
            <el-table-column prop="newTarget" label="目標" align="right" width="110" class-name="col-new">
              <template #default="scope">$ {{ scope.row.newTarget.toLocaleString() }}</template>
            </el-table-column>

            <el-table-column prop="newActual" label="目前實際達成" align="right" width="120" class-name="col-new">
              <template #default="scope">
                <span 
                  class="clickable-amount text-green" 
                  title="點擊查看新客實際業績明細" 
                  @click="openDetailsDialog(scope.row.month, 'new', 'actual')"
                >
                  $ {{ scope.row.newActual.toLocaleString() }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="newActualRate" label="實際達成率" align="center" width="105" class-name="col-new">
              <template #default="scope">
                <span :style="{ color: scope.row.newActualRate >= 100 ? '#2e8b57' : '#518de1', fontWeight: 'bold' }">{{ scope.row.newActualRate }}%</span>
              </template>
            </el-table-column>

            <el-table-column prop="newOpt" label="樂觀達成" align="right" width="120" class-name="col-new">
              <template #default="scope">
                <span 
                  class="clickable-amount text-orange" 
                  title="點擊查看新客樂觀業績明細" 
                  @click="openDetailsDialog(scope.row.month, 'new', 'opt')"
                >
                  $ {{ scope.row.newOpt.toLocaleString() }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="newOptRate" label="樂觀達成率" align="center" width="105" class-name="col-new">
              <template #default="scope">
                <span class="rate-optimistic">{{ scope.row.newOptRate }}%</span>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 3. 舊客指標 -->
          <el-table-column label="舊客指標" align="center" class-name="header-existing-group">
            <el-table-column prop="existingTarget" label="目標" align="right" width="110" class-name="col-existing">
              <template #default="scope">$ {{ scope.row.existingTarget.toLocaleString() }}</template>
            </el-table-column>

            <el-table-column prop="existingActual" label="目前實際達成" align="right" width="120" class-name="col-existing">
              <template #default="scope">
                <span 
                  class="clickable-amount text-purple" 
                  title="點擊查看舊客實際業績明細" 
                  @click="openDetailsDialog(scope.row.month, 'existing', 'actual')"
                >
                  $ {{ scope.row.existingActual.toLocaleString() }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="existingActualRate" label="實際達成率" align="center" width="105" class-name="col-existing">
              <template #default="scope">
                <span :style="{ color: scope.row.existingActualRate >= 100 ? '#6a4fb8' : '#518de1', fontWeight: 'bold' }">{{ scope.row.existingActualRate }}%</span>
              </template>
            </el-table-column>

            <el-table-column prop="existingOpt" label="樂觀達成" align="right" width="120" class-name="col-existing">
              <template #default="scope">
                <span 
                  class="clickable-amount text-orange" 
                  title="點擊查看舊客樂觀業績明細" 
                  @click="openDetailsDialog(scope.row.month, 'existing', 'opt')"
                >
                  $ {{ scope.row.existingOpt.toLocaleString() }}
                </span>
              </template>
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

          <div class="mma-section-total">
            <div class="mma-title-row">
              <span class="sec-label">總體業績</span>
              <span class="sec-target">總目標：${{ item.totalTarget.toLocaleString() }}</span>
            </div>
            <div class="mma-data-row">
              <div>
                目前實際達成：
                <strong 
                  class="clickable-amount text-red" 
                  @click="openDetailsDialog(item.month, 'total', 'actual')"
                >
                  ${{ item.totalActual.toLocaleString() }}
                </strong>
              </div>
              <div>
                樂觀達成：
                <strong 
                  class="clickable-amount text-orange" 
                  @click="openDetailsDialog(item.month, 'total', 'opt')"
                >
                  ${{ item.totalOpt.toLocaleString() }}
                </strong>
              </div>
            </div>
          </div>

          <div class="mma-grid">
            <div class="mma-col col-new">
              <div class="col-head">
                <span>🌱 新客</span>
                <span class="col-rates">{{ item.newActualRate }}% / {{ item.newOptRate }}%</span>
              </div>
              <div class="col-item">目標：${{ item.newTarget.toLocaleString() }}</div>
              <div class="col-item">
                實際：
                <span 
                  class="clickable-amount text-green" 
                  @click="openDetailsDialog(item.month, 'new', 'actual')"
                >
                  ${{ item.newActual.toLocaleString() }}
                </span>
              </div>
              <div class="col-item">
                樂觀：
                <span 
                  class="clickable-amount text-orange" 
                  @click="openDetailsDialog(item.month, 'new', 'opt')"
                >
                  ${{ item.newOpt.toLocaleString() }}
                </span>
              </div>
            </div>

            <div class="mma-col col-existing">
              <div class="col-head">
                <span>🤝 舊客</span>
                <span class="col-rates">{{ item.existingActualRate }}% / {{ item.existingOptRate }}%</span>
              </div>
              <div class="col-item">目標：${{ item.existingTarget.toLocaleString() }}</div>
              <div class="col-item">
                實際：
                <span 
                  class="clickable-amount text-purple" 
                  @click="openDetailsDialog(item.month, 'existing', 'actual')"
                >
                  ${{ item.existingActual.toLocaleString() }}
                </span>
              </div>
              <div class="col-item">
                樂觀：
                <span 
                  class="clickable-amount text-orange" 
                  @click="openDetailsDialog(item.month, 'existing', 'opt')"
                >
                  ${{ item.existingOpt.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 【模式 B：單月檢視】展示當月案件推進明細列表 -->
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
            <el-table-column prop="clientType" label="屬性" width="90" align="center" sortable>
              <template #default="scope">
                <el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'" round size="small">{{ scope.row.clientType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="狀態" width="130" align="center" sortable>
              <template #default="scope">
                <el-tag :type="getStatusColor(scope.row.status)" effect="dark" round size="small">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="合約金額" align="right" width="120" sortable>
              <template #default="scope">$ {{ Number(scope.row.amount || 0).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="netRevenue" label="實際認列" align="right" width="125" sortable>
              <template #default="scope">
                <strong style="color: #f28b9c;">$ {{ Number(scope.row.netRevenue || 0).toLocaleString() }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="雙用印" width="100" align="center">
              <template #default="scope">
                <div v-if="Number(scope.row.amount) > 300000 && isActualStatus(scope.row.status)">
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
              <strong class="revenue-val">$ {{ Number(item.netRevenue || 0).toLocaleString() }}</strong>
            </div>
            <div class="mdrc-sub">合約金額：${{ Number(item.amount || 0).toLocaleString() }}</div>
            <div class="mdrc-dual" v-if="Number(item.amount) > 300000 && isActualStatus(item.status)">
              <el-checkbox v-model="item.isDualSealCompleted" @change="(val) => updateDualSeal(item, val)">
                雙用印：{{ item.isDualSealCompleted ? '已完成' : '待申請' }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 6. 雙用印待辦追蹤專區 -->
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
                <strong style="color: #f28b9c;">$ {{ Number(scope.row.amount || 0).toLocaleString() }}</strong>
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
              <span class="mdc-amount">$ {{ Number(item.amount || 0).toLocaleString() }}</span>
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

    <!-- ======================================================== -->
    <!-- 7. 點擊金額彈出的詳細業績清單對話框 (Dialog) -->
    <!-- ======================================================== -->
    <el-dialog
      v-model="detailsDialogVisible"
      :title="detailsDialogTitle"
      width="920px"
      class="analysis-details-dialog"
      destroy-on-close
    >
      <!-- 頂部統計指標條 -->
      <div class="dialog-stat-banner">
        <div class="dsb-item">
          <span class="dsb-label">歸屬月份</span>
          <span class="dsb-val text-blue">{{ detailsFilterInfo.month }}</span>
        </div>
        <div class="dsb-item">
          <span class="dsb-label">指標類別</span>
          <span class="dsb-val">{{ detailsFilterInfo.categoryText }}</span>
        </div>
        <div class="dsb-item">
          <span class="dsb-label">達成類型</span>
          <span class="dsb-val" :class="detailsFilterInfo.type === 'actual' ? 'text-red' : 'text-orange'">
            {{ detailsFilterInfo.typeText }}
          </span>
        </div>
        <div class="dsb-item">
          <span class="dsb-label">涵蓋筆數</span>
          <span class="dsb-val">{{ displayedDetailsRecords.length }} 筆</span>
        </div>
        <div class="dsb-item">
          <span class="dsb-label">認列毛利總計</span>
          <strong class="dsb-val text-red">$ {{ displayedTotalNet.toLocaleString() }}</strong>
        </div>
      </div>

      <!-- 若點選樂觀達成，提供「全部」與「僅看 D 提供合約」切換選項 -->
      <div v-if="detailsFilterInfo.type === 'opt'" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <el-radio-group v-model="optViewSubtype" size="small">
          <el-radio-button value="all">全部項目 (實際達成 + D提供合約)</el-radio-button>
          <el-radio-button value="onlyD">僅看 D 提供合約 (樂觀推進)</el-radio-button>
        </el-radio-group>
        <span style="font-size: 12px; color: #8fa4bc;">
          {{ optViewSubtype === 'all' ? '當前顯示：該月份累積樂觀達成' : '當前顯示：僅屬於 D 提供合約案件' }}
        </span>
      </div>

      <!-- 案件列表 -->
      <div v-if="displayedDetailsRecords.length === 0" class="empty-dialog-hint">
        該月份在此條件下尚無符合的紀錄
      </div>
      <div v-else>
        <!-- 桌機版明細表格 -->
        <div class="desktop-view-only">
          <el-table :data="displayedDetailsRecords" border size="small" style="width: 100%">
            <el-table-column prop="clientName" label="客戶名稱" min-width="140" show-overflow-tooltip />
            <el-table-column prop="projectName" label="專案名稱" min-width="150" show-overflow-tooltip />
            <el-table-column prop="clientType" label="屬性" width="80" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.clientType === '新客' ? 'primary' : 'success'" size="small" round>
                  {{ scope.row.clientType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="stageName" label="期別名稱" width="125" show-overflow-tooltip />
            <el-table-column prop="status" label="推進狀態" width="140" align="center">
              <template #default="scope">
                <el-tag :type="getStatusColor(scope.row.status)" size="small" effect="dark" round>
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="本期金額" align="right" width="115">
              <template #default="scope">$ {{ Number(scope.row.amount || 0).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="cost" label="本期成本" align="right" width="105">
              <template #default="scope">$ {{ Number(scope.row.cost || 0).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="netRevenue" label="認列毛利" align="right" width="120">
              <template #default="scope">
                <strong style="color: #f28b9c;">$ {{ Number(scope.row.netRevenue || 0).toLocaleString() }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="30萬雙用印" width="105" align="center">
              <template #default="scope">
                <span v-if="Number(scope.row.parentTotalAmount) > 300000" :style="{ color: scope.row.isDualSealCompleted ? '#4ab382' : '#f28b9c', fontWeight: 'bold' }">
                  {{ scope.row.isDualSealCompleted ? '已完成' : '待申請' }}
                </span>
                <span v-else style="color: #a1b5c9; font-size: 11px;">無需</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 手機版明細卡片 -->
        <div class="mobile-view-only dialog-mobile-cards">
          <div v-for="(rec, rIdx) in displayedDetailsRecords" :key="rIdx" class="dialog-mobile-card">
            <div class="dmc-head">
              <span class="dmc-client">{{ rec.clientName }}</span>
              <el-tag :type="getStatusColor(rec.status)" size="small" effect="dark">{{ rec.status }}</el-tag>
            </div>
            <div class="dmc-proj">專案：{{ rec.projectName || '未填寫' }} ｜ 期別：{{ rec.stageName }}</div>
            <div class="dmc-val-box">
              <span>認列毛利：<strong class="text-red">${{ Number(rec.netRevenue || 0).toLocaleString() }}</strong></span>
              <span style="font-size: 11px; color: #8fa4bc;">金額：${{ Number(rec.amount || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
  <div style="display: flex; justify-content: flex-end; width: 100%;">
    <el-button type="primary" @click="detailsDialogVisible = false">關閉</el-button>
  </div>
</template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '../stores/salesStore'
import { ElMessage } from 'element-plus'

const salesStore = useSalesStore()
const router = useRouter()

const viewMode = ref('single')

// 彈出明細對話框控制
const detailsDialogVisible = ref(false)
const optViewSubtype = ref('all') // 'all' (實際+D) | 'onlyD' (僅D)
const detailsFilterInfo = reactive({
  month: '',
  category: 'total', // 'total' | 'new' | 'existing'
  type: 'actual',    // 'actual' | 'opt'
  categoryText: '',
  typeText: ''
})

const currentRecords = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleFilteredRecords : salesStore.filteredRecords
})

const currentTargetData = computed(() => {
  return viewMode.value === 'single' ? salesStore.singleTarget : salesStore.currentTarget
})

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

const calcRate = (val, target) => {
  if (!target || target === 0) return 0
  return Math.round((val / target) * 100)
}

const totalAchieveRate = computed(() => calcRate(currentActualRevenue.value, currentTargetData.value.total))
const newAchieveRate = computed(() => calcRate(currentNewRevenue.value, currentTargetData.value.newClient))
const existingAchieveRate = computed(() => calcRate(currentExistingRevenue.value, currentTargetData.value.existingClient))

// =============================================================
// 狀態相容性判定核心函式（同時相容代碼 E, F, D 與完整中文名稱）
// =============================================================
const isActualStatus = (status) => {
  if (!status) return false
  const s = String(status).trim()
  return s.startsWith('E') || s.startsWith('F') || s.includes('輸單') || s.includes('開發票')
}

const isOptimisticStatus = (status) => {
  if (!status) return false
  const s = String(status).trim()
  return s.startsWith('D') || s.includes('提供合約')
}

const isPipelineGeneralStatus = (status) => {
  if (!status) return false
  const s = String(status).trim()
  return s.startsWith('A') || s.startsWith('B') || s.startsWith('C') || s.startsWith('D') ||
         s.includes('洽談') || s.includes('報價') || s.includes('提供合約')
}

const getStatusColor = (status) => {
  if (!status) return 'info'
  if (isActualStatus(status)) return 'success'
  if (String(status).includes('流單') || String(status).startsWith('G')) return 'info'
  return 'warning'
}

const pipelineCount = computed(() => {
  const items = viewMode.value === 'single' ? salesStore.singleScheduleItems : salesStore.rangeScheduleItems
  return items.filter(r => isPipelineGeneralStatus(r.status)).length
})

const stageSummary = computed(() => {
  const stages = [
    { name: 'A初步洽談', class: 'st-talk' },
    { name: 'B報價中', class: 'st-quote' },
    { name: 'C調整報價', class: 'st-adjust' },
    { name: 'D提供合約', class: 'st-contract' },
    { name: 'E輸單(已簽約)', class: 'st-won' },
    { name: 'F開發票', class: 'st-invoice' }
  ]
  const items = viewMode.value === 'single' ? salesStore.singleScheduleItems : salesStore.rangeScheduleItems
  return stages.map(s => {
    const list = items.filter(r => {
      if (!r.status) return false
      const prefix = s.name.charAt(0)
      return r.status.startsWith(prefix) || r.status.includes(s.name.slice(1, 3))
    })
    const amount = list.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    return { name: s.name, count: list.length, amount, class: s.class }
  })
})

const pendingDualSeals = computed(() => {
  return currentRecords.value.filter(r => Number(r.amount) > 300000 && isActualStatus(r.status) && !r.isDualSealCompleted)
})

const goToRecordsWithMonth = () => {
  router.push({
    path: '/records',
    query: { month: salesStore.dashboardSingleMonth }
  })
}

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

// 原本月度達成率計算邏輯：實際達成 (E, F) + 樂觀合約 (D)
const monthlyBreakdown = computed(() => {
  return monthsInRange.value.map(m => {
    const target = salesStore.targets[m] || { total: 0, newClient: 0, existingClient: 0 }
    
    // 取出歸屬於月份 m 的所有期別項目 (若無分期則為母單單期)
    const monthItems = (salesStore.allScheduleItems || []).filter(i => i.month === m)

    // 1. 實際達成：E輸單、F開發票
    const actualRecords = monthItems.filter(r => isActualStatus(r.status))
    // 2. 樂觀合約：D提供合約
    const pipelineRecords = monthItems.filter(r => isOptimisticStatus(r.status))

    const totalActual = actualRecords.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const totalPipeline = pipelineRecords.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
    const totalOpt = totalActual + totalPipeline // 樂觀達成 = 實際達成 + D提供合約

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

// -------------------------------------------------------------
// 彈跳視窗詳細資料邏輯
// -------------------------------------------------------------
const openDetailsDialog = (month, category, type) => {
  detailsFilterInfo.month = month
  detailsFilterInfo.category = category
  detailsFilterInfo.type = type
  optViewSubtype.value = 'all' // 重置子切換

  const catMap = { total: '總體業績', new: '新客指標', existing: '舊客指標' }
  const typeMap = { actual: '目前實際達成', opt: '樂觀達成' }

  detailsFilterInfo.categoryText = catMap[category] || '總體業績'
  detailsFilterInfo.typeText = typeMap[type] || '實際達成'
  detailsDialogVisible.value = true
}

const detailsDialogTitle = computed(() => {
  return `🔍 ${detailsFilterInfo.month} 【${detailsFilterInfo.categoryText} - ${detailsFilterInfo.typeText}】包含業績清單`
})

// 依據原本統計邏輯精確過濾
const allMatchedRecords = computed(() => {
  if (!detailsFilterInfo.month) return []

  // 1. 抓取該月份的所有期別明細
  let list = (salesStore.allScheduleItems || []).filter(i => i.month === detailsFilterInfo.month)

  // 2. 依客群指標過濾 (新客 / 舊客 / 總體)
  if (detailsFilterInfo.category === 'new') {
    list = list.filter(i => i.clientType === '新客')
  } else if (detailsFilterInfo.category === 'existing') {
    list = list.filter(i => i.clientType === '舊客')
  }

  // 3. 依達成類型過濾 (嚴格對應原本定義)
  if (detailsFilterInfo.type === 'actual') {
    list = list.filter(r => isActualStatus(r.status))
  } else if (detailsFilterInfo.type === 'opt') {
    list = list.filter(r => isActualStatus(r.status) || isOptimisticStatus(r.status))
  }

  return list
})

// 彈窗實際呈現之清單 (支援在樂觀達成中切換「全部」或「僅看 D 提供合約」)
const displayedDetailsRecords = computed(() => {
  if (detailsFilterInfo.type === 'opt' && optViewSubtype.value === 'onlyD') {
    return allMatchedRecords.value.filter(r => isOptimisticStatus(r.status))
  }
  return allMatchedRecords.value
})

const displayedTotalNet = computed(() => {
  return displayedDetailsRecords.value.reduce((sum, r) => sum + (Number(r.netRevenue) || 0), 0)
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
.text-orange { color: #f39c12; }
.rate-optimistic { color: #e6a23c; font-weight: bold; }

/* 可點擊金額樣式 */
.clickable-amount {
  cursor: pointer;
  font-weight: 800;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 3px;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 6px;
  display: inline-block;
}
.clickable-amount:hover {
  background-color: rgba(118, 174, 254, 0.15);
  text-decoration-style: solid;
  transform: scale(1.05);
}

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

/* 彈窗指標條樣式 */
.dialog-stat-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  background: #f4f8fe;
  border: 1px solid #d8e9fd;
  border-radius: 14px;
  padding: 12px 18px;
  margin-bottom: 14px;
}
.dsb-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dsb-label {
  font-size: 11px;
  color: #7b93ab;
  font-weight: bold;
}
.dsb-val {
  font-size: 15px;
  font-weight: 800;
  color: #3b536f;
}
.empty-dialog-hint {
  text-align: center;
  color: #a1b5c9;
  padding: 30px;
}
.dialog-mobile-card {
  background: #fbfdff;
  border: 1px solid #e7f2fe;
  border-radius: 12px;
  padding: 10px 14px;
}
.dmc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.dmc-client {
  font-weight: bold;
  color: #334e68;
  font-size: 15px;
}
.dmc-proj {
  font-size: 12px;
  color: #8fa4bc;
  margin-bottom: 6px;
}
.dmc-val-box {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  background: #f4f8fd;
  padding: 6px 10px;
  border-radius: 8px;
}

.desktop-view-only { display: block; }
.mobile-view-only { display: none; }

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

  .dialog-stat-banner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

/* 預設（桌機版）：強制隱藏手機版元件 */
.desktop-view-only {
  display: block;
}
.mobile-view-only,
.dialog-mobile-cards {
  display: none !important; /* 確保桌機螢幕下絕對不顯示卡片 */
}

/* 手機版斷點 (<= 768px)：隱藏桌機表格，顯示手機卡片 */
@media screen and (max-width: 768px) {
  .desktop-view-only {
    display: none !important;
  }
  .mobile-view-only {
    display: block !important;
  }
  .dialog-mobile-cards {
    display: flex !important;
    flex-direction: column;
    gap: 10px;
  }
}
</style>