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
  async handleMessage(messageXml) {
    try {
      // 解析消息内容
      const message = this.parseMessage(messageXml);
      
      if (!message) {
        return null;
      }

      console.log('解析的消息:', message);

      // 生成回复
      const response = await this.generateResponse(message);
      
      if (response) {
        return wechatService.buildTextMessage(message.fromUser, response);
      }

      return null;
    } catch (error) {
      console.error('处理消息错误:', error);
      return null;
    }
  }

  // 解析XML消息
  parseMessage(messageXml) {
    try {
      const xml = messageXml.xml;
      
      if (!xml) {
        return null;
      }

      return {
        toUser: xml.ToUserName ? xml.ToUserName[0] : '',
        fromUser: xml.FromUserName ? xml.FromUserName[0] : '',
        createTime: xml.CreateTime ? xml.CreateTime[0] : '',
        msgType: xml.MsgType ? xml.MsgType[0] : '',
        content: xml.Content ? xml.Content[0] : '',
        msgId: xml.MsgId ? xml.MsgId[0] : ''
      };
    } catch (error) {
      console.error('解析消息XML错误:', error);
      return null;
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