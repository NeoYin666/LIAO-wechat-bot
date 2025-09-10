# 环境变量配置说明

## 必填项 ⚠️

### 基础回调验证必填项
```env
# 这个是验证回调URL必须的，在微信客服平台设置
WECHAT_TOKEN=your_custom_token_here
```

### 如果需要发送消息，以下为必填项
```env
# 企业微信基础信息
WECHAT_CORP_ID=your_corp_id_here          # 企业ID
WECHAT_CORP_SECRET=your_corp_secret_here   # 应用密钥
```

## 可选项 ✅

### 企业微信应用相关（如果使用企业微信应用发送消息）
```env
WECHAT_AGENT_ID=your_agent_id_here         # 应用ID，发送企业微信应用消息时需要
```

### 微信客服相关（如果使用微信客服发送消息）
```env
WECHAT_KF_ID=your_kf_account_id_here       # 客服账号ID，发送客服消息时需要
WECHAT_ENCODING_AES_KEY=your_43_char_aes_key_here  # AES密钥，消息加密时需要
```

### 服务器配置（有默认值）
```env
PORT=3000                    # 默认3000
NODE_ENV=production          # 默认development
LOG_LEVEL=info              # 默认info
```

## 配置场景

### 场景1：仅做回调URL验证 🔍
**最小配置**：
```env
WECHAT_TOKEN=your_token_123
```

### 场景2：验证 + 企业微信应用消息 💼
```env
WECHAT_TOKEN=your_token_123
WECHAT_CORP_ID=ww1234567890abcdef
WECHAT_CORP_SECRET=your_secret_here
WECHAT_AGENT_ID=1000001
```

### 场景3：验证 + 微信客服消息 🎧
```env
WECHAT_TOKEN=your_token_123
WECHAT_CORP_ID=ww1234567890abcdef
WECHAT_CORP_SECRET=your_secret_here
WECHAT_KF_ID=your_kf_id_here
```

### 场景4：完整配置（支持所有功能） 🚀
```env
WECHAT_CORP_ID=ww1234567890abcdef
WECHAT_CORP_SECRET=your_secret_here
WECHAT_AGENT_ID=1000001
WECHAT_TOKEN=your_token_123
WECHAT_ENCODING_AES_KEY=your_43_char_aes_key_here
WECHAT_KF_ID=your_kf_id_here
PORT=3000
NODE_ENV=production
```

## 获取方式

| 配置项 | 获取位置 | 说明 |
|--------|----------|------|
| `WECHAT_CORP_ID` | 企业微信管理后台 → 我的企业 | 企业ID |
| `WECHAT_CORP_SECRET` | 企业微信管理后台 → 应用管理 → 自建应用 | 应用的Secret |
| `WECHAT_AGENT_ID` | 企业微信管理后台 → 应用管理 → 自建应用 | 应用的AgentId |
| `WECHAT_TOKEN` | 微信客服平台 → 开发配置 | 自定义Token |
| `WECHAT_ENCODING_AES_KEY` | 微信客服平台 → 开发配置 | 43位随机字符串 |
| `WECHAT_KF_ID` | 微信客服平台 → 客服账号管理 | 客服账号的open_kfid |

## 注意事项

1. **WECHAT_TOKEN** 是最基础的必填项，用于验证微信服务器的回调请求
2. 如果只需要验证URL，只填 `WECHAT_TOKEN` 即可
3. 如果需要发送消息，必须填写 `WECHAT_CORP_ID` 和 `WECHAT_CORP_SECRET`
4. `WECHAT_AGENT_ID` 和 `WECHAT_KF_ID` 根据你要使用的消息发送方式选择填写
5. 服务器配置项都有默认值，可以不填
