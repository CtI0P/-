import {DataTypes,Model,Optional} from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface UserAttributes{
    id:number;
    username:string;
    email:string;
    password_hash:string;
    created_at?:Date;
    updated_at?:Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'>{}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes{
    public id!:number;
    public username!:string;
    public email!:string;
    public password_hash!:string;
    public readonly created_at!:Date;
    public readonly updated_at!:Date;

    public async validatePassword(password:string):Promise<boolean>{
        return bcrypt.compare(password,this.password_hash);
    }
}

User.init(
    {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true,
        },
        username:{
            type:DataTypes.STRING(50),
            unique:true,
            allowNull:false,
        },
        email:{
            type:DataTypes.STRING(100),
            unique:true,
            allowNull:false,
            validate:{
                isEmail:true,
            },
        },
        password_hash:{
            type:DataTypes.STRING(255),
            allowNull:false,
        },
    },
    {
        sequelize,
        tableName:'users',
        timestamps:true,
        underscored:true,
        hooks:{
            beforeCreate:async (user:User)=>{
                user.password_hash=await bcrypt.hash(user.password_hash,10);
            },
        },
    }
);

export default User;