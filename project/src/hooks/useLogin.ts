
import { useUserStore } from '../stores/userStore'

export const useLogin = () => {
    // 可以在组件中的任意位置访问 `store` 变量 ✨
    const store = useUserStore()

    return {}
}