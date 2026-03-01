用户模块
    注册、登录（JWT 认证）
    获取当前用户信息
    更新个人资料（用户名、邮箱）
    修改密码
    退出登录（前端清理 token）

任务模块
    创建任务（标题、描述、状态、优先级、截止日期）
    查询任务列表（支持分页、按状态/优先级筛选、标题/描述模糊搜索）
    获取单个任务详情
    更新任务（任意字段）
    删除任务（单条）
    批量更新任务状态
    批量删除任务
    获取最近任务（仪表盘用）
    获取即将到期任务（按天数筛选）

数据统计
    按任务状态统计数量（待处理、进行中、已完成）
    统计接口集成 Redis 缓存，提升响应速度（10 分钟过期，任务变更时自动清除）

仪表盘
    欢迎卡片 + 个性化问候
    任务状态统计卡片
    任务趋势图占位（可扩展 ECharts）
    最近任务列表
    即将到期任务列表（可切换 3/7/14 天）

技术栈
    后端
        Node.js + Express - Web 框架
        TypeScript - 类型安全
        Sequelize - ORM，连接 MySQL
        MySQL - 关系型数据库
        Redis + ioredis - 缓存中间件
        jsonwebtoken - JWT 认证
        bcryptjs - 密码加密
        express-validator - 请求参数校验
        dotenv - 环境变量管理
    
    前端
        Vue 3 - 渐进式框架
        TypeScript - 静态类型
        Pinia - 状态管理
        Vue Router - 路由管理
        Element Plus - UI 组件库
        Axios - HTTP 客户端
        Vite - 构建工具

后续优化方向：
    getTasks目前不可以从正常的redis中获取
    原因：任务列表的查询参数很多（分页、筛选、搜索），缓存键需要包含所有影响结果的参数，否则会导致数据错乱

    预想的缓存键格式是：
        tasks:user:${userId}:page:${page}:limit:${limit}:status:${status}:priority:${priority}:search:${search}:sortBy:${sortBy}:sortOrder:${sortOrder}
    这样设计键有些长了，可能命中率也很低
    可能要重构一下，思考怎么更契合