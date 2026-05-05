# Race AI 阿里云部署指南

## 一、环境要求

### 服务器配置
- **操作系统**: CentOS 7 / Ubuntu 18.04+
- **内存**: 至少 2GB
- **CPU**: 至少 1核
- **端口**: 80, 443, 8080

### 软件依赖
- Node.js 20+
- Nginx（可选，用于反向代理）
- PM2（进程管理）

---

## 二、部署步骤

### 1. 连接服务器

```bash
ssh root@your-server-ip
```

### 2. 安装依赖

#### CentOS 7
```bash
# 安装 Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 Nginx（可选）
yum install -y nginx
```

#### Ubuntu
```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 Nginx（可选）
apt-get install -y nginx
```

### 3. 上传文件

使用 FTP 或 scp 将 `race-app/` 目录上传到服务器：

```bash
scp -r race-app root@your-server-ip:/opt/
```

### 4. 配置环境变量

编辑 `/opt/race-app/server/.env` 文件：

```env
# 服务器配置
PORT=8080
HOST=0.0.0.0

# 数据库配置
DB_PATH=./data/race.db

# CORS配置
CORS_ORIGIN=*

# 阿里云 DashScope API
DASHSCOPE_API_KEY=your-api-key-here
DASHSCOPE_IMAGE_MODEL=qwen-image-2.0-pro
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com

# JWT密钥
JWT_SECRET=your-jwt-secret-here
```

### 5. 启动服务

```bash
cd /opt/race-app/server

# 安装依赖
npm install

# 使用 PM2 启动
pm2 start server.js --name race-server

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置 Nginx（可选）

创建配置文件 `/etc/nginx/conf.d/race.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/race-app/client;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 支持
    location /realtime/ {
        proxy_pass http://localhost:8080/realtime/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

重启 Nginx：
```bash
systemctl restart nginx
```

### 7. 配置安全组

在阿里云控制台配置安全组规则：

| 端口 | 协议 | 来源 | 说明 |
|------|------|------|------|
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS（可选） |
| 8080 | TCP | 0.0.0.0/0 | 后端服务（可选） |

---

## 三、管理命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs race-server

# 重启服务
pm2 restart race-server

# 停止服务
pm2 stop race-server

# 查看 PM2 状态
pm2 monit
```

---

## 四、项目结构

```
/opt/race-app/
├── client/              # 前端静态文件
│   ├── index.html
│   └── assets/
├── server/              # 后端服务
│   ├── server.js        # 入口文件
│   ├── node_modules/    # 依赖
│   ├── .env             # 环境变量
│   └── data/            # 数据库文件
└── deploy/              # 部署相关
    └── README.md
```

---

## 五、常见问题

### Q1: 服务启动失败？
```bash
# 检查端口是否被占用
netstat -tlnp | grep 8080

# 查看详细错误日志
pm2 logs race-server
```

### Q2: 前端页面无法访问？
- 确保 Nginx 配置正确
- 检查安全组规则
- 确保前端文件路径正确

### Q3: API 请求失败？
- 检查后端服务是否运行
- 检查环境变量配置
- 检查防火墙规则

---

## 六、HTTPS 配置（可选）

### 使用 Let's Encrypt

```bash
# 安装 Certbot
yum install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

---

## 七、备份与恢复

### 备份数据库
```bash
cp /opt/race-app/server/data/race.db /opt/race-app/server/data/race.db.backup
```

### 恢复数据库
```bash
cp /opt/race-app/server/data/race.db.backup /opt/race-app/server/data/race.db
pm2 restart race-server
```

---

## 联系方式

如有问题，请联系开发团队。

---

*文档版本: 1.0*
*更新时间: 2026-05-04*