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

  // 获取访问令牌（企业微信）
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

  // 获取微信客服访问令牌
  async getKfAccessToken() {
    if (this.kfAccessToken && this.kfTokenExpireTime && Date.now() < this.kfTokenExpireTime) {
      return this.kfAccessToken;
    }

    try {
      // 微信客服使用企业微信的access_token
      const corpAccessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/kf/account/add_contact_way?access_token=${corpAccessToken}`,
        {
          open_kfid: process.env.WECHAT_KF_ID,
          scene: '12345'
        }
      );

      if (response.data.errcode === 0) {
        this.kfAccessToken = corpAccessToken;
        this.kfTokenExpireTime = this.tokenExpireTime;
        return this.kfAccessToken;
      } else {
        // 如果没有配置微信客服，则使用企业微信token
        console.warn('微信客服token获取失败，使用企业微信token:', response.data.errmsg);
        return corpAccessToken;
      }
    } catch (error) {
      console.error('获取微信客服access_token错误:', error);
      // 降级使用企业微信token
      return await this.getAccessToken();
    }
  }

  // 发送消息
  async sendMessage(messageData) {
    try {
      let accessToken;
      let apiUrl;
      
      // 判断消息类型，选择对应的API
      if (messageData.touser && !messageData.agentid) {
        // 微信客服消息
        accessToken = await this.getKfAccessToken();
        apiUrl = `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${accessToken}`;
      } else {
        // 企业微信应用消息
        accessToken = await this.getAccessToken();
        apiUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
      }
      
      const response = await axios.post(apiUrl, messageData);

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

  // 发送微信客服消息
  async sendKfMessage(toUser, content, kfAccount) {
    try {
      const accessToken = await this.getKfAccessToken();
      
      const messageData = {
        touser: toUser,
        open_kfid: kfAccount || process.env.WECHAT_KF_ID,
        msgtype: 'text',
        text: {
          content: content
        }
      };
      
      const response = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${accessToken}`,
        messageData
      );

      if (response.data.errcode !== 0) {
        throw new Error(`发送微信客服消息失败: ${response.data.errmsg}`);
      }

      console.log('微信客服消息发送成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('发送微信客服消息错误:', error);
      throw error;
    }
  }

  // 验证签名（微信客服使用msg_signature）
  verifySignature(msgSignature, timestamp, nonce, echostr) {
    try {
      // 微信客服验证方式：将token、timestamp、nonce、echostr进行字典序排序
      const sortedParams = [this.token, timestamp, nonce, echostr].sort();
      const sha1 = crypto.createHash('sha1');
      sha1.update(sortedParams.join(''));
      const calculatedSignature = sha1.digest('hex');
      
      console.log('验证参数:', { 
        token: this.token, 
        timestamp, 
        nonce, 
        echostr,
        calculated: calculatedSignature,
        received: msgSignature 
      });
      
      return calculatedSignature === msgSignature;
    } catch (error) {
      console.error('签名验证错误:', error);
      return false;
    }
  }

  // 普通微信公众号签名验证
  verifyWechatSignature(signature, timestamp, nonce) {
    try {
      const sortedParams = [this.token, timestamp, nonce].sort();
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