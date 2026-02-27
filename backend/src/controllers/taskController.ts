import {Request,Response} from 'express';
import Task from '../models/Task';
import {Op} from 'sequelize';
import sequelize from '../config/database';
import {getCache,setCache} from '../utils/cache';
import { delCache } from '../utils/cache';

interface AuthRequest extends Request{
    user?:any;
}

export const getTasks=async(req:AuthRequest,res:Response)=>{
    try{
        const {status,priority,search,page=1,limit=10}=req.query;
        const userId=req.user.id;
        const cacheKey=`stats:user:${userId}`;

        // 1.尝试从Redis获取
        // const cached=await getCache(cacheKey);
        // if(cached){
        //     console.log('📦 从缓存返回统计');
        //     return res.json(cached);
        // }

        // 2.尝试从数据库中获取
        // const stats=await Task.findAll({
        //     where:{user_id:userId},1
        //     attributes:[
        //         'status',
        //         [sequelize.fn('COUNT',sequelize.col('id')),'count']
        //     ],
        //     group:['status']
        // });
        
        
        const where:any={user_id:userId};

        if(status)where.status=status;
        if(priority)where.priority=priority;
        if(search){
            where[Op.or]=[
                {title:{[Op.like]:`%${search}%`}},
                {description:{[Op.like]:`%${search}%`}}
            ];
        }

        const offset=(Number(page)-1)*Number(limit);

        const tasks=await Task.findAndCountAll({
            where,
            limit:Number(limit),
            offset,
            order:[['created_at','DESC']]
        });

         res.json({
            tasks:tasks.rows,
            total:tasks.count,
            page:Number(page),
            totalPages:Math.ceil(tasks.count/Number(limit))
        });

        
        // 3.存入Redis，设置过期时间10分钟
        // await setCache(cacheKey, stats, 600);

        // res.json(stats);
    }catch(error){
        res.status(500).json({error:'Server error'});
    }
};

export const createTask=async(req:AuthRequest,res:Response)=>{
    try{
        const {title,description,status,priority,due_date}=req.body;
        const userId=req.user.id;

        const task=await Task.create({
            title,
            description,
            status:status || 'pending',
            priority:priority || 'medium',
            due_date,
            user_id:userId
        });

        // createTask成功后删除缓存
        await delCache(`stats:user:${userId}`);

        res.status(201).json(task);
    }catch(error){
        res.status(400).json({error:'Invalid date'});
    }
};

export const updateTask=async(req:AuthRequest,res:Response)=>{
    try{
        const{id}=req.params;
        const userId=req.user.id;
        const updateDate=req.body;

        const task=await Task.findOne({
            where:{id,user_id:userId}
        });

        if(!task){
            return res.status(404).json({error:'Task not found'});
        }

        await task.update(updateDate);
        
        // 在updateTask删除缓存
        await delCache(`stats:user:${userId}`);

        res.json(task);
    }catch(error){
        res.status(400).json({error:'Invalid data'});
    }
};

export const deleteTask=async(req:AuthRequest,res:Response)=>{
    try{
        const {id}=req.params;
        const userId=req.user.id;

        const task=await Task.findOne({
            where:{id,user_id:userId}
        });

        if(!task){
            return res.status(404).json({error:'Task not found'});
        }

        await task.destroy();

        // 在deleteTask成功后删除缓存
        await delCache(`stats:user:${userId}`);

        res.status(204).send();
    }catch(error){
        res.status(500).json({error:'Server error'});
    }
};

export const getTaskStats=async(req:AuthRequest,res:Response)=>{
    try{
        const userId=req.user.id;

        const stats=await Task.findAll({
            where:{user_id:userId},
            attributes:[
                'status',
                [sequelize.fn('COUNT',sequelize.col('id')),'count']
            ],
            group:['status']
        });
        
        res.json(stats);
    }catch(error){
        res.status(500).json({error:'Server error'});
    }
};