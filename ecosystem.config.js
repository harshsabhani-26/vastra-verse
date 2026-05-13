// ============================================================
// AWS EC2 + PM2 CONFIG — ARCHIVED (not used on Render.com)
// ============================================================
// This file is kept as reference for re-deploying on EC2.
// On Render.com, Render manages the process — PM2 is NOT needed.
//
// TO REACTIVATE FOR EC2:
//   1. Rename this file back to: ecosystem.config.js
//   2. SSH into EC2 and run:
//      pm2 start ecosystem.config.js --env production
//      pm2 save && pm2 startup
// ============================================================

/*
module.exports = {
    apps: [
        {
            // ── Next.js Web Server ──────────────────────────────────────────
            name: 'vastra-verse',
            script: 'node_modules/.bin/next',
            args: 'start -p 3000',

            // Cluster mode = 1 process per CPU core (t3.small has 2 vCPUs)
            instances: 2,
            exec_mode: 'cluster',

            max_memory_restart: '450M',
            wait_ready: true,
            listen_timeout: 15000,
            kill_timeout: 5000,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 3000,

            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            out_file: '/home/ubuntu/logs/vastra-verse-out.log',
            error_file: '/home/ubuntu/logs/vastra-verse-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true,
            max_size: '50M',
            retain: 5,
        },

        {
            // ── BullMQ Background Worker ────────────────────────────────────
            name: 'vastra-worker',
            script: 'npx',
            args: 'tsx workers/index.ts',

            instances: 1,
            exec_mode: 'fork',

            max_memory_restart: '300M',
            autorestart: true,
            max_restarts: 5,
            restart_delay: 5000,

            env_production: {
                NODE_ENV: 'production',
            },

            out_file: '/home/ubuntu/logs/worker-out.log',
            error_file: '/home/ubuntu/logs/worker-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true,
        },
    ],
};
*/
