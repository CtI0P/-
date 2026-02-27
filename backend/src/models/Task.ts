import { DataTypes,Model,Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";

interface TaskAttributes{
    id:number;
    title:string;
    description?:string;
    status:'pending' | 'in_progress' | 'completed';
    priority:'low' | 'medium' | 'high';
    due_date?:Date;
    user_id:number;
    created_at?:Date;
    updated_at?:Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'created_at' | 'updated_at'>{}

class Task extends Model<TaskAttributes,TaskCreationAttributes>implements TaskAttributes{
    public id!:number;
    public title!:string;
    public description!:string;
    public status!:'pending' | 'in_progress' | 'completed';
    public priority!:'low' | 'medium' | 'high';
    public due_date!:Date;
    public user_id!:number;
    public readonly created_at!:Date;
    public readonly updated_at!:Date;
}

Task.init(
    {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true,
        },
        title:{
            type:DataTypes.STRING(200),
            allowNull:false,
        },
        description:{
            type:DataTypes.TEXT,
        },
        status:{
            type:DataTypes.ENUM('pending','in_progress','completed'),
            defaultValue:'pending',
        },
        priority:{
            type:DataTypes.ENUM('low','medium','high'),
            defaultValue:'medium',
        },
        due_date:{
            type:DataTypes.DATEONLY,
        },
        user_id:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:User,
                key:'id',
            },
        },
    },
    {
        sequelize,
        tableName:'tasks',
        timestamps:true,
        underscored:true,
    }
);

User.hasMany(Task,{foreignKey:'user_id'});
Task.belongsTo(User,{foreignKey:'user_id'});

export default Task;