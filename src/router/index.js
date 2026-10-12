// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Login from '../views/Login.vue'
import { useSalesStore } from '../stores/salesStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'records',
          name: 'SalesRecords',
          component: () => import('../views/SalesRecords.vue')
        },
        {
          path: 'targets',
          name: 'TargetSettings',
          component: () => import('../views/TargetSettings.vue')
        },
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('../views/UserProfile.vue')
        }
      ]
    }
  ]
})

// 簡易路由守衛
router.beforeEach((to, from, next) => {
  const salesStore = useSalesStore()
  if (to.name !== 'Login' && !salesStore.currentUser.isLoggedIn) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router