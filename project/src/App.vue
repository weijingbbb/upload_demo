<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, } from 'vue-router';
import Upload from './components/upload.vue';
import { Roles, useUserStore } from './stores/userStore';

const user = useUserStore()
const router_link = ref([
  { to: '/', name: '主页'},
  // { to: '/list', name: '列表页'},
  { to: '/login', name: '登录页'},
  { to: '/permission-shool', name: '权限-shool'},
  { to: '/permission-teacher', name: '权限-teacher'},
  { to: '/permission-student', name: '权限-student'},
])

const handleLogin = (status: boolean) => user.handleLogin(status)
const handlePermission = (role: Roles[]) => user.handleRoles(role)
</script>

<template>
  <Upload />
  <div class="btn-list setting">
    <span @click="handleLogin(true)">设置登录状态</span>
    <span @click="handleLogin(false)">取消登录状态</span>
    <span @click="handlePermission(['shool'])">设置权限为 - shool</span>
    <span @click="handlePermission(['teacher'])">设置权限为 - teacher</span>
    <span @click="handlePermission(['student'])">设置权限为 - student</span>
    <span @click="handlePermission(['teacher', 'student'])">设置权限为 - teacher + student</span>

  </div>
  <div class="btn-list">
    <RouterLink  
    class="link"
    v-for="link in router_link" 
    :key="link.name" 
    :to="link.to"  
    activeClass="active">{{ link.name }}</RouterLink>
    <!-- <span @click="jump('/')">主页</span>
    <span @click="jump('/login')">登录页</span>
    <span @click="jump('/permission-shool')">权限-shool</span>
    <span @click="jump('/permission-teacher')">权限-teacher</span>
    <span @click="jump('/permission-student')">权限-student</span> -->
  </div>
  <div class="tips">跳转权限页前，必须登录</div>
  <div class="tips">当前登录状态：{{ user.token || '未登录' }}。</div>
  <div class="tips">当前登录角色为：{{ user.rolesArr.join(' - ') }}。</div>
  <div class="link"></div>
  <RouterView />
</template>

<style scoped>
.link {
  margin: 20px 0;
  border-bottom: solid 1px #dedede;
}
.btn-list {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}
.btn-list span {
  margin: 0 5px;
  padding: 8px 10px;
  font-size: 18px;
  font-weight: bold;
  background: orange;
  border-radius: 4px;
  cursor: pointer;
}
.btn-list span:hover {
  color: #fff;
  background: rgb(247, 211, 145);
}
.setting span {
  color: #fff;
  font-size: 16px;
  background: rgb(76, 76, 241);

}
.setting span:hover {
  background: rgb(115, 115, 240);
}

.active {
  background-color: orange;
}
.link {
  margin: 0 10px;
  padding: 4px 6px;
  border-radius: 4px;
}
</style>
