#!/bin/bash
# ============================================================
# Vastra-Verse EC2 Production Optimization Setup Script
# Run ONCE on your EC2 instance:  bash docs/ec2-setup.sh
# ============================================================
set -e

echo "🚀 Starting Vastra-Verse EC2 optimization..."

# ── 1. System packages ─────────────────────────────────────
sudo apt-get update -q
sudo apt-get install -y nginx certbot python3-certbot-nginx

# ── 2. Swap — prevent OOM on t3.small (2GB RAM) ───────────
if ! sudo swapon --show | grep -q /swapfile; then
    echo "📦 Creating 2GB swapfile..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created"
else
    echo "✅ Swap already exists"
fi

# ── 3. Kernel tuning ───────────────────────────────────────
cat << 'EOF' | sudo tee -a /etc/sysctl.conf

# Vastra-Verse performance tuning
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
net.core.netdev_max_backlog=5000
EOF
sudo sysctl -p

# ── 4. File descriptor limits ──────────────────────────────
cat << 'EOF' | sudo tee -a /etc/security/limits.conf

ubuntu soft nofile 65536
ubuntu hard nofile 65536
root   soft nofile 65536
root   hard nofile 65536
EOF

# ── 5. Nginx config ────────────────────────────────────────
echo "⚙️  Configuring Nginx..."
sudo cp /home/ubuntu/vastra-verse/docs/nginx.conf /etc/nginx/sites-available/vastra-verse
sudo ln -sf /etc/nginx/sites-available/vastra-verse /etc/nginx/sites-enabled/vastra-verse
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t && echo "✅ Nginx config valid"

# ── 6. Logs directory ──────────────────────────────────────
mkdir -p /home/ubuntu/logs

# ── 7. PM2 cluster mode ────────────────────────────────────
echo "⚙️  Configuring PM2..."
cd /home/ubuntu/vastra-verse

# Stop old processes
pm2 delete all 2>/dev/null || true

# Start with cluster config
pm2 start ecosystem.config.js --env production
pm2 save

# Auto-start on reboot
pm2 startup | tail -1 | sudo bash -

# ── 8. Reload Nginx ───────────────────────────────────────
sudo systemctl reload nginx

echo ""
echo "✅ EC2 optimization complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "📊 Memory:"
free -h
echo ""
echo "📊 Nginx:"
sudo systemctl status nginx --no-pager | head -5
