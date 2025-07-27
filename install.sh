#!/bin/bash
# Fresh Installation Script for MoP Inscription Deck Tracker
# This script sets up the application from scratch with PM2 process management

set -e

echo "=== MoP Inscription Deck Tracker Installation ==="
echo "Setting up the application with PM2 process management..."

# Configuration
APP_DIR="/home/paccoco/MoP-Inscription-Deck-Tracker"
NODE_VERSION="16"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js if needed
install_nodejs() {
    if ! command_exists node; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Node.js is already installed: $(node --version)"
    fi
}

# Function to install PM2 if needed
install_pm2() {
    if ! command_exists pm2; then
        echo "Installing PM2..."
        npm install -g pm2
    else
        echo "PM2 is already installed: $(pm2 --version)"
    fi
}

# Function to setup database
setup_database() {
    echo "Setting up database..."
    cd "$APP_DIR"
    
    if [ ! -f "cards.db" ]; then
        echo "Creating new database..."
        # Database will be created automatically when the app starts
        # but we can run any initial setup here if needed
    else
        echo "Database already exists, backing up..."
        cp cards.db "cards.db.backup-$(date +%Y%m%d_%H%M%S)"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo "Installing server dependencies..."
    cd "$APP_DIR"
    npm install
    
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
}

# Function to build frontend
build_frontend() {
    echo "Building React frontend..."
    cd "$APP_DIR/client"
    npm run build
    cd ..
}

# Function to setup environment
setup_environment() {
    cd "$APP_DIR"
    
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cat > .env << EOF
# MoP Card Tracker Environment Configuration
PORT=5000
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production

# Admin Credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123

# Optional: Discord Webhook URL
# DISCORD_WEBHOOK_URL=

# Optional: Database path override
# DB_PATH=./cards.db
EOF
        echo "⚠️  IMPORTANT: Please edit .env file to set your admin credentials!"
    else
        echo ".env file already exists"
    fi
}

# Function to start with PM2
start_with_pm2() {
    echo "Starting application with PM2..."
    cd "$APP_DIR"
    
    # Stop existing instance if running
    pm2 stop mop-card-tracker 2>/dev/null || true
    pm2 delete mop-card-tracker 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup 2>/dev/null || echo "PM2 startup already configured"
    
    echo "Application started successfully!"
}

# Function to setup systemd service (alternative/backup)
setup_systemd() {
    echo "Setting up systemd service..."
    
    sudo tee /etc/systemd/system/cardtracker.service > /dev/null << EOF
[Unit]
Description=MoP Inscription Deck Tracker
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 stop all
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cardtracker

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable cardtracker
    echo "Systemd service created and enabled"
}

# Main installation process
main() {
    echo "Starting installation process..."
    
    # Update system packages
    echo "Updating system packages..."
    sudo apt-get update
    sudo apt-get install -y curl wget git sqlite3
    
    # Install Node.js and PM2
    install_nodejs
    install_pm2
    
    # Navigate to app directory
    if [ ! -d "$APP_DIR" ]; then
        echo "Error: Application directory $APP_DIR not found!"
        echo "Please clone the repository first:"
        echo "git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git $APP_DIR"
        exit 1
    fi
    
    cd "$APP_DIR"
    
    # Setup application
    setup_environment
    setup_database
    install_dependencies
    build_frontend
    
    # Start application
    start_with_pm2
    
    # Setup systemd service for auto-start
    setup_systemd
    
    echo ""
    echo "=== Installation Complete! ==="
    echo "Application is running at: http://localhost:5000"
    echo ""
    echo "Useful commands:"
    echo "  pm2 status                 - Check application status"
    echo "  pm2 logs mop-card-tracker  - View application logs"
    echo "  pm2 restart mop-card-tracker - Restart application"
    echo "  pm2 stop mop-card-tracker  - Stop application"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "1. Edit .env file to set admin credentials"
    echo "2. Configure firewall to allow port 5000"
    echo "3. Set up reverse proxy (nginx/apache) for production"
    echo ""
}

# Run main function
main "$@"
