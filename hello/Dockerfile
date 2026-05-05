# 使用 Node.js 20 作为基础镜像
FROM node:20-alpine

# 安装 Nginx
RUN apk add --no-cache nginx

# 设置工作目录
WORKDIR /app

# 复制后端代码
COPY node-server/ /app/server/
COPY client/ /app/client/

# 安装后端依赖
WORKDIR /app/server
RUN npm install --production

# 构建前端
WORKDIR /app/client
RUN npm install && npm run build

# 配置 Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/race.conf

# 暴露端口
EXPOSE 80 8080

# 启动脚本
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

WORKDIR /app
CMD ["/app/start.sh"]