const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const crypto = require('crypto');
require('dotenv').config();

const wechatService = require('./services/wechatService');
const botService = require('./services/botService');
const wechatVerifier = require('./utils/wechatVerifier');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WECHAT_TOKEN || 'testWeChatBot2024';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/xml' }));

// 微信消息接收webhook
app.post('/webhook', async (req, res) => {
  try {
    logger.info('收到微信消息:', typeof req.body === 'string' ? req.body.substring(0, 200) : req.body);
    
    let messageData;
    
    // 判断消息格式（XML或JSON）
    if (typeof req.body === 'string' && req.body.includes('<xml>')) {
      // 解析XML消息（企业微信应用消息）
      const parser = new xml2js.Parser({ explicitArray: false });
      messageData = await parser.parseStringPromise(req.body);
      logger.info('解析XML消息:', messageData);
    } else if (typeof req.body === 'object') {
      // JSON格式消息（微信客服消息）
      messageData = req.body;
      logger.info('解析JSON消息:', messageData);
    } else {
      logger.warn('未知消息格式:', typeof req.body);
      return res.status(200).send('success');
    }
    
    // 处理消息
    const response = await botService.handleMessage(messageData);
    
    if (response) {
      await wechatService.sendMessage(response);
    }
    
    res.status(200).send('success');
  } catch (error) {
    logger.error('处理消息错误:', error);
    res.status(500).send('error');
  }
});

// 企业微信URL验证
app.get('/webhook', (req, res) => {
  const { signature, timestamp, nonce, echostr, msg_signature } = req.query;
  
  logger.info('收到URL验证请求:', { 
    signature: signature ? signature.substring(0, 20) + '...' : undefined,
    timestamp, 
    nonce, 
    echostr: echostr ? echostr.substring(0, 50) + '...' : undefined,
    msg_signature: msg_signature ? msg_signature.substring(0, 20) + '...' : undefined
  });
  
  try {
    // 企业微信应用验证（使用msg_signature）
    if (msg_signature && timestamp && nonce && echostr) {
      logger.info('📋 使用企业微信验证方式');
      
      // 使用官方库进行URL验证
      const verifiedEchostr = wechatVerifier.verifyUrl(msg_signature, timestamp, nonce, echostr);
      
      if (verifiedEchostr) {
        logger.info('✅ 企业微信URL验证成功');
        // 返回解密后的明文消息内容（不能加引号，不能带换行符）
        return res.send(verifiedEchostr);
      } else {
        logger.warn('❌ 企业微信URL验证失败');
        return res.status(403).send('Forbidden');
      }
    } 
    // 兼容普通微信公众号验证方式
    else if (signature && timestamp && nonce && echostr) {
      logger.info('📋 使用普通微信公众号验证方式');
      
      const tmpArr = [TOKEN, timestamp, nonce].sort();
      const tmpStr = tmpArr.join('');
      const shasum = crypto.createHash('sha1');
      shasum.update(tmpStr);
      const hashcode = shasum.digest('hex');
      
      if (hashcode === signature) {
        logger.info('✅ 公众号验证成功');
        return res.send(echostr);
      } else {
        logger.warn('❌ 公众号验证失败');
        return res.status(403).send('Forbidden');
      }
    } 
    // 参数不完整
    else {
      logger.warn('❌ 验证参数不完整:', {
        hasSignature: !!signature,
        hasMsgSignature: !!msg_signature,
        hasTimestamp: !!timestamp,
        hasNonce: !!nonce,
        hasEchostr: !!echostr
      });
      return res.status(400).send('Bad Request - Missing parameters');
    }
    
  } catch (error) {
    logger.error('❌ URL验证过程出错:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取配置信息（调试用）
app.get('/config', (req, res) => {
  res.json({
    port: PORT,
    token_configured: !!TOKEN,
    corp_id_configured: !!process.env.WECHAT_CORP_ID,
    webhook_url: `${req.protocol}://${req.get('host')}/webhook`,
    timestamp: new Date().toISOString()
  });
});

// 测试消息发送
app.post('/test-send', async (req, res) => {
  try {
    const { userId, message, type = 'kf' } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: '缺少必要参数: userId 和 message' });
    }
    
    let result;
    if (type === 'kf') {
      result = await wechatService.sendKfMessage(userId, message);
    } else {
      const messageData = wechatService.buildTextMessage(userId, message);
      result = await wechatService.sendMessage(messageData);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('测试发送消息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`微信客服机器人启动成功，端口: ${PORT}`);
  logger.info(`Webhook URL: http://localhost:${PORT}/webhook`);
  logger.info(`健康检查: http://localhost:${PORT}/health`);
});