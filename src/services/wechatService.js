const axios = require('axios');
const crypto = require('crypto');

class WechatService {
  constructor() {
    this.corpId = process.env.WECHAT_CORP_ID;
    this.corpSecret = process.env.WECHAT_CORP_SECRET;
    this.agentId = process.env.WECHAT_AGENT_ID;
    this.token = process.env.WECHAT_TOKEN;
    this.encodingAESKey = process.env.WECHAT_ENCODING_AES_KEY;
    this.accessToken = null;
    this.tokenExpireTime = null;
  }

  // 获取访问令牌
  async getAccessToken() {
    if (this.accessToken && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
        params: {
          corpid: this.corpId,
          corpsecret: this.corpSecret
        }
      });

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token;
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000; // 提前5分钟过期
        return this.accessToken;
      } else {
        throw new Error(`获取access_token失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取access_token错误:', error);
      throw error;
    }
  }

  // 发送消息
  async sendMessage(messageData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        messageData
      );

      if (response.data.errcode !== 0) {
        throw new Error(`发送消息失败: ${response.data.errmsg}`);
      }

      console.log('消息发送成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('发送消息错误:', error);
      throw error;
    }
  }

  // 验证签名
  verifySignature(signature, timestamp, nonce, echostr) {
    try {
      const sortedParams = [this.token, timestamp, nonce, echostr].sort();
      const sha1 = crypto.createHash('sha1');
      sha1.update(sortedParams.join(''));
      const calculatedSignature = sha1.digest('hex');
      
      return calculatedSignature === signature;
    } catch (error) {
      console.error('签名验证错误:', error);
      return false;
    }
  }

  // 构建文本消息
  buildTextMessage(userId, content) {
    return {
      touser: userId,
      msgtype: 'text',
      agentid: this.agentId,
      text: {
        content: content
      }
    };
  }
}

module.exports = new WechatService();