// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
        }
      ]
    }
  ]
})

export default router