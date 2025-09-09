# 企业微信客服机器人

一个基于 Node.js 的企业微信客服机器人，支持自动回复和消息处理。

## 功能特性

- 接收和发送企业微信客服消息
- 关键词自动回复
- 消息签名验证
- 可扩展的机器人逻辑

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的企业微信配置：

```bash
cp .env.example .env
```

### 3. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 配置说明

在企业微信管理后台配置以下信息：

- `WECHAT_CORP_ID`: 企业ID
- `WECHAT_CORP_SECRET`: 应用Secret
- `WECHAT_AGENT_ID`: 应用AgentId  
- `WECHAT_TOKEN`: 接收消息Token
- `WECHAT_ENCODING_AES_KEY`: 消息加密密钥

## API 接口

- `GET /webhook` - 微信验证接口
- `POST /webhook` - 接收微信消息
- `GET /health` - 健康检查

## 项目结构

```
src/
├── app.js                 # 应用入口
├── services/
│   ├── wechatService.js   # 微信API服务
│   └── botService.js      # 机器人逻辑服务
```

## 部署

1. 确保服务器有HTTPS证书
2. 配置nginx反向代理
3. 使用PM2管理进程
4. 在企业微信后台配置webhook URL