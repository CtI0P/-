import axios from "axios";
const API_BASE_URL=import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const api=axios.create({
    baseURL:API_BASE_URL,
    headers:{
        'Content-Type':'application/json',
    },
});

// 请求拦截器：添加token
api.interceptors.request.use(
    (config)=>{
        const token=localStorage.getItem('token');
        if(token){
            config.headers.Authorization=`Bearer ${token}`;
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
)

// 响应拦截器：处理错误
api.interceptors.response.use(
    (response)=>response,
    (error)=>{
        if(error.response?.status===401){
            localStorage.removeItem('token');
            window.location.href='/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI={
    login:(credentials:any)=>api.post('/auth/login',credentials),
    register:(credentials:any)=>api.post('/auth/register',credentials),
    me:()=>api.get('/auth/me'),
    updateProfile: (data: { username?: string; email?: string }) => 
        api.put('/auth/profile', data),
    changePassword: (data: { currentPassword: string; newPassword: string }) => 
        api.post('/auth/change-password', data),
};

export const taskAPI={
    getTasks:(params?:any)=>api.get('/tasks',{params}),
    createTask:(data:any)=>api.post('/tasks',data),
    updateTask:(id:number,data:any)=>api.put(`/tasks/${id}`,data),
    deleteTask:(id:number)=>api.delete(`/tasks/${id}`),
    getStats:()=>api.get('/tasks/stats'),
    getTask: (id: number) => api.get(`/tasks/${id}`),
    getRecentTasks: (limit: number) => 
        api.get(`/tasks/recent/${limit}`),
    getUpcomingTasks: (days: number) => 
        api.get('/tasks/upcoming',{params:{days}}),
};

export default api;