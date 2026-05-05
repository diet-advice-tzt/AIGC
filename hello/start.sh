#!/bin/sh

# 启动后端服务
cd /app/server && node server.js &

# 启动 Nginx
nginx -g "daemon off;"