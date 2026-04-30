import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('代理错误 - 请确保后端已启动在 8080 端口');
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              code: 0,
              msg: '后端服务未启动，请先启动 Spring Boot 服务 (端口 8080)'
            }));
          });
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    }
  }
})