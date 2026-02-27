<template>
  <div class="dashboard">
    <el-page-header :icon="HomeFilled" @back="onBack">
      <template #content>
        <span class="text-large font-600 mr-3">仪表盘</span>
      </template>
    </el-page-header>

    <!-- 欢迎卡片 -->
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div>
          <h2>欢迎回来，{{ user?.username || '用户' }}！</h2>
          <p class="welcome-text">{{ getWelcomeMessage() }}</p>
        </div>
        <el-button type="primary" @click="router.push('/tasks')">
          查看所有任务
        </el-button>
      </div>
    </el-card>

    <!-- 任务统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon pending">
              <el-icon :size="40"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon progress">
              <el-icon :size="40"><Loading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.in_progress }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon completed">
              <el-icon :size="40"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近任务趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- 这里可以集成ECharts等图表库，此处用占位 -->
            <div class="placeholder-chart">
              <el-empty description="任务趋势图表" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>任务状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="placeholder-pie">
              <div class="pie-item">
                <span class="pie-label pending-dot"></span>
                <span>待处理</span>
                <span class="pie-value">{{ stats.pending }}</span>
              </div>
              <div class="pie-item">
                <span class="pie-label progress-dot"></span>
                <span>进行中</span>
                <span class="pie-value">{{ stats.in_progress }}</span>
              </div>
              <div class="pie-item">
                <span class="pie-label completed-dot"></span>
                <span>已完成</span>
                <span class="pie-value">{{ stats.completed }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近任务和即将到期任务 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="task-list-card">
          <template #header>
            <div class="card-header">
              <span>最近任务</span>
              <el-button type="text" @click="router.push('/tasks')">查看全部</el-button>
            </div>
          </template>
          <div v-loading="recentLoading" class="task-list">
            <div v-if="recentTasks.length === 0" class="empty-tip">
              暂无任务
            </div>
            <div
              v-for="task in recentTasks"
              :key="task.id"
              class="task-item"
              @click="router.push(`/tasks?highlight=${task.id}`)"
            >
              <div class="task-info">
                <span class="task-title">{{ task.title }}</span>
                <el-tag :type="getStatusType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
              <span class="task-time">{{ formatDate(task.created_at) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="task-list-card">
          <template #header>
            <div class="card-header">
              <span>即将到期 ({{ upcomingDays }}天)</span>
              <el-radio-group v-model="upcomingDays" size="small" @change="fetchUpcoming">
                <el-radio-button :label="3">3天</el-radio-button>
                <el-radio-button :label="7">7天</el-radio-button>
                <el-radio-button :label="14">14天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div v-loading="upcomingLoading" class="task-list">
            <div v-if="upcomingTasks.length === 0" class="empty-tip">
              暂无即将到期任务
            </div>
            <div
              v-for="task in upcomingTasks"
              :key="task.id"
              class="task-item"
              @click="router.push(`/tasks?highlight=${task.id}`)"
            >
              <div class="task-info">
                <span class="task-title">{{ task.title }}</span>
                <el-tag :type="getPriorityType(task.priority)" size="small">
                  {{ getPriorityText(task.priority) }}
                </el-tag>
              </div>
              <span class="task-deadline">{{ formatDate(task.due_date) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { HomeFilled, Clock, Loading, CircleCheck } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { useTaskStore } from '../stores/task';

const router = useRouter();
const authStore = useAuthStore();
const taskStore = useTaskStore();

const recentTasks = ref<any[]>([]);
const upcomingTasks = ref<any[]>([]);
const recentLoading = ref(false);
const upcomingLoading = ref(false);
const upcomingDays = ref(7);

const user = computed(() => authStore.user);
const stats = computed(() => taskStore.stats);

// 获取欢迎语
const getWelcomeMessage = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好，开始新的一天吧！';
  if (hour < 18) return '下午好，继续努力！';
  return '晚上好，别忘了休息哦～';
};

// 获取最近任务
const fetchRecentTasks = async () => {
  recentLoading.value = true;
  try {
    recentTasks.value = await taskStore.fetchRecentTasks(5);
  } catch (error) {
    ElMessage.error('获取最近任务失败');
  } finally {
    recentLoading.value = false;
  }
};

// 获取即将到期任务
const fetchUpcoming = async () => {
  upcomingLoading.value = true;
  try {
    upcomingTasks.value = await taskStore.fetchUpcomingTasks(upcomingDays.value);
  } catch (error) {
    ElMessage.error('获取即将到期任务失败');
  } finally {
    upcomingLoading.value = false;
  }
};

// 工具函数
const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'primary';
    case 'completed': return 'success';
    default: return 'info';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待处理';
    case 'in_progress': return '进行中';
    case 'completed': return '已完成';
    default: return status;
  }
};

const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'low': return 'info';
    case 'medium': return 'warning';
    case 'high': return 'danger';
    default: return '';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'low': return '低';
    case 'medium': return '中';
    case 'high': return '高';
    default: return priority;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const onBack = () => {
  router.push('/');
};

onMounted(async () => {
  await taskStore.fetchStats();
  await fetchRecentTasks();
  await fetchUpcoming();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.welcome-card {
  margin: 20px 0;
  background: linear-gradient(120deg, #f6f9fc 0%, #e6f7ff 100%);
  border: none;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.welcome-text {
  margin: 0;
  color: #5e6c84;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon.pending {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.stat-icon.progress {
  background-color: #ecf5ff;
  color: #409eff;
}

.stat-icon.completed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1.2;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-chart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-pie {
  width: 100%;
  padding: 20px;
}

.pie-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.pie-label {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 12px;
}

.pending-dot {
  background-color: #e6a23c;
}

.progress-dot {
  background-color: #409eff;
}

.completed-dot {
  background-color: #67c23a;
}

.pie-value {
  margin-left: auto;
  font-weight: bold;
}

.task-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-list {
  min-height: 200px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.task-item:hover {
  background-color: #f5f7fa;
}

.task-item:last-child {
  border-bottom: none;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-title {
  font-weight: 500;
  color: #2c3e50;
}

.task-time, .task-deadline {
  color: #909399;
  font-size: 13px;
}

.task-deadline {
  color: #f56c6c;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .stat-item {
    padding: 10px 0;
  }
}
</style>