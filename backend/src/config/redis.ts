import Redis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const redisConfig={
    host:process.env.REDIS_HOST,
    port:parseInt(process.env.REDIS_PORT || '6379'),
    password:process.env.REDIS_PASSWORD,
    db:parseInt(process.env.REDIS_DB || '0'),
    retryStrategy:(times:number)=>{
        // 重连策略
        const delay=Math.min(times*50,2000);
        return delay;
    },
};

const redis=new Redis(redisConfig);

redis.on('connect',()=>{
    console.log('✅ Redis 连接成功');
});

redis.on('error',(err)=>{
    console.log('❌ Redis 连接错误:',err);
})

export default redis;