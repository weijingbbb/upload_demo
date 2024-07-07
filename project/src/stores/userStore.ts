import { defineStore } from 'pinia'

export type Roles = 'shool' | 'teacher' | 'student'

interface StateType {
  redirectedFromLogin: boolean
  token: string
  roles: Roles[]
}

// 你可以任意命名 `defineStore()` 的返回值，但最好使用 store 的名字，同时以 `use` 开头且以 `Store` 结尾。
// (比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中 Store 的唯一 ID。
export const useUserStore = defineStore('user', {
    state: () => ({ 
        redirectedFromLogin: true,
        token: '',
        roles: []
    }) as StateType,
    getters: {
      isLogin: (state) => state.token,
      rolesArr: (state) => state.roles,
      hasRedirectedFromLogin: (state) => state.redirectedFromLogin
    },
    actions: {
      handleLogin(status: boolean) {
        if(status){
          this.token = '已登录，勿念！'
        }else {
          this.token = ''
        }
      },
      handleRoles (roles: Roles[]) {
        this.roles = roles as unknown as []
      }
    },
})