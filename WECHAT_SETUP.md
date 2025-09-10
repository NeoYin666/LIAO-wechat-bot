# 微信客服机器人配置指南

## 1. 前提条件

- 企业微信账号
- 具备管理员权限
- 服务器（支持HTTPS）
- 域名（用于回调URL）

## 2. 微信客服平台配置

### 2.1 登录微信客服平台
访问 [微信客服平台](https://kf.weixin.qq.com/)，使用企业微信账号登录。

### 2.2 获取企业信息
1. 进入"企业信息"页面
2. 复制**企业ID**（CorpID）

### 2.3 配置开发信息
1. 导航至"开发配置"页面
2. 点击"开始使用"
3. 填写以下信息：
   - **回调URL**: `https://yourdomain.com/webhook`
   - **Token**: 自定义字符串（建议使用复杂字符串）
   - **EncodingAESKey**: 43位字符串（可随机生成）

## 3. 环境配置

### 3.1 创建环境配置文件
复制 `.env.example` 到 `.env`，并填写以下配置：

```env
# 微信客服配置
WECHAT_CORP_ID=你的企业ID
WECHAT_CORP_SECRET=你的应用密钥
WECHAT_AGENT_ID=你的应用ID
WECHAT_TOKEN=你在微信客服平台设置的Token
WECHAT_ENCODING_AES_KEY=你在微信客服平台设置的EncodingAESKey
WECHAT_KF_ID=你的客服账号ID

# 服务器配置
PORT=3000
NODE_ENV=production
```

### 3.2 获取应用密钥和应用ID
1. 登录企业微信管理后台
2. 进入"应用管理"
3. 创建或选择一个自建应用
4. 获取**AgentId**和**Secret**

## 4. 回调URL验证

### 4.1 验证流程
微信服务器会向你的回调URL发送GET请求，携带以下参数：
- `msg_signature`: 微信加密签名
- `timestamp`: 时间戳
- `nonce`: 随机数
- `echostr`: 随机字符串

### 4.2 验证逻辑
服务器需要：
1. 将`token`、`timestamp`、`nonce`、`echostr`按字典序排序
2. 拼接后进行SHA1加密
3. 与`msg_signature`比较
4. 验证通过则返回`echostr`

## 5. 部署和启动

### 5.1 安装依赖
```bash
npm install
```

### 5.2 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 5.3 验证部署
1. 访问 `https://yourdomain.com/health` 检查服务状态
2. 访问 `https://yourdomain.com/config` 查看配置信息
3. 在微信客服平台点击"验证URL"

## 6. 测试功能

### 6.1 发送测试消息
```bash
curl -X POST https://yourdomain.com/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "用户ID",
    "message": "测试消息",
    "type": "kf"
  }'
```

### 6.2 验证消息接收
1. 通过微信客服发送消息
2. 查看服务器日志确认消息接收
3. 验证自动回复功能

## 7. 常见问题

### 7.1 URL验证失败
- 检查Token是否正确配置
- 确认服务器可以通过HTTPS访问
- 验证签名计算逻辑

### 7.2 消息发送失败
- 检查access_token是否有效
- 确认企业ID和应用密钥正确
- 查看API返回的错误信息

### 7.3 消息接收异常
- 检查消息格式解析逻辑
- 确认webhook路径正确
- 查看服务器错误日志

## 8. API文档参考

- [微信客服API文档](https://kf.weixin.qq.com/api/doc/path/93304)
- [企业微信API文档](https://developer.work.weixin.qq.com/document/path/90664)

## 9. 安全注意事项

1. 使用HTTPS协议
2. 定期更新Token和密钥
3. 验证消息来源
4. 限制API访问频率
5. 记录和监控异常访问
