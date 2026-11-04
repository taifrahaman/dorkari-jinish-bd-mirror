// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "dorkari-jinish-bd",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "400M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
