#!/bin/bash

# 微信客服Docker部署脚本
echo "🚀 开始部署微信客服Docker容器..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，正在安装..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，正在安装..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 停止现有容器（如果存在）
echo "🛑 停止现有服务..."
docker-compose down 2>/dev/null || true

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

# 构建并启动容器
echo "🔧 构建并启动容器..."
docker-compose up --build -d

# 检查容器状态
echo "📊 检查容器状态..."
sleep 10
docker-compose ps

# 测试健康状态
echo "🏥 测试服务健康状态..."
sleep 5
curl -f http://localhost:3001/health && echo "✅ 服务启动成功!" || echo "❌ 服务启动失败!"

# 显示日志
echo "📝 显示最近日志..."
docker-compose logs --tail=20

echo "🎉 部署完成!"
echo "📍 服务地址: http://localhost:3001"
echo "🔍 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"
