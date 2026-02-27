import {defineStore} from 'pinia';
import {ref,computed} from 'vue';
import { authAPI } from '../api';
import type {User} from '../types';
import { ElMessage } from 'element-plus';

export const useAuthStore=defineStore('auth',()=>{
    const user=ref<User | null>(null);
    const token=ref<string | null>(localStorage.getItem('token'));
    const isLoading=ref(false);

    const isAuthenticated=computed(()=>!!token.value);

    const setAuth=(userData:User,authToken:string)=>{
        user.value=userData;
        token.value=authToken;
        localStorage.setItem('token',authToken);
    };

    const clearAuth=()=>{
        user.value=null;
        token.value=null;
        localStorage.removeItem('token');
    };

    const login=async(email:string,password:string)=>{
        try{
            isLoading.value=true;
            const response=await authAPI.login({email,password});
            const {user:userData,token:authToken}=response.data;
            setAuth(userData,authToken);
            return {success:true};
        }catch(error:any){
            return {
                success:false,
                error:error.response?.data?.error || 'Login failed'
            };
        }finally{
            isLoading.value=false;
        }
    };

    const register=async(username:string,email:string,password:string,confirmPassword:string)=>{
        try{
            isLoading.value=true;
            const response=await authAPI.register({username,email,password,confirmPassword});
            const {user:userData,token:authToken}=response.data;
            setAuth(userData,authToken);
            return {success:true};
        }catch(error:any){
            return {
                success:false,
                error:error.response?.data?.error || 'Registration failed'
            };
        }finally{
            isLoading.value=false;
        }
    };

    const logout=()=>{
        clearAuth();
    };

    const checkAuth=async()=>{
        if(!token.value)return;

        try{
            const response=await authAPI.me();
            user.value=response.data;
        }catch(error){
            clearAuth();
        }
    };

    const updateProfile = async (data: { username?: string; email?: string }) => {
        try {
            isLoading.value = true;
            const response = await authAPI.updateProfile(data);
            // 更新本地存储的用户信息
            user.value = response.data;
            ElMessage.success('个人资料更新成功');
            return { success: true };
        } catch (error: any) {
            ElMessage.error(error.response?.data?.error || '更新失败');
            return { success: false, error: error.response?.data?.error };
        } finally {
            isLoading.value = false;
        }
    };

    const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
        try {
            isLoading.value = true;
            await authAPI.changePassword(data);
            ElMessage.success('密码修改成功，请重新登录');
            return { success: true };
        } catch (error: any) {
            ElMessage.error(error.response?.data?.error || '密码修改失败');
            return { success: false, error: error.response?.data?.error };
        } finally {
            isLoading.value = false;
        }
    };

    return {
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuth,
        setAuth,
        clearAuth,
        updateProfile,
        changePassword,
    };
});