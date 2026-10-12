// src/stores/salesStore.js
import { defineStore } from 'pinia'

export const useSalesStore = defineStore('sales', {
  state: () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().toISOString().substring(0, 7)
    return {
      dashboardDateRange: [`${currentYear}-01`, `${currentYear}-12`], 
      dashboardSingleMonth: currentMonth, 
      
      targets: {
        '2026-10': { total: 500000, newClient: 200000, existingClient: 300000 },
        '2026-11': { total: 600000, newClient: 250000, existingClient: 350000 }
      },
      
      records: [
        {
          id: 1, createdDate: '2026-10-12', month: '2026-10', clientType: '新客',
          clientName: 'A公司', projectName: 'A公司軟體導入案', productName: '企業版軟體',
          source: '行銷名單', industry: '資訊科技業', status: 'B報價中',
          amount: 100000, cost: 20000, netRevenue: 80000,
          expectedDate: '2026-11-15', notes: '客戶正在評估預算',
          isDualSealCompleted: false // 預設雙用印狀態
        },
        {
          id: 2, createdDate: '2026-10-10', month: '2026-10', clientType: '舊客',
          clientName: 'B公司', projectName: 'B公司年度維護', productName: '維護合約',
          source: '舊客回購', industry: '製造業', status: 'E輸單(已簽約)',
          amount: 350000, cost: 10000, netRevenue: 340000, // 調高金額以測試雙用印功能
          expectedDate: '2026-10-31', notes: '合約已用印寄回',
          isDualSealCompleted: false // 預設雙用印狀態
        }
      ]
    }
  },
  
  getters: {
    // 區塊 1：區間範圍計算
    filteredRecords(state) {
      if (!state.dashboardDateRange || state.dashboardDateRange.length !== 2) return state.records
      const [start, end] = state.dashboardDateRange
      return state.records.filter(r => r.month >= start && r.month <= end)
    },
    currentTarget(state) {
      let total = 0, newClient = 0, existingClient = 0
      if (state.dashboardDateRange && state.dashboardDateRange.length === 2) {
        const [start, end] = state.dashboardDateRange
        Object.keys(state.targets).forEach(month => {
          if (month >= start && month <= end) {
            total += state.targets[month].total || 0
            newClient += state.targets[month].newClient || 0
            existingClient += state.targets[month].existingClient || 0
          }
        })
      }
      return { total, newClient, existingClient }
    },
    actualRevenue() { return this.filteredRecords.filter(r => r.status.includes('輸單') || r.status.includes('開發票')).reduce((sum, r) => sum + r.netRevenue, 0) },
    pipelineRevenue() { return this.filteredRecords.filter(r => r.status.includes('洽談') || r.status.includes('報價') || r.status.includes('提供合約')).reduce((sum, r) => sum + r.netRevenue, 0) },
    newClientRevenue() { return this.filteredRecords.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0) },
    existingClientRevenue() { return this.filteredRecords.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0) },

    // 區塊 2：單月詳細計算
    singleFilteredRecords(state) {
      if (!state.dashboardSingleMonth) return []
      return state.records.filter(r => r.month === state.dashboardSingleMonth)
    },
    singleTarget(state) {
      if (!state.dashboardSingleMonth) return { total: 0, newClient: 0, existingClient: 0 }
      return state.targets[state.dashboardSingleMonth] || { total: 0, newClient: 0, existingClient: 0 }
    },
    singleActualRevenue() { return this.singleFilteredRecords.filter(r => r.status.includes('輸單') || r.status.includes('開發票')).reduce((sum, r) => sum + r.netRevenue, 0) },
    singlePipelineRevenue() { return this.singleFilteredRecords.filter(r => r.status.includes('洽談') || r.status.includes('報價') || r.status.includes('提供合約')).reduce((sum, r) => sum + r.netRevenue, 0) },
    singleNewClientRevenue() { return this.singleFilteredRecords.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0) },
    singleExistingClientRevenue() { return this.singleFilteredRecords.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0) }
  },

  actions: {
    updateTargets(month, newTargets) {
      this.targets[month] = { ...newTargets }
    },
    addRecord(recordForm) {
      const today = new Date().toISOString().split('T')[0]
      const newRecord = { ...recordForm, id: Date.now(), createdDate: today }
      this.records.unshift(newRecord)
    },
    updateRecord(id, updatedForm) {
      const index = this.records.findIndex(r => r.id === id)
      if (index !== -1) {
        this.records[index] = { ...updatedForm, id: this.records[index].id, createdDate: this.records[index].createdDate }
      }
    },
    deleteRecord(id) {
      this.records = this.records.filter(r => r.id !== id)
    }
  }
})