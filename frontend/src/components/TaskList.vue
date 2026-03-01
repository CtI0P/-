<template>
    <div class="task-manager">
        <!-- 任务筛选 -->
        <el-card class="filter-card">
            <div class="filter-controls">
                <el-input
                    v-model="searchQuery"
                    placeholder="搜索任务..."
                    clearable
                    @clear="fetchTasks"
                    @input="debouncedFetchTasks"
                    style="width: 300px"
                >
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                </el-input>

                <div class="filter-buttons">
                    <el-select v-model="statusFilter" placeholder="状态" clearable @change="fetchTasks">
                        <el-option label="待处理" value="pending" />
                        <el-option label="进行中" value="in_progress" />
                        <el-option label="已完成" value="completed" />
                    </el-select>

                    <el-select v-model="priorityFilter" placeholder="优先级" clearable @change="fetchTasks">
                        <el-option label="低" value="low" />
                        <el-option label="中" value="medium" />
                        <el-option label="高" value="high" />
                    </el-select>

                    <el-button type="primary" @click="showCreateDialog=true">
                        <el-icon><Plus /></el-icon>
                        新建任务
                    </el-button>
                </div>
            </div>
        </el-card>

        <!-- 任务统计 -->
        <el-row :gutter="20" class="stats-row">
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="stat-item">
                        <el-icon class="stat-icon pending"><Clock /></el-icon>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.pending || 0 }}</div>
                            <div class="stat-label">待处理</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="stat-item">
                        <el-icon class="stat-icon progress"><Loading /></el-icon>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.in_progress || 0 }}</div>
                            <div class="stat-label">进行中</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="stat-item">
                        <el-icon class="stat-icon completed"><CircleCheck /></el-icon>
                        <div class="stat-content">
                            <div class="stat-value">{{ stats.completed || 0 }}</div>
                            <div class="stat-label">已完成</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 任务列表 -->
        <el-table
            :data="tasks"
            v-loading="loading"
            class="task-table"
            style="width: 100%"
        >
            <el-table-column prop="title" label="标题" width="200">
                <template #default="{row}">
                    <div class="task-title" :class="'priority-' + row.priority">
                        {{ row.title }}
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="description" label="描述" />

            <el-table-column prop="status" label="状态" width="120">
                <template #default="{row}">
                    <el-tag :type="getStatusType(row.status)">
                        {{ getStatusText(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="priority" label="优先级" width="100">
                <template #default="{row}">
                    <el-tag :type="getPriorityType(row.priority)">
                        {{ getPriorityText(row.priority) }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="due_date" label="截止日期" width="120">
                <template #default="{row}">
                    <span v-if="row.due_date">
                        {{ formatDate(row.due_date) }}
                    </span>
                    <span v-else class="no-date">未设置</span>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="100">
                <template #default="{row}">
                    <el-button size="small" @click="editTask(row)">
                        编辑
                    </el-button>
                    <el-button
                        size="small"
                        type="danger"
                        @click="deleteTask(row.id)"
                    >
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5,10,20,50]"
            :total="totalTasks"
            layout="total,sizes,prev,pager,next,jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            class="pagination"
        />

        <!-- 创建/编辑任务对话框 -->
        <el-dialog
            v-model="showCreateDialog"
            :title="editingTask ? '编辑任务' : '新建任务'"
            width="500px"
        >
            <el-form
                ref="taskFormRef"
                :model="taskForm"
                :rules="taskRules"
                label-width="80px"
            >
                <el-form-item label="标题" prop="title">
                    <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
                </el-form-item>

                <el-form-item label="描述" prop="description">
                    <el-input 
                        v-model="taskForm.description" 
                        type="textarea"
                        :rows="3"
                        placeholder="请输入任务描述"
                    />
                </el-form-item>

                <el-form-item label="状态" prop="status">
                    <el-select v-model="taskForm.status" placeholder="请选择状态">
                        <el-option label="待处理" value="pending" />
                        <el-option label="进行中" value="in_progress" />
                        <el-option label="已完成" value="completed" />
                    </el-select>
                </el-form-item>

                <el-form-item label="优先级" prop="priority">
                    <el-select v-model="taskForm.priority" placeholder="请选择优先级">
                        <el-option label="低" value="low" />
                        <el-option label="中" value="medium" />
                        <el-option label="高" value="high" />
                    </el-select>
                </el-form-item>

                <el-form-item label="截止日期" prop="due_date">
                    <el-date-picker
                        v-model="taskForm.due_date"
                        type="date"
                        placeholder="选择截止日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="showCreateDialog=false">取消</el-button> 
                <el-button type="primary" @click="submitTaskForm" :loading="formLoading">
                    {{ editingTask ? '更新' : '创建' }}
                </el-button>
            </template>
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import {ref,onMounted,computed} from 'vue';
import {ElMessage,ElMessageBox} from 'element-plus';
import { CircleCheck, Loading, Search, Clock, Plus } from '@element-plus/icons-vue';
import {useTaskStore} from '../stores/task';
import type {Task} from '../types';

const taskStore = useTaskStore();
const showCreateDialog = ref(false);
const formLoading = ref(false);
const editingTask = ref<Task | null>(null);
const taskFormRef = ref();

// 表单数据
const taskForm = ref({
    title: '',
    description: '',
    status: 'pending' as const,
    priority: 'medium' as const,
    due_date: '',
});

// 表单验证规则
const taskRules = {
    title: [
        { required: true, message: '请输入任务标题', trigger: 'blur' },
        { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
    ],
};

// 搜索和筛选
const searchQuery = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 计算属性
const tasks = computed(() => taskStore.tasks);
const totalTasks = computed(() => taskStore.total);
const loading = computed(() => taskStore.isLoading);
const stats = computed(() => taskStore.stats);

// 防抖搜索
let searchTimer: number;
const debouncedFetchTasks = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        fetchTasks();
    }, 300);
};

// 获取任务列表
const fetchTasks = () => {
    taskStore.fetchTasks({
        search: searchQuery.value,
        status: statusFilter.value,
        priority: priorityFilter.value,
        page: currentPage.value,
        limit: pageSize.value,
    });
    taskStore.fetchStats();
};

// 分页处理
const handleSizeChange = (size: number) => {
    pageSize.value = size;
    fetchTasks();
};

const handleCurrentChange = (page: number) => {
    currentPage.value = page;
    fetchTasks();
};

// 编辑任务
const editTask = (task: Task) => {
    editingTask.value = task;
    taskForm.value = {
        title: task.title,
        description: task.description || '',
        status: 'pending' as const,
        priority: 'medium' as const,
        due_date: task.due_date || '',
    };
    showCreateDialog.value = true;
};

// 提交表单
const submitTaskForm = async () => {
    if (!taskFormRef.value) return;
  
    try {
        await taskFormRef.value.validate();
            formLoading.value = true;
        
        if (editingTask.value) {
            await taskStore.updateTask(editingTask.value.id, taskForm.value);
            ElMessage.success('任务更新成功');
        } else {
            await taskStore.createTask(taskForm.value);
            ElMessage.success('任务创建成功');
        }
        
        showCreateDialog.value = false;
        resetForm();
        fetchTasks();
    } catch (error) {
        console.error('表单提交失败:', error);
    } finally {
        formLoading.value = false;
    }
};

// 删除任务
const deleteTask = async (id: number) => {
    try {
        await ElMessageBox.confirm('确定要删除这个任务吗？', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });
        
        await taskStore.deleteTask(id);
        ElMessage.success('任务删除成功');
        fetchTasks();
    } catch (error) {
        // 用户取消了删除
    }
};

