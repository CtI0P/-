import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { taskAPI } from '../api';
import type { Task } from '../types';

export const useTaskStore = defineStore('task', () => {
    // 状态
    const tasks = ref<Task[]>([]);
    const total = ref<number>(0);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    
    // 统计状态
    const stats = reactive({
        pending: 0,
        in_progress: 0,
        completed: 0
    });

    // 分页参数
    const pagination = reactive({
        page: 1,
        pageSize: 10,
        totalPages: 0
    });

    // 当前筛选条件
    const filters = reactive({
        search: '',
        status: '',
        priority: ''
    });

    // 当前选中的任务ID（用于批量操作）
    const selectedTaskIds = ref<number[]>([]);

    // Getter: 已完成任务数量
    const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length);
    
    // Getter: 进行中任务数量
    const inProgressCount = computed(() => tasks.value.filter(t => t.status === 'in_progress').length);
    
    // Getter: 待处理任务数量
    const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length);

    // 获取任务列表
    const fetchTasks = async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            // 合并当前筛选条件
            // const queryParams = {
            //     page: params?.page ?? pagination.page,
            //     limit: params?.limit ?? pagination.pageSize,
            //     status: params?.status ?? filters.status,
            //     priority: params?.priority ?? filters.priority,
            //     search: params?.search ?? filters.search,
            //     sortBy: params?.sortBy,
            //     sortOrder: params?.sortOrder
            // };

            const queryParams: Record<string, any> = {
                page: params?.page ?? pagination.page,
                limit: params?.limit ?? pagination.pageSize,
            };
            // 仅当有值时才添加字段
            if (params?.status ?? filters.status) {
                queryParams.status = params?.status ?? filters.status;
            }
            if (params?.priority ?? filters.priority) {
                queryParams.priority = params?.priority ?? filters.priority;
            }
            if (params?.search ?? filters.search) {
                queryParams.search = params?.search ?? filters.search;
            }
            if (params?.sortBy) queryParams.sortBy = params.sortBy;
            if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
            
            // 更新筛选状态
            if (params?.status !== undefined) filters.status = params.status;
            if (params?.priority !== undefined) filters.priority = params.priority;
            if (params?.search !== undefined) filters.search = params.search;
            
            const response = await taskAPI.getTasks(queryParams);
            
            tasks.value = response.data.tasks;
            total.value = response.data.total;
            pagination.page = response.data.page;
            pagination.totalPages = response.data.totalPages;
            
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.error || '获取任务列表失败';
            console.error('fetchTasks error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // 获取单个任务
    const fetchTaskById = async (id: number) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await taskAPI.getTask(id);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.error || '获取任务详情失败';
            console.error('fetchTaskById error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // 创建任务
    const createTask = async (taskData: Partial<Task>) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await taskAPI.createTask(taskData);
            const newTask = response.data;
            
            // 添加到列表顶部
            tasks.value = [newTask, ...tasks.value];
            total.value += 1;
            
            // 更新统计
            await fetchStats();
            
            return newTask;
        } catch (err: any) {
            error.value = err.response?.data?.error || '创建任务失败';
            console.error('createTask error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // 更新任务
    const updateTask = async (id: number, taskData: Partial<Task>) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await taskAPI.updateTask(id, taskData);
            const updatedTask = response.data;
            
            // 更新列表中的任务
            const index = tasks.value.findIndex(t => t.id === id);
            if (index !== -1) {
                tasks.value[index] = updatedTask;
            }
            
            // 更新统计
            await fetchStats();
            
            return updatedTask;
        } catch (err: any) {
            error.value = err.response?.data?.error || '更新任务失败';
            console.error('updateTask error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // 删除任务
    const deleteTask = async (id: number) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            await taskAPI.deleteTask(id);
            
            // 从列表中移除
            tasks.value = tasks.value.filter(t => t.id !== id);
            total.value -= 1;
            
            // 从选中列表中移除
            selectedTaskIds.value = selectedTaskIds.value.filter(taskId => taskId !== id);
            
            // 更新统计
            await fetchStats();
        } catch (err: any) {
            error.value = err.response?.data?.error || '删除任务失败';
            console.error('deleteTask error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // 获取任务统计
    const fetchStats = async () => {
        try {
            const response = await taskAPI.getStats();
            const statsData = response.data;
            
            // 重置统计
            stats.pending = 0;
            stats.in_progress = 0;
            stats.completed = 0;
            
            // 填充统计
            statsData.forEach((item: any) => {
                const status = item.status;
                const count = parseInt(item.count);
                if (status === 'pending') stats.pending = count;
                else if (status === 'in_progress') stats.in_progress = count;
                else if (status === 'completed') stats.completed = count;
            });
        } catch (err: any) {
            console.error('fetchStats error:', err);
        }
    };

    // 获取最近任务（用于仪表板）
    const fetchRecentTasks = async (limit: number = 5) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await taskAPI.getRecentTasks(limit);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.error || '获取最近任务失败';
            console.error('fetchRecentTasks error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    // 获取即将到期的任务
    const fetchUpcomingTasks = async (days: number = 7) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await taskAPI.getUpcomingTasks(days);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.error || '获取即将到期任务失败';
            console.error('fetchUpcomingTasks error:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    };


    // 选择/取消选择任务
    const toggleSelectTask = (taskId: number) => {
        const index = selectedTaskIds.value.indexOf(taskId);
        if (index === -1) {
            selectedTaskIds.value.push(taskId);
        } else {
            selectedTaskIds.value.splice(index, 1);
        }
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
        if (selectedTaskIds.value.length === tasks.value.length) {
            selectedTaskIds.value = [];
        } else {
            selectedTaskIds.value = tasks.value.map(t => t.id);
        }
    };

    // 清除筛选条件
    const clearFilters = () => {
        filters.search = '';
        filters.status = '';
        filters.priority = '';
        pagination.page = 1;
    };

    // 重置状态
    const resetState = () => {
        tasks.value = [];
        total.value = 0;
        isLoading.value = false;
        error.value = null;
        stats.pending = 0;
        stats.in_progress = 0;
        stats.completed = 0;
        pagination.page = 1;
        pagination.pageSize = 10;
        pagination.totalPages = 0;
        filters.search = '';
        filters.status = '';
        filters.priority = '';
        selectedTaskIds.value = [];
    };

    return {
        // 状态
        tasks,
        total,
        isLoading,
        error,
        stats,
        pagination,
        filters,
        selectedTaskIds,
        
        // 计算属性
        completedCount,
        inProgressCount,
        pendingCount,
        
        // Actions
        fetchTasks,
        fetchTaskById,
        createTask,
        updateTask,
        deleteTask,
        fetchStats,
        fetchRecentTasks,
        fetchUpcomingTasks,
        toggleSelectTask,
        toggleSelectAll,
        clearFilters,
        resetState
    };
});