<template>
  <div class="task-list-view">
    <el-page-header :icon="List" @back="router.push('/')">
      <template #content>
        <span class="text-large font-600 mr-3">任务管理</span>
      </template>
    </el-page-header>

    <!-- 引入任务列表组件 -->
    <TaskList />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { List } from '@element-plus/icons-vue';
import TaskList from '../components/TaskList.vue'; // 或者可以直接把TaskList内容内联

const router = useRouter();
</script>

<style scoped>
.task-list-view {
  padding: 20px;
}
</style>