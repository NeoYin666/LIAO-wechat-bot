#!/bin/bash

# 阿里云服务器部署脚本
# 使用方法: ./deploy.sh [服务器IP]

SERVER_IP=${1:-"8.217.9.126"}
SERVER_USER="root"
PROJECT_NAME="wechat-customer-service"
REMOTE_DIR="/opt/$PROJECT_NAME"

echo "🚀 开始部署到阿里云服务器: $SERVER_IP"

# 1. 打包项目文件
echo "📦 打包项目文件..."
tar -czf $PROJECT_NAME.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  --exclude=*.log \
  src/ package.json package-lock.json .env.example README.md

# 2. 上传到服务器
echo "⬆️  上传文件到服务器..."
scp $PROJECT_NAME.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# 3. 服务器端部署
echo "🔧 在服务器端执行部署..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
  # 安装Node.js (如果未安装)
  if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
  fi
  
  # 安装PM2 (如果未安装)
  if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
  fi
  
  # 创建独立项目目录 (避免影响现有项目)
  mkdir -p /opt/wechat-customer-service
  cd /opt/wechat-customer-service
  
  # 解压项目文件
  tar -xzf /tmp/wechat-customer-service.tar.gz
  
  # 安装依赖
  echo "安装项目依赖..."
  npm install --production
  
  # 复制环境变量文件
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "请编辑 /opt/wechat-customer-service/.env 文件，填入正确的配置信息"
  fi
  
  # 设置文件权限 (使用root用户，避免权限冲突)
  chown -R root:root /opt/wechat-customer-service
  chmod -R 755 /opt/wechat-customer-service
  
  echo "✅ 独立部署完成！使用独立端口3001避免冲突"
  echo "接下来请："
  echo "1. 编辑 /opt/wechat-customer-service/.env 文件，设置PORT=3001"
  echo "2. 运行: pm2 start /opt/wechat-customer-service/ecosystem.config.js"
  echo "3. 在阿里云安全组开放3001端口"
  echo "4. 微信回调URL: http://8.217.9.126:3001/webhook"
EOF

# 清理本地临时文件
rm $PROJECT_NAME.tar.gz

echo "🎉 部署脚本执行完成！"