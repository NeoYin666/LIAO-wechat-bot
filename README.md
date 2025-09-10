# 企业微信客服机器人

一个基于Node.js的企业微信客服机器人，支持完整的URL验证和消息处理功能。

## 功能特性

- ✅ 企业微信URL验证（支持AES解密）
- ✅ 兼容普通微信公众号验证
- ✅ 消息接收和处理
- ✅ Docker容器化部署
- ✅ 健康检查和配置端点
- ✅ 完整的日志记录

## 企业微信URL验证实现

### 验证流程

本项目实现了完整的企业微信URL验证流程，符合[企业微信官方文档](https://developer.work.weixin.qq.com/document/10514)要求：

#### 1. 参数接收
```javascript
// GET /webhook?msg_signature=xxx&timestamp=xxx&nonce=xxx&echostr=xxx
const { msg_signature, timestamp, nonce, echostr } = req.query;
```

#### 2. 验证步骤
1. **URL解码**: 对echostr参数进行URL解码
2. **签名验证**: 使用SHA1算法验证签名
3. **AES解密**: 使用EncodingAESKey解密echostr
4. **CorpID验证**: 验证解密后的CorpID是否匹配

#### 3. 签名验证算法
```javascript
verifySignature(signature, timestamp, nonce, echostr) {
  // 1. 将token、timestamp、nonce、echostr四个参数进行字典序排序
  const sortedParams = [this.token, timestamp, nonce, echostr].sort();
  const sortedString = sortedParams.join('');
  
  // 2. 将四个参数字符串拼接成一个字符串进行sha1加密
  const sha1 = crypto.createHash('sha1');
  sha1.update(sortedString);
  const calculatedSignature = sha1.digest('hex');
  
  // 3. 比较加密后的字符串与signature是否一致
  return calculatedSignature === signature;
}
```

#### 4. AES解密实现
```javascript
decryptEchostr(encryptedData) {
  // 1. Base64解码
  const encrypted = Buffer.from(encryptedData, 'base64');
  
  // 2. 使用AES-256-CBC模式解密
  const iv = this.aesKey.slice(0, 16); // 前16字节作为IV
  const decipher = crypto.createDecipheriv('aes-256-cbc', this.aesKey, iv);
  decipher.setAutoPadding(false);
  
  let decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  // 3. 去除PKCS7填充
  const pad = decrypted[decrypted.length - 1];
  decrypted = decrypted.slice(0, decrypted.length - pad);
  
  // 4. 解析数据结构: random(16) + msg_len(4) + msg + corpId
  const msgLen = decrypted.readUInt32BE(16);
  const message = decrypted.slice(20, 20 + msgLen).toString('utf8');
  const corpId = decrypted.slice(20 + msgLen).toString('utf8');
  
  return { message, corpId };
}
```

### 配置要求

#### 环境变量
```env
# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_CORP_SECRET=your_corp_secret
WECHAT_AGENT_ID=your_agent_id
WECHAT_TOKEN=your_token
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key

# 服务器配置
PORT=3000
NODE_ENV=production
```

#### 企业微信应用配置
1. 在企业微信管理后台创建应用
2. 设置接收消息URL: `https://your-domain.com/webhook`
3. 设置Token和EncodingAESKey
4. 启用回调模式

## 项目结构

```
├── src/
│   ├── app.js                 # 主应用程序
│   ├── services/
│   │   ├── wechatService.js   # 微信API服务
│   │   └── botService.js      # 机器人逻辑
│   └── utils/
│       ├── wechatVerifier.js  # 微信验证器（核心）
│       └── logger.js          # 日志工具
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 部署方式

### 1. Docker部署（推荐）

```bash
# 构建并启动容器
docker-compose up --build -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2. 直接部署

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

## API端点

### GET /webhook
企业微信URL验证端点
- **参数**: `msg_signature`, `timestamp`, `nonce`, `echostr`
- **响应**: 验证成功返回明文echostr，失败返回403

### POST /webhook
消息接收端点
- **Content-Type**: `application/xml` 或 `application/json`
- **响应**: 处理完成返回"success"

### GET /health
健康检查端点
```json
{"status": "ok", "timestamp": "2025-01-01T00:00:00.000Z"}
```

### GET /config
配置信息端点（调试用）
```json
{
  "port": "3000",
  "token_configured": true,
  "corp_id_configured": true,
  "webhook_url": "http://localhost:3000/webhook"
}
```

## 验证测试

本地测试验证逻辑：
```bash
node test-verify.js
```

模拟企业微信验证请求：
```bash
curl "http://localhost:3000/webhook?msg_signature=test&timestamp=123&nonce=abc&echostr=test"
```

## 日志说明

验证成功日志示例：
```
[INFO] 🔍 开始企业微信URL验证
[INFO] 签名验证: {"calculated": "abc123", "received": "abc123", "isValid": true}
[INFO] ✅ 企业微信URL验证成功
```

验证失败日志示例：
```
[ERROR] ❌ 签名验证失败
[WARN] ❌ 企业微信URL验证失败
```

## 安全特性

- ✅ 严格的签名验证
- ✅ AES-256-CBC加密解密
- ✅ CorpID身份验证
- ✅ 参数完整性检查
- ✅ 详细的错误日志记录
- ✅ Docker容器隔离

## 技术栈

- **Node.js**: 服务器运行环境
- **Express**: Web框架
- **crypto**: 加密解密库
- **xml2js**: XML解析
- **axios**: HTTP客户端
- **Docker**: 容器化部署

## 许可证

ISC License