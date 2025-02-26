// /home/ubuntu/eliza/discord/ecosystem.config.js
module.exports = {
    apps: [{
      name: "discord-cluster",
      script: "src/index.js",
      instances: "max", // 根据CPU核心数自动扩展
      exec_mode: "cluster",
      max_memory_restart: "800M",
      min_uptime: "60s",
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 30000,
      
      // 智能重启策略
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      
      // 日志配置
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      combine_logs: true,
      
      // 环境配置
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Shanghai",
        UV_THREADPOOL_SIZE: 64
      },
      env_production: {
        DISABLE_DEBUG: "true",
        MEMORY_CACHE_LIMIT: "512mb"
      },
      
      // 进程监控
      watch: ["src"],
      ignore_watch: [
        "node_modules",
        "logs",
        ".git",
        "config/*.json"
      ],
      
      // 性能调优
      node_args: [
        "--max-old-space-size=1024",
        "--trace-warnings",
        "--async-stack-traces"
      ]
    }]
  };