const wechatService = require('./wechatService');

class BotService {
  constructor() {
    this.keywordResponses = {
      '你好': '您好！我是智能客服机器人，有什么可以帮助您的吗？',
      '帮助': '我可以为您提供以下服务：\n1. 产品咨询\n2. 技术支持\n3. 售后服务\n\n请告诉我您需要什么帮助。',
      '联系人工': '正在为您转接人工客服，请稍等...',
      '再见': '感谢您的咨询，祝您生活愉快！'
    };
  }

  // 处理收到的消息
  async handleMessage(messageData) {
    try {
      // 解析消息内容
      const message = this.parseMessage(messageData);
      
      if (!message) {
        return null;
      }

      console.log('解析的消息:', message);

      // 生成回复
      const response = await this.generateResponse(message);
      
      if (response) {
        return this.buildReplyMessage(message, response);
      }

      return null;
    } catch (error) {
      console.error('处理消息错误:', error);
      return null;
    }
  }

  // 解析消息（支持XML和JSON格式）
  parseMessage(messageData) {
    try {
      let message = {};
      
      // 判断是XML格式（企业微信应用消息）还是JSON格式（微信客服消息）
      if (messageData.xml) {
        // XML格式消息
        const xml = messageData.xml;
        message = {
          toUser: xml.ToUserName || '',
          fromUser: xml.FromUserName || '',
          createTime: xml.CreateTime || '',
          msgType: xml.MsgType || '',
          content: xml.Content || '',
          msgId: xml.MsgId || '',
          source: 'wechat_work'
        };
      } else if (messageData.MsgType || messageData.msgtype) {
        // JSON格式消息（微信客服）
        message = {
          toUser: messageData.ToUserName || '',
          fromUser: messageData.FromUserName || messageData.external_userid || '',
          createTime: messageData.CreateTime || Date.now(),
          msgType: messageData.MsgType || messageData.msgtype || '',
          content: messageData.Content || messageData.text?.content || '',
          msgId: messageData.MsgId || messageData.msgid || '',
          source: 'wechat_kf'
        };
      } else {
        console.warn('未识别的消息格式:', messageData);
        return null;
      }
      
      return message;
    } catch (error) {
      console.error('解析消息错误:', error);
      return null;
    }
  }

  // 构建回复消息
  buildReplyMessage(originalMessage, responseContent) {
    if (originalMessage.source === 'wechat_kf') {
      // 微信客服消息格式
      return {
        touser: originalMessage.fromUser,
        msgtype: 'text',
        text: {
          content: responseContent
        }
      };
    } else {
      // 企业微信应用消息格式
      return wechatService.buildTextMessage(originalMessage.fromUser, responseContent);
    }
  }

  // 生成回复内容
  async generateResponse(message) {
    try {
      // 只处理文本消息
      if (message.msgType !== 'text') {
        return '抱歉，目前只支持文本消息。';
      }

      const userMessage = message.content.trim();
      
      // 关键词匹配回复
      for (const [keyword, response] of Object.entries(this.keywordResponses)) {
        if (userMessage.includes(keyword)) {
          return response;
        }
      }

      // 默认回复
      return this.getDefaultResponse(userMessage);
    } catch (error) {
      console.error('生成回复错误:', error);
      return '抱歉，处理您的消息时出现了问题，请稍后再试。';
    }
  }

  // 默认回复
  getDefaultResponse(userMessage) {
    const responses = [
      '感谢您的消息，我已经收到了。如需人工服务，请回复"联系人工"。',
      '您的问题我已经记录，稍后会有专人为您处理。',
      '抱歉，我暂时无法理解您的问题。请尝试重新描述或联系人工客服。'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 添加新的关键词回复
  addKeywordResponse(keyword, response) {
    this.keywordResponses[keyword] = response;
  }

  // 获取所有关键词
  getKeywords() {
    return Object.keys(this.keywordResponses);
  }
}

module.exports = new BotService();