// 重置表单
const resetForm = () => {
    editingTask.value = null;
    taskForm.value = {
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
    };
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
        case 'medium': return '';
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
    return new Date(dateString).toLocaleDateString('zh-CN');
};

// 初始化
onMounted(() => {
    fetchTasks();
});

</script>


<style scoped>
.task-manager {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.filter-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.filter-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
}

.stats-row {
    margin-bottom: 20px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 20px;
}

.stat-icon {
    font-size: 48px;
}

.stat-icon.pending {
    color: #e6a23c;
}

.stat-icon.progress {
    color: #409eff;
}

.stat-icon.completed {
    color: #67c23a;
}

.stat-content {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    line-height: 1;
}

.stat-label {
    color: #909399;
    font-size: 14px;
}

.task-table {
    margin-top: 20px;
}

.task-title {
    font-weight: 500;
}

.task-title.priority-high {
    color: #f56c6c;
}

.task-title.priority-medium {
    color: #e6a23c;
}

.task-title.priority-low {
    color: #67c23a;
}

.no-date {
    color: #909399;
    font-style: italic;
}

.pagination {
    margin-top: 20px;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .filter-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .filter-buttons {
        justify-content: flex-start;
        flex-wrap: wrap;
    }
    
    .stats-row {
        margin-bottom: 10px;
    }
    
    .el-col {
        margin-bottom: 10px;
    }
}
</style>