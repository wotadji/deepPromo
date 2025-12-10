import { createRouter, createWebHistory } from 'vue-router'
import PromptForm from '@/components/PromptForm.vue'
import Dashboard from '@/components/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'PromptForm',
    component: PromptForm
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
