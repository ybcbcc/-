# 微信小程序云托管数据库连接问题排查指南

## 问题现象
前端报错：`Login failed: Error: Database error`

## 原因分析

### 1. 数据库连接配置问题
- 后端使用环境变量连接数据库：
  - `MYSQL_USERNAME`
  - `MYSQL_PASSWORD` 
  - `MYSQL_ADDRESS`
  - `MYSQL_DATABASE`

### 2. 微信小程序云托管环境配置
前端使用云托管容器服务，配置在以下文件中：

**前端配置：**
- `app.js` 中的云开发环境ID：`prod-4gvarcgoa255cecb`
- `utils/request.js` 中的服务名称：`golang-cttc`

**后端配置：**
- `container.config.json` 中配置了容器端口和环境参数
- 数据库初始化在 `backend/db/init.go`

### 3. 数据库表结构问题
已修复User模型中Token字段的存储问题，确保token可以正确保存到数据库

## 解决步骤

### 步骤1：检查云托管服务状态
1. 登录[微信云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 确认服务`golang-cttc`正在运行
3. 检查服务日志查看具体错误信息

### 步骤2：配置数据库连接
在云托管控制台的服务设置中，添加以下环境变量：
```
MYSQL_USERNAME=your_db_username
MYSQL_PASSWORD=your_db_password  
MYSQL_ADDRESS=your_db_host:3306
MYSQL_DATABASE=golang_demo
```

### 步骤3：配置微信小程序
在云托管控制台的应用配置中，添加：
```
WX_APP_ID=your_wechat_mini_program_appid
WX_APP_SECRET=your_wechat_mini_program_secret
```

### 步骤4：检查数据库权限
确保数据库用户有以下权限：
- CREATE, DROP, ALTER, INDEX
- INSERT, UPDATE, DELETE, SELECT

### 步骤5：验证连接
使用云托管的「在线调试」功能测试 `/api/auth/login` 接口

## 常见错误及解决方案

### 错误1：数据库连接超时
**原因**：网络问题或数据库配置错误
**解决**：检查`MYSQL_ADDRESS`是否正确，确保数据库允许云托管IP访问

### 错误2：表不存在
**原因**：数据库迁移失败
**解决**：检查`backend/db/init.go`中的表创建逻辑，手动执行SQL创建表

### 错误3：权限拒绝
**原因**：数据库用户权限不足
**解决**：给数据库用户授予足够权限

## 调试建议

1. **查看云托管日志**：在控制台查看服务运行日志
2. **本地测试**：先在本地运行后端服务，确保代码无误
3. **逐步验证**：先测试数据库连接，再测试API接口
4. **使用微信开发者工具**：查看网络请求详情和错误信息

## 数据库表结构
确保数据库中存在以下表：
- `users` - 用户表
- `lotteries` - 抽奖活动表  
- `lottery_participants` - 抽奖参与记录表
- `posts` - 发布内容表
- `Counters` - 计数器表（已存在）