// ecosystem.config.js — PM2 cluster mode for Vastra-Verse on EC2 t3.small
// Run: pm2 start ecosystem.config.js --env production
// Then: pm2 save && pm2 startup

module.exports = {
    apps: [
        {
            // ── Next.js Web Server ──────────────────────────────────────────
            name: 'vastra-verse',
            script: 'node_modules/.bin/next',
            args: 'start -p 3000',

            // Cluster mode = 1 process per CPU core (t3.small has 2 vCPUs)
            // Doubles request throughput with zero extra RAM for Node overhead
            instances: 2,
            exec_mode: 'cluster',

            // Restart worker if it uses too much memory (safe ceiling on 2GB RAM)
            max_memory_restart: '450M',

            // Graceful reload — finish in-flight requests before restart
            wait_ready: true,
            listen_timeout: 15000,
            kill_timeout: 5000,

            // Auto-restart on crash with backoff
            autorestart: true,
            max_restarts: 10,
            restart_delay: 3000,

            // Environment
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            // Logging
            out_file: '/home/ubuntu/logs/vastra-verse-out.log',
            error_file: '/home/ubuntu/logs/vastra-verse-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true,
            // Rotate logs to prevent disk fill on t3.small
            max_size: '50M',
            retain: 5,
        },

        {
            // ── BullMQ Background Worker ────────────────────────────────────
            name: 'vastra-worker',
            script: 'npx',
            args: 'tsx workers/index.ts',

            // Workers don't benefit from cluster — keep single fork
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
