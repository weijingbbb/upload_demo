import { RouteRecordRaw, createMemoryHistory, createRouter } from 'vue-router'

// import HomeView from './HomeView.vue'
// import AboutView from './AboutView.vue'
import Home from '../pages/home.vue'
import Login from '../pages/login.vue'
import PermissionA from '../pages/permission-a.vue'
import PermissionB from '../pages/permission-b.vue'
import PermissionC from '../pages/permission-c.vue'
import { useUserStore } from '../stores/userStore'
import { checkLogin, checkPermission } from './check'



const routes: RouteRecordRaw[] = [
  { 
    path: '/', 
    component: Home 
  },
  { 
    path: '/login', 
    component: Login,
    beforeEnter: (to, from, next) => {
      const store = useUserStore()
      
      if (store.isLogin && from.path === '/') {
        next('/');
      } else if (store.isLogin && from.path !== '/') {
        alert('已登录状态下，不允许再跳转到登录页')
        next(from.path);
      }else {
        next()
      }
    } 
  },
  {
    path: '/permission-shool',
    component: PermissionA, 
    meta: {
      roles: ['shool']
    }, 
    beforeEnter: [checkLogin, checkPermission]
  },
  {
    path: '/permission-teacher', 
    component: PermissionB, 
    meta: {
      roles: ['teacher']
    }, 
    beforeEnter: [checkLogin, checkPermission]
  },
  {
    path: '/permission-student', 
    component: PermissionC, 
    meta: {
      roles: ['student']
    }, 
    beforeEnter: [checkLogin, checkPermission]
  },
]


export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
