import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize=new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
        host:process.env.DB_HOST,
        port:parseInt(process.env.DB_PORT || '3306'),
        dialect:'mysql',
        logging:process.env.NODE_ENV==='development' ? console.log : false,
        pool:{
            max:5,
            min:0,
            acquire:30000,
            idle:10000
        },
        define:{
            timestamps:true,
            underscored:true
        }
    }
);

// 测试数据库连接
export const testConnection=async ()=>{
    try{
        await sequelize.authenticate();
        console.log('数据库连接成功');
        return true;
    }catch(error){
        console.error('数据库连接失败:',error);
        return false;
    }
}

export default sequelize;