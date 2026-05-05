module.exports = {
  apps: [{
    name: 'race-server',
    script: 'server.js',
    cwd: '/opt/race-app/server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      HOST: '0.0.0.0'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/race-server/error.log',
    out_file: '/var/log/race-server/output.log',
    merge_logs: true,
    autorestart: true,
    restart_delay: 3000
  }]
};