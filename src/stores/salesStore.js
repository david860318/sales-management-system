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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session && window.location.hash.includes('access_token')) {
          await supabase.auth.getUser()
        }

        const { data: { session: activeSession } } = await supabase.auth.getSession()
        if (!activeSession) return

        const googleUser = activeSession.user
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

        // 完美保留資料庫中原有的電話與職稱，絕不覆蓋
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
      } catch (error) {
        console.error('Google 登入回調處理失敗', error)
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
          amount: Number(r.amount),
          cost: Number(r.cost),
          netRevenue: Number(r.net_revenue),
          expectedDate: r.expected_date,
          notes: r.notes,
          isDualSealCompleted: Boolean(r.is_dual_seal_completed)
        }))

        const rawTargets = await api.getTargets(this.currentUser.id)
        const targetMap = {}
        rawTargets.forEach(t => {
          targetMap[t.month] = {
            total: Number(t.total_target),
            newClient: Number(t.new_client_target),
            existingClient: Number(t.existing_client_target)
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
        console.error('更新目標失敗', error)
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
          is_dual_seal_completed: recordForm.isDualSealCompleted
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
          is_dual_seal_completed: updatedForm.isDualSealCompleted
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