const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
require('dotenv').config();

const wechatService = require('./services/wechatService');
const botService = require('./services/botService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/xml' }));

// 微信消息接收webhook
app.post('/webhook', async (req, res) => {
  try {
    console.log('收到微信消息:', req.body);
    
    // 解析XML消息
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(req.body);
    
    // 处理消息
    const response = await botService.handleMessage(result);
    
    if (response) {
      await wechatService.sendMessage(response);
    }
    
    res.status(200).send('success');
  } catch (error) {
    console.error('处理消息错误:', error);
    res.status(500).send('error');
  }
});

// 微信验证webhook
app.get('/webhook', (req, res) => {
  const { msg_signature, timestamp, nonce, echostr } = req.query;
  
  // 验证签名
  const isValid = wechatService.verifySignature(msg_signature, timestamp, nonce, echostr);
  
  if (isValid) {
    res.send(echostr);
  } else {
    res.status(403).send('Forbidden');
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`微信客服机器人启动成功，端口: ${PORT}`);
});