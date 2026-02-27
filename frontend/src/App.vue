<template>
  <el-config-provider :locale="locale">
    <div id="app">
      <el-container v-if="authStore.isAuthenticated" class="app-container">
        <el-aside width="200px" class="app-sidebar">
          <Sidebar />
        </el-aside>
        <el-container>
          <el-header class="app-header">
            <AppHeader />
          </el-header>
          <el-main class="app-main">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </el-main>
        </el-container>
      </el-container>
      <router-view v-else />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useAuthStore } from './stores/auth';
import Sidebar from './components/Sidebar.vue';
import AppHeader from './components/AppHeader.vue';

const authStore = useAuthStore();
const locale = zhCn;

onMounted(() => {
  authStore.checkAuth();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

.app-container {
  height: 100%;
}

.app-sidebar {
  background-color: #304156;
  color: #fff;
  overflow: hidden;
  transition: width 0.3s;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.app-main {
  background-color: #f0f2f5;
  padding: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>