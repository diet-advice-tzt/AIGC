#!/bin/bash
# Race AI 阿里云一键部署脚本
# 使用方法: bash deploy.sh your-domain.com your-dashscope-api-key

set -e

echo "=========================================="
echo "    Race AI 阿里云一键部署脚本"
echo "=========================================="
echo ""

# 参数检查
if [ $# -lt 1 ]; then
    echo "❌ 使用方法: bash deploy.sh <域名> [API_KEY]"
    exit 1
fi

DOMAIN=$1
API_KEY=${2:-""}

echo "📋 部署信息:"
echo "  域名: $DOMAIN"
echo "  API Key: ${API_KEY:-未设置}"
echo ""

# 1. 更新系统
echo "🔄 正在更新系统..."
yum update -y -q

# 2. 安装依赖
echo "📦 正在安装依赖..."

# Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs -q
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 -q
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    yum install -y nginx -q
    systemctl enable nginx
    systemctl start nginx
fi

# 3. 创建目录结构
echo "📁 正在创建目录结构..."
mkdir -p /opt/race-app/{server,client}
mkdir -p /var/log/race-server

# 4. 上传文件（假设已上传到 /tmp/race-app.tar.gz）
if [ -f /tmp/race-app.tar.gz ]; then
    echo "📥 正在解压文件..."
    tar -xzf /tmp/race-app.tar.gz -C /opt/race-app/
else
    echo "⚠️ 警告: 未找到 /tmp/race-app.tar.gz"
    echo "请先将部署包上传到 /tmp/race-app.tar.gz"
fi

# 5. 安装后端依赖
echo "⚙️ 正在安装后端依赖..."
cd /opt/race-app/server
npm install --production -q

# 6. 配置环境变量
echo "🔧 正在配置环境变量..."
cat > /opt/race-app/server/.env << EOF
PORT=8080
HOST=0.0.0.0
DB_PATH=./data/race.db
CORS_ORIGIN=*
DASHSCOPE_API_KEY=${API_KEY}
DASHSCOPE_IMAGE_MODEL=qwen-image-2.0-pro
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com
JWT_SECRET=$(openssl rand -hex 32)
EOF

# 7. 创建 PM2 配置
echo "🔧 正在配置 PM2..."
cat > /opt/race-app/server/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'race-server',
    script: 'server.js',
    cwd: '/opt/race-app/server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '256M',
    env: { NODE_ENV: 'production', PORT: 8080 },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/race-server/error.log',
    out_file: '/var/log/race-server/output.log',
    merge_logs: true,
    autorestart: true
  }]
};
EOF

# 8. 配置 Nginx
echo "🔧 正在配置 Nginx..."
cat > /etc/nginx/conf.d/race.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root /opt/race-app/client;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /realtime/ {
        proxy_pass http://localhost:8080/realtime/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# 9. 启动服务
echo "🚀 正在启动服务..."

# 启动后端
pm2 start /opt/race-app/server/ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save

# 重启 Nginx
systemctl reload nginx

# 10. 配置防火墙
echo "🔥 正在配置防火墙..."
firewall-cmd --add-service=http --permanent
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 服务状态:"
pm2 status

echo ""
echo "🌐 访问地址:"
echo "  前端页面: http://${DOMAIN}"
echo "  后端API: http://${DOMAIN}/api"
echo "  健康检查: http://${DOMAIN}/api/health"

echo ""
echo "📝 管理命令:"
echo "  pm2 status          - 查看状态"
echo "  pm2 logs race-server - 查看日志"
echo "  pm2 restart race-server - 重启服务"
echo "  systemctl status nginx - 查看 Nginx 状态"