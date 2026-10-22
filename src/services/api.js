// src/services/api.js
import axios from 'axios'

const SUPABASE_URL = 'https://kckrosrvzpekmamscysi.supabase.co/rest/v1'
const API_KEY = 'sb_publishable_BZW8WfmB0b6Nh4YiO7jJSA_CMYXuNTV'

const apiClient = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
})

export default {
  // --- 1. 使用者與登入相關 (users 表格) ---
  async login(email, password) {
    const response = await apiClient.get(`/users?email=eq.${email.trim()}&select=*`)
    const users = response.data
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      throw new Error('USER_NOT_FOUND')
    }
    
    const user = users[0]
    // 若為 Google 預設密碼或一般密碼比對
    if (password !== 'GOOGLE_DEFAULT_PASSWORD' && String(user.password).trim() !== String(password).trim()) {
      throw new Error('INVALID_PASSWORD')
    }
    return user
  },

  async register(userData) {
    const check = await apiClient.get(`/users?email=eq.${userData.email}&select=id`)
    if (check.data && check.data.length > 0) {
      throw new Error('此 Email 已經被註冊過了！')
    }

    const response = await apiClient.post('/users', {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      title: '業務專員 (Sales Representative)',
      phone: '未填寫'
    })
    return Array.isArray(response.data) ? response.data[0] : response.data
  },

  async updateProfile(userId, profileData) {
    const response = await apiClient.patch(`/users?id=eq.${userId}`, {
      name: profileData.name,
      title: profileData.title,
      phone: profileData.phone
    })
    return response.data
  },

  // --- 2. 業績紀錄相關 (sales_records 表格，依 user_id 隔離) ---
  async getRecords(userId) {
    const response = await apiClient.get(`/sales_records?user_id=eq.${userId}&select=*&order=id.desc`)
    return response.data
  },

  async createRecord(record) {
    const response = await apiClient.post('/sales_records', record)
    return Array.isArray(response.data) ? response.data[0] : response.data
  },

  async updateRecord(id, record) {
    const response = await apiClient.patch(`/sales_records?id=eq.${id}`, record)
    return response.data
  },

  async deleteRecord(id) {
    const response = await apiClient.delete(`/sales_records?id=eq.${id}`)
    return response.data
  },

  // --- 3. 目標業績相關 (monthly_targets 表格，依 user_id 隔離) ---
  async getTargets(userId) {
    const response = await apiClient.get(`/monthly_targets?user_id=eq.${userId}&select=*`)
    return response.data
  },

  async upsertTarget(userId, month, targets) {
    const totalVal = Number(targets.total) || 0
    const newClientVal = Number(targets.newClient) || 0
    const existingClientVal = Number(targets.existingClient) || 0

    // 1. 先查詢該 user_id 與 month 是否已經存在
    const checkRes = await apiClient.get(
      `/monthly_targets?user_id=eq.${userId}&month=eq.${month}&select=id`
    )
    const existingRows = checkRes.data

    const payload = {
      total_target: totalVal,
      new_client_target: newClientVal,
      existing_client_target: existingClientVal
    }

    if (existingRows && existingRows.length > 0) {
      // 2. 已存在 -> 依 id 進行 PATCH 更新
      const targetId = existingRows[0].id
      const updateRes = await apiClient.patch(`/monthly_targets?id=eq.${targetId}`, payload)
      return updateRes.data
    } else {
      // 3. 不存在 -> 執行標準 POST 新增
      const createRes = await apiClient.post('/monthly_targets', {
        user_id: userId,
        month: month,
        ...payload
      })
      return createRes.data
    }
  }
}