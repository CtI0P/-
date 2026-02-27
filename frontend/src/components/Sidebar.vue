<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    :collapse="false"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409eff"
    router
  >
    <div class="sidebar-logo">
      <h2>侧边栏</h2>
    </div>
    
    <el-menu-item index="/">
      <el-icon><Odometer /></el-icon>
      <span>仪表盘</span>
    </el-menu-item>
    
    <el-menu-item index="/tasks">
      <el-icon><List /></el-icon>
      <span>任务管理</span>
    </el-menu-item>
    
    <el-menu-item index="/profile">
      <el-icon><User /></el-icon>
      <span>个人资料</span>
    </el-menu-item>
    
    <el-sub-menu index="system">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>系统设置</span>
      </template>
      <el-menu-item index="/settings">系统配置</el-menu-item>
      <el-menu-item index="/about">关于</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Odometer, List, User, Setting } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.sidebar-menu {
  border-right: none;
  height: 100%;
}

.sidebar-logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.sidebar-logo h2 {
  margin: 0;
  font-size: 18px;
}
</style>