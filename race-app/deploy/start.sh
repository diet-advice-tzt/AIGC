#!/bin/bash
# Race AI 启动脚本

echo "=========================================="
echo "        Race AI 服务启动脚本"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    exit 1
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ 错误: 未安装 PM2"
    echo "请运行: npm install -g pm2"
    exit 1
fi

# 进入服务目录
cd /opt/race-app/server

# 安装依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install --production
fi

# 启动服务
echo "🚀 正在启动服务..."
pm2 start ecosystem.config.js

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📋 管理命令:"
echo "  pm2 status          - 查看状态"
echo "  pm2 logs race-server - 查看日志"
echo "  pm2 restart race-server - 重启服务"
echo ""
echo "🌐 访问地址:"
echo "  API: http://localhost:8080"
echo "  健康检查: http://localhost:8080/health"