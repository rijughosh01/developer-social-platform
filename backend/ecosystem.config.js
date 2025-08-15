module.exports = {
  apps: [
    {
      name: "devlink-backend",
      script: "server.js",
      instances: process.env.NODE_ENV === "production" ? "max" : 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
        USE_REDIS: "false",
        INSTANCE_VAR: "INSTANCE_ID",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        USE_REDIS: "true",
        INSTANCE_VAR: "INSTANCE_ID",
      },

      instance_var: "INSTANCE_ID",
      // Health check
      health_check_grace_period: 3000,

      max_restarts: 10,
      min_uptime: "10s",

      max_memory_restart: "1G",
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      sticky: true,

      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],
};
