// src/stores/salesStore.js
import { defineStore } from 'pinia'
import api from '../services/api'
import { supabase } from '../services/supabase'

export const useSalesStore = defineStore('sales', {
  state: () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().toISOString().substring(0, 7)
    
    const savedUser = localStorage.getItem('sales_current_user')
    const initialUser = savedUser ? JSON.parse(savedUser) : {
      id: null,
      isLoggedIn: false,
      name: '',
      email: '',
      title: '',
      phone: ''
    }

    return {
      currentUser: initialUser,
      dashboardDateRange: [`${currentYear}-01`, `${currentYear}-12`], 
      dashboardSingleMonth: currentMonth, 
      targets: {},
      records: []
    }
  },
  
  getters: {
    // 輔助將所有合約展開為期別項目 (向下相容無分期的舊資料)
    allScheduleItems(state) {
      const items = []
      state.records.forEach(r => {
        const schedules = (r.schedules && r.schedules.length > 0)
          ? r.schedules
          : [{
              id: `${r.id}-default`,
              stageName: '單期全額',
              month: r.month,
              status: r.status,
              amount: r.amount,
              cost: r.cost,
              netRevenue: r.netRevenue
            }]

        schedules.forEach(sch => {
          items.push({
            parentId: r.id,
            clientName: r.clientName,
            clientType: r.clientType,
            projectName: r.projectName,
            parentTotalAmount: r.amount,
            isDualSealCompleted: r.isDualSealCompleted,
            stageName: sch.stageName || '分期款',
            month: sch.month || r.month,
            status: sch.status || r.status,
            amount: Number(sch.amount) || 0,
            cost: Number(sch.cost) || 0,
            netRevenue: Number(sch.netRevenue) || 0
          })
        })
      })
      return items
    },

    // 區間內篩選紀錄 (只要任一期別在區間內即納入)
    filteredRecords(state) {
      if (!state.dashboardDateRange || state.dashboardDateRange.length !== 2) return state.records
      const [start, end] = state.dashboardDateRange
      return state.records.filter(r => {
        if (r.schedules && r.schedules.length > 0) {
          return r.schedules.some(s => s.month >= start && s.month <= end)
        }
        return r.month >= start && r.month <= end
      })
    },

    rangeScheduleItems() {
      if (!this.dashboardDateRange || this.dashboardDateRange.length !== 2) return this.allScheduleItems
      const [start, end] = this.dashboardDateRange
      return this.allScheduleItems.filter(i => i.month >= start && i.month <= end)
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

    // 區間計算邏輯保持原狀：
    actualRevenue() { 
      return this.rangeScheduleItems.filter(r => r.status.includes('輸單') || r.status.includes('開發票')).reduce((sum, r) => sum + r.netRevenue, 0) 
    },
    pipelineRevenue() { 
      return this.rangeScheduleItems.filter(r => r.status.includes('洽談') || r.status.includes('報價') || r.status.includes('提供合約')).reduce((sum, r) => sum + r.netRevenue, 0) 
    },
    newClientRevenue() { 
      return this.rangeScheduleItems.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0) 
    },
    existingClientRevenue() { 
      return this.rangeScheduleItems.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0) 
    },

    // 單月檢視
    singleFilteredRecords(state) {
      if (!state.dashboardSingleMonth) return []
      return state.records.filter(r => {
        if (r.schedules && r.schedules.length > 0) {
          return r.schedules.some(s => s.month === state.dashboardSingleMonth)
        }
        return r.month === state.dashboardSingleMonth
      })
    },

    singleScheduleItems() {
      if (!this.dashboardSingleMonth) return []
      return this.allScheduleItems.filter(i => i.month === this.dashboardSingleMonth)
    },

    singleTarget(state) {
      if (!state.dashboardSingleMonth) return { total: 0, newClient: 0, existingClient: 0 }
      return state.targets[state.dashboardSingleMonth] || { total: 0, newClient: 0, existingClient: 0 }
    },

    // 單月計算邏輯保持原狀：
    singleActualRevenue() { 
      return this.singleScheduleItems.filter(r => r.status.includes('輸單') || r.status.includes('開發票')).reduce((sum, r) => sum + r.netRevenue, 0) 
    },
    singlePipelineRevenue() { 
      return this.singleScheduleItems.filter(r => r.status.includes('洽談') || r.status.includes('報價') || r.status.includes('提供合約')).reduce((sum, r) => sum + r.netRevenue, 0) 
    },
    singleNewClientRevenue() { 
      return this.singleScheduleItems.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '新客').reduce((sum, r) => sum + r.netRevenue, 0) 
    },
    singleExistingClientRevenue() { 
      return this.singleScheduleItems.filter(r => (r.status.includes('輸單') || r.status.includes('開發票')) && r.clientType === '舊客').reduce((sum, r) => sum + r.netRevenue, 0) 
    }
  },

  actions: {
    async login(email, password) {
      try {
        const dbUser = await api.login(email, password)
        this.currentUser = {
          id: dbUser.id,
          isLoggedIn: true,
          name: dbUser.name,
          email: dbUser.email,
          title: dbUser.title || '資深業務經理',
          phone: dbUser.phone || '未填寫'
        }
        localStorage.setItem('sales_current_user', JSON.stringify(this.currentUser))
        await this.fetchAppData()
      } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
          throw new Error('此帳號尚未註冊，請先前往創建帳號！')
        }
        if (error.message === 'INVALID_PASSWORD') {
          throw new Error('密碼錯誤，請重新輸入！')
        }
        throw new Error('登入失敗，請檢查網路連線')
      }
    },

    async register(userData) {
      try {
        const dbUser = await api.register(userData)
        this.currentUser = {
          id: dbUser.id,
          isLoggedIn: true,
          name: dbUser.name,
          email: dbUser.email,
          title: dbUser.title || '業務專員',
          phone: dbUser.phone || '未填寫'
        }
        localStorage.setItem('sales_current_user', JSON.stringify(this.currentUser))
        await this.fetchAppData()
      } catch (error) {
        throw new Error(error.message || '註冊失敗')
      }
    },

    async loginWithGoogle() {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        })
        if (error) throw error
      } catch (error) {
        throw new Error('Google 登入導向失敗：' + error.message)
      }
    },

    async handleGoogleCallback() {
      try {
        if (window.location.hash.includes('access_token')) {
          await supabase.auth.getSession()
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) return false

        const googleUser = session.user
        const email = googleUser.email
        const name = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || 'Google 用戶'

        let dbUser = null
        try {
          dbUser = await api.login(email, 'GOOGLE_DEFAULT_PASSWORD')
        } catch {
          dbUser = await api.register({
            email: email,
            password: 'GOOGLE_DEFAULT_PASSWORD',
            name: name
          }).catch(() => null)
        }

        this.currentUser = {
          id: dbUser ? dbUser.id : 1,
          isLoggedIn: true,
          name: dbUser?.name || name,
          email: email,
          title: dbUser?.title || '資深業務經理',
          phone: dbUser?.phone || '未填寫'
        }

        localStorage.setItem('sales_current_user', JSON.stringify(this.currentUser))
        window.history.replaceState({}, document.title, window.location.pathname)
        await this.fetchAppData()
        
        return true
      } catch (error) {
        console.error('Google 登入回調處理失敗', error)
        return false
      }
    },

    logout() {
      this.currentUser = { id: null, isLoggedIn: false, name: '', email: '', title: '', phone: '' }
      localStorage.removeItem('sales_current_user')
      this.records = []
      this.targets = {}
    },

    async updateUserProfile(profile) {
      try {
        await api.updateProfile(this.currentUser.id, profile)
        this.currentUser = { ...this.currentUser, ...profile }
        localStorage.setItem('sales_current_user', JSON.stringify(this.currentUser))
      } catch (error) {
        console.error('更新個人資料失敗', error)
      }
    },

    async fetchAppData() {
      try {
        if (!this.currentUser.id) return

        const rawRecords = await api.getRecords(this.currentUser.id)
        this.records = rawRecords.map(r => ({
          id: r.id,
          createdDate: r.created_date,
          month: r.month,
          clientType: r.client_type,
          clientName: r.client_name,
          industry: r.industry,
          projectName: r.project_name,
          productName: r.product_name,
          source: r.source,
          status: r.status,
          amount: Number(r.amount) || 0,
          cost: Number(r.cost) || 0,
          netRevenue: Number(r.net_revenue) || 0,
          expectedDate: r.expected_date,
          notes: r.notes,
          isDualSealCompleted: Boolean(r.is_dual_seal_completed),
          // 解析分期 schedules (向下相容)
          schedules: (r.schedules && Array.isArray(r.schedules) && r.schedules.length > 0)
            ? r.schedules.map(s => ({
                id: s.id || Math.random().toString(36).substr(2, 9),
                stageName: s.stageName || '分期款',
                month: s.month || r.month,
                status: s.status || r.status,
                amount: Number(s.amount) || 0,
                cost: Number(s.cost) || 0,
                netRevenue: Number(s.netRevenue) || 0
              }))
            : [{
                id: `${r.id}-default`,
                stageName: '單期全額',
                month: r.month,
                status: r.status,
                amount: Number(r.amount) || 0,
                cost: Number(r.cost) || 0,
                netRevenue: Number(r.net_revenue) || 0
              }]
        }))

        const rawTargets = await api.getTargets(this.currentUser.id)
        const targetMap = {}
        rawTargets.forEach(t => {
          const newClient = Number(t.new_client_target ?? t.new_client ?? 0)
          const existingClient = Number(t.existing_client_target ?? t.existing_client ?? 0)
          const total = Number(t.total_target ?? t.total ?? (newClient + existingClient))
          targetMap[t.month] = {
            total,
            newClient,
            existingClient
          }
        })
        this.targets = targetMap
      } catch (error) {
        console.error('從資料庫同步資料失敗', error)
      }
    },

    async updateTargets(month, newTargets) {
      try {
        await api.upsertTarget(this.currentUser.id, month, newTargets)
        this.targets[month] = { ...newTargets }
      } catch (error) {
        console.error('更新目標至資料庫失敗：', error)
        throw error // 拋出錯誤讓 UI 可以捕獲
      }
    },

    async addRecord(recordForm) {
      try {
        const today = new Date().toISOString().split('T')[0]
        const payload = {
          user_id: this.currentUser.id,
          created_date: today,
          month: recordForm.month,
          client_type: recordForm.clientType,
          client_name: recordForm.clientName,
          industry: recordForm.industry,
          project_name: recordForm.projectName,
          product_name: recordForm.productName,
          source: recordForm.source,
          status: recordForm.status,
          amount: recordForm.amount,
          cost: recordForm.cost,
          net_revenue: recordForm.netRevenue,
          expected_date: recordForm.expectedDate || null,
          notes: recordForm.notes,
          is_dual_seal_completed: recordForm.isDualSealCompleted,
          schedules: recordForm.schedules || []
        }

        const res = await api.createRecord(payload)
        const newRecord = { ...recordForm, id: res.id, createdDate: today }
        this.records.unshift(newRecord)
      } catch (error) {
        console.error('新增業績紀錄至資料庫失敗', error)
      }
    },

    async updateRecord(id, updatedForm) {
      try {
        const payload = {
          month: updatedForm.month,
          client_type: updatedForm.clientType,
          client_name: updatedForm.clientName,
          industry: updatedForm.industry,
          project_name: updatedForm.projectName,
          product_name: updatedForm.productName,
          source: updatedForm.source,
          status: updatedForm.status,
          amount: updatedForm.amount,
          cost: updatedForm.cost,
          net_revenue: updatedForm.netRevenue,
          expected_date: updatedForm.expectedDate || null,
          notes: updatedForm.notes,
          is_dual_seal_completed: updatedForm.isDualSealCompleted,
          schedules: updatedForm.schedules || []
        }

        await api.updateRecord(id, payload)
        const index = this.records.findIndex(r => r.id === id)
        if (index !== -1) {
          this.records[index] = { ...updatedForm, id: this.records[index].id, createdDate: this.records[index].createdDate }
        }
      } catch (error) {
        console.error('更新業績紀錄失敗', error)
      }
    },

    async deleteRecord(id) {
      try {
        await api.deleteRecord(id)
        this.records = this.records.filter(r => r.id !== id)
      } catch (error) {
        console.error('刪除業績紀錄失敗', error)
      }
    }
  }
})