
import { Roles, useUserStore } from '../stores/userStore'

export const checkLogin = (to, from, next) => {
    console.log(to.path, from.path)
    // 可以在组件中的任意位置访问 `store` 变量 ✨
    const store = useUserStore()
    
    if(store.isLogin){
        next()
    }else {
        alert('还没有登录，请先登录！')
        next('/login')
    }
}

// 除了传递Roles角色，也可以从路由元信息 meta中设置，然后读取
export const checkPermission = (to, from, next) => {
    const { meta: roles = [] } = to
    const store = useUserStore()
    const hasPermission = (store.roles as unknown as Roles[]).some((role)=> {
        return roles.roles.includes(role)
    })
    if(!hasPermission){
        alert('你没有权限进入此页面')
        next(from.path)
    }else {
        next()
    }
}