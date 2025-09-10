const crypto = require('crypto');
const logger = require('./logger');

class WechatVerifier {
  constructor() {
    this.token = process.env.WECHAT_TOKEN;
    this.encodingAESKey = process.env.WECHAT_ENCODING_AES_KEY;
    this.corpId = process.env.WECHAT_CORP_ID;
    
    // 检查配置是否完整
    if (this.token && this.encodingAESKey && this.corpId) {
      // 将43位Base64编码的AESKey解码为32字节密钥
      this.aesKey = Buffer.from(this.encodingAESKey + '=', 'base64');
      logger.info('✅ 企业微信验证器初始化成功');
    } else {
      logger.warn('⚠️ 企业微信验证器初始化失败，缺少必要配置:', {
        token: !!this.token,
        encodingAESKey: !!this.encodingAESKey,
        corpId: !!this.corpId
      });
    }
  }

  /**
   * 企业微信URL验证 - 完整的验证流程
   * @param {string} msgSignature - 企业微信加密签名
   * @param {string} timestamp - 时间戳
   * @param {string} nonce - 随机数
   * @param {string} echostr - 加密的字符串
   * @returns {string|null} - 验证成功返回明文echostr，失败返回null
   */
  verifyUrl(msgSignature, timestamp, nonce, echostr) {
    if (!this.isConfigured()) {
      logger.error('❌ 企业微信验证器未正确初始化');
      return null;
    }

    try {
      logger.info('🔍 开始企业微信URL验证:', {
        msgSignature: msgSignature ? msgSignature.substring(0, 20) + '...' : 'undefined',
        timestamp,
        nonce,
        echostr: echostr ? echostr.substring(0, 50) + '...' : 'undefined'
      });

      // 1. URL解码
      const decodedEchostr = decodeURIComponent(echostr);
      
      // 2. 验证签名
      if (!this.verifySignature(msgSignature, timestamp, nonce, decodedEchostr)) {
        logger.error('❌ 签名验证失败');
        return null;
      }
      
      // 3. AES解密echostr
      const decryptResult = this.decryptEchostr(decodedEchostr);
      if (!decryptResult) {
        logger.error('❌ 解密失败');
        return null;
      }
      
      // 4. 验证CorpID
      if (decryptResult.corpId !== this.corpId) {
        logger.error('❌ CorpID验证失败:', {
          expected: this.corpId,
          received: decryptResult.corpId
        });
        return null;
      }
      
      logger.info('✅ 企业微信URL验证成功');
      return decryptResult.message;
      
    } catch (error) {
      logger.error('❌ 企业微信URL验证过程出错:', error);
      return null;
    }
  }

  /**
   * 验证签名
   */
  verifySignature(signature, timestamp, nonce, echostr) {
    try {
      const sortedParams = [this.token, timestamp, nonce, echostr].sort();
      const sortedString = sortedParams.join('');
      
      const sha1 = crypto.createHash('sha1');
      sha1.update(sortedString);
      const calculatedSignature = sha1.digest('hex');
      
      logger.info('签名验证:', {
        calculated: calculatedSignature,
        received: signature,
        isValid: calculatedSignature === signature
      });
      
      return calculatedSignature === signature;
    } catch (error) {
      logger.error('签名验证错误:', error);
      return false;
    }
  }

  /**
   * AES解密echostr
   */
  decryptEchostr(encryptedData) {
    try {
      const encrypted = Buffer.from(encryptedData, 'base64');
      const iv = this.aesKey.slice(0, 16);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.aesKey, iv);
      decipher.setAutoPadding(false);
      
      let decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      // 去除PKCS7填充
      const pad = decrypted[decrypted.length - 1];
      decrypted = decrypted.slice(0, decrypted.length - pad);
      
      // 解析: random(16) + msg_len(4) + msg + corpId
      const msgLen = decrypted.readUInt32BE(16);
      const message = decrypted.slice(20, 20 + msgLen).toString('utf8');
      const corpId = decrypted.slice(20 + msgLen).toString('utf8');
      
      return { message, corpId };
    } catch (error) {
      logger.error('解密错误:', error);
      return null;
    }
  }

  /**
   * 检查配置是否完整
   */
  isConfigured() {
    return !!(this.token && this.encodingAESKey && this.corpId && this.aesKey);
  }
}

module.exports = new WechatVerifier();