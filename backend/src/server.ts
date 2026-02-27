import express, { NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {testConnection} from './config/database';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import Task from './models/Task';
import User from './models/User';
import redis from './config/redis';

dotenv.config();

const app=express();
const PORT=process.env.PORT || 3000;

// 中间件
app.use(cors({
    origin:process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// 请求日志中间件
app.use((req,res,next)=>{
    console.log(`${new Date().toISOString()}-${req.method}${req.url}`);
    next();
});

// API路由
app.use('/api/auth',authRoutes);
app.use('/api/tasks',taskRoutes);

// 检查
app.get('/health',async(req,res)=>{
    const dbStatus=await testConnection();
    res.json({
        status:'ok',
        timeStamp:new Date(),
        database:dbStatus ? 'connected' : 'disconnected'
    });
});

// 404处理
app.use((req,res)=>{
    res.status(404).json({error:'路由不存在'});
});

// 全局错误处理
app.use((error:Error,req:express.Request,res:express.Response,next:NextFunction)=>{
    console.error('全局错误:',error);
    res.status(500).json({
        error:'服务器内部错误',
        message:process.env.NODE_ENV==='development' ? error.message : undefined
    });
});

// 启动服务器
const startServer=async()=>{
    try{
        // 测试连接
        const isConnected=await testConnection();
        if(!isConnected){
            console.error('无法连接到数据库，服务器启动失败');
            process.exit(1);
        }

        await redis.ping(); // 发送PING命令，如果失败会抛出异常
        console.log('✅ Redis is o.Ok');

        // 同步数据库模型
        await User.sync();
        await Task.sync();
        console.log("数据库模型同步完成");

        app.listen(PORT,()=>{
            console.log(`服务器运行在端口 ${PORT}`);
            console.log(`环境: ${process.env.NODE_ENV}`);
            console.log(`API地址: http://localhost:${PORT}/api`);
        });
    }catch(error){
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();

// npx ts-node src/server.ts