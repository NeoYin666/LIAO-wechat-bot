// PM2进程管理配置文件
module.exports = {
  apps: [{
    name: 'wechat-customer-service',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }],

  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP', // 替换为你的服务器IP
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO', // 如果使用Git部署的话
      path: '/var/www/wechat-customer-service',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};