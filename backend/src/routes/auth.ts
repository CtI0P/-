import express from 'express';
import {body,validationResult} from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';
import {Op} from 'sequelize';

const router=express.Router();

// 注册
router.post('/register',
    [
        body('username').isLength({min:3,max:50}).withMessage('用户名长度必须再3-50个字符之间'),
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password').isLength({min:6})
        .withMessage('密码长度至少6个字符').matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('密码必须包含字母和数字'),
        body('confirmPassword').custom((value,{req})=>{
            if(value!==req.body.password){
                throw new Error('两次输入的密码不一致');
            }
            return true;
        }),
    ],
    async(req:express.Request,res:express.Response)=>{
        try{
            // 验证输入
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }

            const {username,email,password}=req.body;

            const existingUser=await User.findOne({
                where:{
                    [Op.or]:[{email},{username}]
                }
            });

            if(existingUser){
                return res.status(400).json({
                    error:'用户名或邮箱已被注册'
                });
            }

            // 创建用户
            const user=await User.create({
                username,
                email,
                password_hash:password,
            });

            // 生成JWT token
            const JWT_SECRET=process.env.JWT_SECRET;
            if(!JWT_SECRET){
                throw new Error('JWT_SECRET环境变量有问题');
            }

            const JWT_EXPIRES_IN:jwt.SignOptions['expiresIn']=
                (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) ?? '1h';
            
            const token=jwt.sign(
                {id:user.id,email:user.email},
                JWT_SECRET,
                {expiresIn:JWT_EXPIRES_IN}
            );

            res.status(201).json({
                user:{
                    id:user.id,
                    username:user.username,
                    email:user.email
                },
                token,
            });
        }catch(error){
            console.error('注册错误',error);
            res.status(500).json({error:'服务器内部错误'});
        }
    }
);

// 登录
router.post('/login',
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password').notEmpty().withMessage('请输入密码'),
    ],
    async(req:express.Request,res:express.Response)=>{
        try{
            // 验证输入
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }

            const {email,password}=req.body;

            // 查找用户
            const user=await User.findOne({where:{email}});
            if(!user){
                return res.status(401).json({error:'邮箱或密码错误'});
            }

            // 验证密码
            const isValidPassword=await user.validatePassword(password);
            if(!isValidPassword){
                return res.status(401).json({error:'邮箱或密码错误'});
            }

            // 生成JWT token
            const JWT_SECRET=process.env.JWT_SECRET;
            if(!JWT_SECRET){
                throw new Error('JWT_SECRET环境变量有问题');
            }

            const JWT_EXPIRES_IN:jwt.SignOptions['expiresIn']=
                (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) ?? '1h';
            
            const token=jwt.sign(
                {id:user.id,email:user.email},
                JWT_SECRET,
                {expiresIn:JWT_EXPIRES_IN}
            )

            res.json({
                user:{
                    id:user.id,
                    username:user.username,
                    email:user.email,
                },
                token,
            });
        }catch(error){
            console.log('登录错误:',error);
            res.status(500).json({error:'服务器内部错误'});
        }
    }
);

// 获取当前用户信息
router.get('/me',authenticateToken,async(req:any,res:express.Response)=>{
    try{
        const user=await User.findByPk(req.user.id,{
            attributes:['id','username','email','created_at']
        });

        if(!user){
            return res.status(404).json({error:'用户不存在'});
        }

        res.json(user);
    }catch(error){
        console.log('获取用户信息错误:',error);
        res.status(500).json({error:'服务器内部错误'});
    }
});

// 更新用户信息
router.put('/profile',authenticateToken,
    [
        body('username').optional().isLength({min:3,max:50}).withMessage('用户名长度必须在3-50个字符之间'),
        body('email').optional().isEmail().withMessage('请输入有效的邮箱地址'),
    ],
    async(req:any,res:express.Response)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }

            const {username,email}=req.body;
            const user=await User.findByPk(req.user.id);

            if(!user){
                return res.status(404).json({error:'用户不存在'});
            }

            // 检查用户名或邮箱是否已被使用
            if(username || email){
                const whereCondition:any={};
                if(username && username!==user.username){
                    whereCondition.username=username;
                }
                if(email && email!==user.email){
                    whereCondition.email=email;
                }

                if(Object.keys(whereCondition).length>0){
                    const existingUser=await User.findOne({
                        where:{
                            [Op.or]:Object.keys(whereCondition).map(key=>({
                                [key]:whereCondition[key]
                            }))
                        }
                    });

                    if(existingUser){
                        return res.status(400).json({
                            error:'用户名或邮箱已被使用'
                        });
                    }
                }
            }

            // 更新用户信息
            if(username)user.username=username;
            if(email)user.email=email;

            await user.save();

            res.json({
                id:user.id,
                username:user.username,
                email:user.email,
                created_at:user.created_at,
            });
        }catch(error){
            console.error('更新用户信息错误:',error);
            res.status(500).json({error:'服务器内部错误'});
        }
    }
)

// 更改密码
router.put('/change-password',authenticateToken,
    [
        body('currentPassword').notEmpty().withMessage('请输入当前密码'),
        body('newPassword').isLength({min:6}).withMessage('新密码长度至少6个字符')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('新密码必须包含字母和数字'),
        body('confirmPassword').custom((value,{req})=>{
            if(value!==req.body.newPassword){
                throw new Error('两次输入的新密码不一致');
            }
            return true;
        }),
    ],
    async(req:any,res:express.Response)=>{
        try{
            const errors=validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()});
            }

            const {currentPassword,newPassword}=req.body;
            const user=await User.findByPk(req.user.id);

            if(!user){
                return res.status(404).json({error:'用户不存在'});
            }

            // 验证当前密码
            const isValidPassword=await user.validatePassword(currentPassword);
            if(!isValidPassword){
                return res.status(401).json({error:'当前密码错误'});
            }

            // 更新密码
            user.password_hash=newPassword;
            await user.save();

            res.json({message:'密码修改成功'});
        }catch(error){
            console.error('修改密码错误:',error);
            res.status(500).json({error:'服务器内部错误'});
        }
    }
);

router.post('/logout',authenticateToken,(req:any,res:express.Response)=>{
    // 这里可以将token加入黑名单
    // 这里并没做任何处理,只是单纯告知客户端
    res.json({message:'退出成功'});
})

export default router;