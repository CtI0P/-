import redis from "../config/redis";

// 获取缓存
// @param key 缓存键
// @returns 解析后的对象，若不存在返回null
export async function getCache<T>(key:string):Promise<T | null>{
    const data=await redis.get(key);
    if(!data)return null;
    return JSON.parse(data) as T;
}

// 设置缓存
// @param key 缓存键
// @param value 要缓存的值(会自动JSON.stringify)
// @param ttl 过期时间(秒) 默认60秒
export async function setCache(key:string,value:any,ttl:number=60):Promise<void>{
    await redis.set(key,JSON.stringify(value),'EX',ttl);
}

// 删除缓存
export async function delCache(key:string):Promise<void>{
    await redis.del(key);
}

// 清空所有缓存
export async function clearAllCache():Promise<void>{
    await redis.flushdb();
}