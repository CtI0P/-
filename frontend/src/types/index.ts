export interface User{
    id:number;
    username:string;
    email:string;
    created_at?: string;
    updated_at?: string;
}

export interface Task{
    id:number;
    title:string;
    description?:string;
    status:'pending' | 'in_progress' | 'completed';
    priority:'low' | 'medium' | 'high';
    due_date?:string;
    user_id:number;
    created_at:string;
    updated_at:string;
}

export interface LoginCredentials{
    email:string;
    password:string;
}

export interface RegisterCredentials{
    username:string;
    email:string;
    password:string;
    confirmPassword:string;
}