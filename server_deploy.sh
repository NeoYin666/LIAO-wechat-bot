#!/bin/bash
set -e

echo "🚀 一键部署微信客服机器人到服务器..."

# 确保在正确目录
cd /opt/wechat-customer-service

echo "📝 创建package.json..."
cat > package.json << 'PACKAGE_EOF'
{
  "name": "wechat-customer-service",
  "version": "1.0.0",
  "description": "企业微信客服机器人",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "xml2js": "^0.6.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
PACKAGE_EOF

echo "📁 创建目录结构..."
mkdir -p src/services src/utils logs

echo "📝 创建主应用文件..."
cat > src/app.js << 'APP_EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('启动配置:', {
  PORT: PORT,
  NODE_ENV: process.env.NODE_ENV || 'production'
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/xml' }));

// 微信验证webhook
app.get('/webhook', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  
  console.log('微信验证请求:', { signature, timestamp, nonce, echostr });
  
  // 临时直接返回echostr用于验证
  if (echostr) {
    console.log('返回验证字符串:', echostr);
    res.send(echostr);
  } else {
    res.status(400).send('Missing echostr');
  }
});

// 微信消息接收webhook
app.post('/webhook', async (req, res) => {
  try {
    console.log('收到微信消息:', req.body);
    
    // 简单回复测试
    res.status(200).send('success');
  } catch (error) {
    console.error('处理消息错误:', error);
    res.status(500).send('error');
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '微信客服机器人运行中', 
    endpoints: ['/webhook', '/health'],
    port: PORT
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 微信客服机器人启动成功！`);
  console.log(`📍 监听地址: http://0.0.0.0:${PORT}`);
  console.log(`🌐 回调URL: http://8.217.9.126:${PORT}/webhook`);
});
APP_EOF

echo "⚙️ 创建环境配置..."
cat > .env << 'ENV_EOF'
# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_CORP_SECRET=your_corp_secret
WECHAT_AGENT_ID=your_agent_id
WECHAT_TOKEN=your_token
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key

# 服务器配置
PORT=3001
NODE_ENV=production
ENV_EOF

echo "📦 安装项目依赖..."
npm install --production

echo "✅ 部署完成！"
echo ""
echo "🔧 接下来的步骤:"
echo "1. 编辑 .env 文件填入微信配置"
echo "2. 启动服务: npm start"
echo "3. 测试健康检查: curl http://localhost:3001/health"
echo "4. 回调URL: http://8.217.9.126:3001/webhook"
echo ""