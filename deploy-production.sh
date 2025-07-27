#!/bin/bash
# Production Deployment Script for MoP Inscription Deck Tracker
# This script handles production deployment with proper security and configuration

set -e

echo "=== MoP Inscription Deck Tracker - Production Deployment ==="

# Configuration - modify these for your environment
APP_DIR="/opt/mop-card-tracker"
APP_USER="mop-tracker"
DOMAIN="your-domain.com"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root (use sudo)"
        exit 1
    fi
}

# Function to create application user
create_app_user() {
    if ! id "$APP_USER" &>/dev/null; then
        print_status "Creating application user: $APP_USER"
        useradd --system --shell /bin/bash --home-dir "$APP_DIR" --create-home "$APP_USER"
    else
        print_status "Application user $APP_USER already exists"
    fi
}

# Function to install system dependencies
install_system_dependencies() {
    print_status "Installing system dependencies..."
    apt-get update
    apt-get install -y curl wget git sqlite3 nginx certbot python3-certbot-nginx ufw
    
    # Install Node.js via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
}

# Function to setup application
setup_application() {
    print_status "Setting up application..."
    
    # Clone or update repository
    if [ ! -d "$APP_DIR/.git" ]; then
        print_status "Cloning repository..."
        git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git "$APP_DIR"
    else
        print_status "Updating repository..."
        cd "$APP_DIR"
        git fetch origin
        git checkout main
        git pull origin main
    fi
    
    # Set ownership
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    # Install dependencies as app user
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm install"
    sudo -u "$APP_USER" bash -c "cd $APP_DIR/client && npm install"
    
    # Build frontend
    sudo -u "$APP_USER" bash -c "cd $APP_DIR/client && npm run build"
    
    # Create logs directory
    sudo -u "$APP_USER" mkdir -p "$APP_DIR/logs"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f "$APP_DIR/.env" ]; then
        # Generate secure JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        
        # Create .env file
        cat > "$APP_DIR/.env" << EOF
# MoP Card Tracker Production Configuration
NODE_ENV=production
PORT=5000
JWT_SECRET=$JWT_SECRET

# Database Configuration
DB_PATH=$APP_DIR/cards.db

# Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -base64 12)

# Optional: Discord Webhook
# DISCORD_WEBHOOK_URL=

# Optional: External Database URL
# DATABASE_URL=
EOF
        
        chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
        chmod 600 "$APP_DIR/.env"
        
        print_warning "Default admin password generated. Check $APP_DIR/.env"
    else
        print_status "Environment file already exists"
    fi
}

# Function to setup PM2
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    # Start application with PM2 as app user
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
    sudo -u "$APP_USER" bash -c "pm2 save"
    
    # Setup PM2 startup script
    env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR"
    sudo -u "$APP_USER" pm2 save
}

# Function to setup nginx
setup_nginx() {
    print_status "Setting up Nginx reverse proxy..."
    
    # Create nginx configuration
    cat > "$NGINX_AVAILABLE/mop-card-tracker" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Main proxy configuration
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Rate limiting
http {
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
}
EOF
    
    # Enable site
    ln -sf "$NGINX_AVAILABLE/mop-card-tracker" "$NGINX_ENABLED/"
    
    # Remove default site if exists
    rm -f "$NGINX_ENABLED/default"
    
    # Test nginx configuration
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    systemctl enable nginx
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    print_status "Setting up SSL certificate with Let's Encrypt..."
    
    # Obtain SSL certificate
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"
    
    # Setup auto-renewal
    systemctl enable certbot.timer
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall rules..."
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful with this!)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 'Nginx Full'
    
    # Enable firewall
    ufw --force enable
}

# Function to create monitoring script
create_monitoring() {
    print_status "Creating monitoring script..."
    
    cat > "$APP_DIR/monitor.sh" << 'EOF'
#!/bin/bash
# Health monitoring script for MoP Card Tracker

APP_DIR="/opt/mop-card-tracker"
LOG_FILE="$APP_DIR/logs/health.log"

check_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check PM2 process
    if ! pm2 list | grep -q "mop-card-tracker.*online"; then
        echo "[$timestamp] ERROR: PM2 process not running" >> "$LOG_FILE"
        pm2 start ecosystem.config.js
        return 1
    fi
    
    # Check application response
    if ! curl -f http://localhost:5000/api/version >/dev/null 2>&1; then
        echo "[$timestamp] ERROR: Application not responding" >> "$LOG_FILE"
        pm2 restart mop-card-tracker
        return 1
    fi
    
    # Check disk space
    local disk_usage=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        echo "[$timestamp] WARNING: Disk usage at $disk_usage%" >> "$LOG_FILE"
    fi
    
    echo "[$timestamp] OK: All checks passed" >> "$LOG_FILE"
}

check_health
EOF
    
    chmod +x "$APP_DIR/monitor.sh"
    chown "$APP_USER:$APP_USER" "$APP_DIR/monitor.sh"
    
    # Add to crontab
    (sudo -u "$APP_USER" crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh") | sudo -u "$APP_USER" crontab -
}

# Function to show completion summary
show_summary() {
    echo ""
    echo "=== Deployment Complete! ==="
    echo ""
    print_status "Application URL: http://$DOMAIN"
    print_status "Admin credentials in: $APP_DIR/.env"
    echo ""
    print_status "Management commands:"
    echo "  sudo -u $APP_USER pm2 status"
    echo "  sudo -u $APP_USER pm2 logs mop-card-tracker"
    echo "  sudo -u $APP_USER pm2 restart mop-card-tracker"
    echo ""
    print_status "Nginx commands:"
    echo "  sudo systemctl status nginx"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
    echo ""
    print_warning "Next steps:"
    echo "1. Edit $APP_DIR/.env to set admin credentials"
    echo "2. Configure DNS to point $DOMAIN to this server"
    echo "3. Test the application and SSL certificate"
    echo "4. Setup database backups"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting production deployment..."
    
    # Check if domain is provided
    if [ "$DOMAIN" = "your-domain.com" ]; then
        print_error "Please edit this script and set your domain name"
        exit 1
    fi
    
    check_root
    create_app_user
    install_system_dependencies
    setup_application
    setup_environment
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    create_monitoring
    show_summary
}

# Run deployment
main "$@"
