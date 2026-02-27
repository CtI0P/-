import express from 'express';
import {body,param,query,validationResult} from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import * as taskController from '../controllers/taskController';
import { Op, where } from 'sequelize';
import Task from '../models/Task';
import User from '../models/User';
import sequelize from '../config/database';

const router=express.Router();

// 所有任务路由都需要认证
router.use(authenticateToken);

// 获取任务列表(带分页和筛选)
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
        query('status').optional().isIn(['pending', 'in_progress', 'completed'])
            .withMessage('状态必须是pending, in_progress或completed'),
        query('priority').optional().isIn(['low', 'medium', 'high'])
            .withMessage('优先级必须是low, medium或high'),
        query('search').optional().isString().trim().escape(),
        query('sortBy').optional().isIn(['created_at', 'updated_at', 'due_date', 'priority'])
            .withMessage('排序字段无效'),
        query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('排序顺序必须是ASC或DESC'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            await taskController.getTasks(req,res);
        }catch(error){
            next(error);
        }
    }
);

// 统计
router.get('/stats', taskController.getTaskStats);

// 创建任务
router.post('/',
    [
        body('title').isLength({ min: 1, max: 200 }).withMessage('标题长度必须在1-200个字符之间').trim(),
        body('description').optional().isString().trim(),
        body('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('状态必须是pending, in_progress或completed'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('优先级必须是low, medium或high'),
        body('due_date').optional().isISO8601().withMessage('截止日期必须是有效的日期格式'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            await taskController.createTask(req,res);
        }catch(error){
            next(error);
        }
    }
);

// 获取最近任务(仪表板用)
router.get('/recent/:limit',
    [
        param('limit').isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            
            const userId=req.user.id;
            const limit=parseInt(req.params.limit);

            const tasks=await Task.findAll({
                where:{user_id:userId},
                order:[['created_at','DESC']],
                limit,
                include:[{
                    model:User,
                    attributes:['username']
                }]
            });

            res.json(tasks);
        }catch(error){
            next(error);
        }
    }
);

// 获取即将到期的任务
router.get('/upcoming',
    [
        query('days').optional().isInt({ min: 1, max: 30 }).withMessage('天数必须在1-30之间'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            
            const userId=req.user.id;
            const days=parseInt(req.query.days) || 7;

            const today=new Date();
            const futureDate=new Date();
            futureDate.setDate(today.getDate()+days);

            const tasks=await Task.findAll({
                where:{
                    user_id:userId,
                    due_date:{
                        [Op.between]:[today,futureDate]
                    },
                    status:{
                        [Op.ne]:'completed'
                    }
                },
                order:[['due_date','ASC']]
            });

            res.json(tasks);
        }catch(error){
            next(error);
        }
    }
);

// 批量更新任务状态
router.patch('/batch-update',
    [
        body('taskIds').isArray({ min: 1 }).withMessage('任务ID列表不能为空'),
        body('taskIds.*').isInt({ min: 1 }).withMessage('任务ID必须是正整数'),
        body('status').isIn(['pending', 'in_progress', 'completed']).withMessage('状态必须是pending, in_progress或completed'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            
            const {taskIds,status}=req.body;
            const userId=req.user.id;

            // 更新所有属于该用户的任务
            const [affectedCount]=await Task.update(
                {status},
                {
                    where:{
                        id:taskIds,
                        user_id:userId
                    }
                }
            );

            res.json({
                message:`成功更新${affectedCount}个任务`,
                affectedCount
            });
        }catch(error){
            next(error);
        }
    }
);

// 删除任务
router.delete('/',
    [
        body('taskIds').isArray({ min: 1 }).withMessage('任务ID列表不能为空'),
        body('taskIds.*').isInt({ min: 1 }).withMessage('任务ID必须是正整数'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            
            const {taskIds}=req.body;
            const userId=req.user.id;

            const deletedCount=await Task.destroy({
                where:{
                    id:taskIds,
                    user_id:userId
                }
            });

            res.json({
                message:`成功删除${deletedCount}个任务`,
                deletedCount
            });
        }catch(error){
            next(error);
        }
    }
);

// 获取单个任务
router.get('/:id',
    [
        param('id').isInt({min:1}).withMessage('任务ID必须是正整数'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});;
            }

            const {id}=req.params;
            const userId=req.user.id;

            const task=await Task.findOne({
                where:{id,user_id:userId},
                include:[{
                    model:User,
                    attributes:['id','username','email']
                }]
            });

            if(!task){
                return res.status(404).json({error:'任务不存在'});
            }

            res.json(task);
        }catch(error){
            next(error);
        }
    }
);

// 更新任务
router.put('/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('任务ID必须是正整数'),
        body('title').optional().isLength({ min: 1, max: 200 })
            .withMessage('标题长度必须在1-200个字符之间').trim(),
        body('description').optional().isString().trim(),
        body('status').optional().isIn(['pending', 'in_progress', 'completed'])
            .withMessage('状态必须是pending, in_progress或completed'),
        body('priority').optional().isIn(['low', 'medium', 'high'])
            .withMessage('优先级必须是low, medium或high'),
        body('due_date').optional().isISO8601().withMessage('截止日期必须是有效的日期格式'),
    ],
    async(req:any,res:express.Response,next:express.NextFunction)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }
            await taskController.updateTask(req,res);
        }catch(error){
            next(error);
        }
    }
);

// 错误处理中间件
router.use((error:Error,req:express.Request,res:express.Response,next:express.NextFunction)=>{
    console.error('任务路由错误:',error);
    res.status(500).json({
        error:'服务器内部错误',
        message:process.env.NODE_ENV==='development'?error.message:undefined
    });
});

export default router;