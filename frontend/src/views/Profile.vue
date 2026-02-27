<template>
  <div class="profile">
    <el-page-header :icon="ArrowLeft" @back="router.back()">
      <template #content>
        <span class="text-large font-600 mr-3">个人资料</span>
      </template>
    </el-page-header>

    <el-row :gutter="20">
      <!-- 左侧：用户信息卡片 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="user-card">
          <div class="user-avatar">
            <el-avatar :size="100" :src="avatarUrl" />
          </div>
          <div class="user-info">
            <h3>{{ user?.username || '用户' }}</h3>
            <p class="user-email">{{ user?.email }}</p>
            <p class="user-joined">加入时间: {{ formatDate(user?.created_at) }}</p>
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待处理</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.in_progress }}</div>
              <div class="stat-label">进行中</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
          <el-divider />
          <div class="user-actions">
            <el-button type="primary" :icon="Edit" @click="activeTab = 'info'">
              编辑资料
            </el-button>
            <el-button :icon="Lock" @click="activeTab = 'password'">
              修改密码
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：编辑表单 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="编辑资料" name="info" />
                <el-tab-pane label="修改密码" name="password" />
              </el-tabs>
            </div>
          </template>

          <!-- 编辑资料表单 -->
          <div v-show="activeTab === 'info'">
            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="100px"
              label-position="left"
            >
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="profileForm.username"
                  placeholder="请输入用户名"
                  :prefix-icon="User"
                />
              </el-form-item>
              
              <el-form-item label="邮箱" prop="email">
                <el-input
                  v-model="profileForm.email"
                  placeholder="请输入邮箱"
                  :prefix-icon="Message"
                  type="email"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button
                  type="primary"
                  @click="handleUpdateProfile"
                  :loading="profileLoading"
                >
                  保存修改
                </el-button>
                <el-button @click="resetProfileForm">取消</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 修改密码表单 -->
          <div v-show="activeTab === 'password'">
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="100px"
              label-position="left"
            >
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  show-password
                  placeholder="请输入当前密码"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入新密码"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button
                  type="primary"
                  @click="handleChangePassword"
                  :loading="passwordLoading"
                >
                  修改密码
                </el-button>
                <el-button @click="resetPasswordForm">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, User, Message, Lock, Edit } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { useTaskStore } from '../stores/task';

const router = useRouter();
const authStore = useAuthStore();
const taskStore = useTaskStore();

const activeTab = ref('info');
const profileLoading = ref(false);
const passwordLoading = ref(false);
const profileFormRef = ref();
const passwordFormRef = ref();

const user = computed(() => authStore.user);
const stats = computed(() => taskStore.stats);

// 默认头像
const avatarUrl = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');

// 编辑资料表单
const profileForm = reactive({
  username: '',
  email: ''
});

// 修改密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 编辑资料验证规则
const profileRules = {
  username: [
    { min: 3, max: 50, message: '用户名长度在3到50个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
};

// 修改密码验证规则
const validatePass2 = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
      message: '密码必须包含字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
};

// 初始化表单数据
const initProfileForm = () => {
  if (user.value) {
    profileForm.username = user.value.username || '';
    profileForm.email = user.value.email || '';
  }
};

// 重置编辑资料表单
const resetProfileForm = () => {
  initProfileForm();
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.currentPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};

// 更新个人资料
const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return;
  
  try {
    await profileFormRef.value.validate();
    
    const hasChanges = 
      profileForm.username !== user.value?.username ||
      profileForm.email !== user.value?.email;
    
    if (!hasChanges) {
      ElMessage.info('没有检测到修改');
      return;
    }
    
    profileLoading.value = true;
    
    // 这里需要调用 authAPI.updateProfile
    // 由于我们没在auth store里定义这个方法，需要扩展store或直接调用api
    // 简单起见，这里先调用authStore的一个方法，我们需要在authStore中添加updateProfile
    // 假设已经在authStore中定义了updateProfile
    const success = await authStore.updateProfile({
      username: profileForm.username,
      email: profileForm.email
    });
    
    if (success) {
      ElMessage.success('个人资料更新成功');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    profileLoading.value = false;
  }
};

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;
  
  try {
    await passwordFormRef.value.validate();
    
    passwordLoading.value = true;
    
    // 调用authStore.changePassword
    const success = await authStore.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    
    if (success) {
      ElMessage.success('密码修改成功，请重新登录');
      // 清除token，跳转到登录页
      authStore.logout();
      router.push('/login');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    passwordLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '未知';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

onMounted(() => {
  initProfileForm();
  taskStore.fetchStats();
});
</script>

<style scoped>
.profile {
  padding: 20px;
}

.user-card {
  text-align: center;
  padding: 20px 0;
}

.user-avatar {
  margin-bottom: 20px;
}

.user-info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #2c3e50;
}

.user-email {
  margin: 0 0 8px 0;
  color: #606266;
}

.user-joined {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
  padding: 0 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-divider {
  width: 1px;
  background-color: #dcdfe6;
}

.user-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 20px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-tabs__nav-scroll) {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .profile {
    padding: 10px;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .stat-divider {
    display: none;
  }
}
</style>