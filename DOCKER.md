# Docker Deployment Guide
# MoP Inscription Deck Tracker v2.0+

## 🚀 Quick Start

### One-Command Setup
```bash
# Clone repository and start with Docker
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker
./docker/scripts/setup.sh
```

This automatically:
- ✅ Checks Docker installation
- ✅ Creates data directories and sets permissions
- ✅ Generates secure environment configuration
- ✅ Builds optimized Docker images
- ✅ Starts PostgreSQL database and web application
- ✅ Runs health checks and initialization

**Access your application at:** `http://localhost:5000`

## 📋 Prerequisites

### System Requirements
- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+
- **RAM**: 2GB minimum (4GB recommended)
- **Disk**: 5GB available space
- **OS**: Linux, macOS, or Windows with WSL2

### Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Or use your package manager
sudo apt install docker.io docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🏗️ Architecture Overview

### Container Stack
```
┌─────────────────────────────────────────┐
│  🌐 Nginx (Optional)                    │
│  - SSL Termination                      │
│  - Load Balancing                       │
│  - Static File Serving                  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│  🚀 Web Application                     │
│  - Node.js + Express API               │
│  - React Frontend (built)               │
│  - JWT Authentication                   │
│  - Connection Pooling                   │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│  🐘 PostgreSQL Database                 │
│  - Persistent Data Storage              │
│  - Optimized Configuration              │
│  - Automated Backups                    │
│  - Health Monitoring                    │
└─────────────────────────────────────────┘
```

### Data Persistence
```
./data/
├── postgres/          # Database files
├── backups/           # Database backups
├── logs/              # Application logs
├── app-backups/       # Application backups
├── ssl/               # SSL certificates
└── nginx-logs/        # Nginx logs
```

## 🔧 Configuration

### Environment Variables
The `.env` file controls all configuration:

```bash
# Application Ports
APP_PORT=5000
HTTP_PORT=80
HTTPS_PORT=443

# Database Configuration
DB_NAME=mop_card_tracker
DB_USER=mop_tracker_app
DB_PASSWORD=auto_generated_secure_password

# Security (auto-generated)
JWT_SECRET=auto_generated_48_char_secret
JWT_REFRESH_SECRET=auto_generated_48_char_secret
BCRYPT_ROUNDS=12

# Performance Tuning
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=300
DB_POOL_SIZE=20

# Notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_ENABLE=true
GOTIFY_DEFAULT_SERVER=https://push.your-domain.com
```

### Custom Configuration
```bash
# Copy and modify environment
cp .env.docker .env
nano .env

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 🚀 Deployment Modes

### 1. Development Mode
```bash
# Start development environment with hot reloading
docker-compose -f docker-compose.dev.yml up -d

# Includes:
# - Hot reloading for backend and frontend
# - Debug logging
# - pgAdmin interface at http://localhost:8080
# - React dev server at http://localhost:3000
# - API server at http://localhost:5001
```

### 2. Production Mode
```bash
# Start production environment
docker-compose up -d

# Features:
# - Optimized builds
# - Security headers
# - Rate limiting
# - Performance monitoring
# - Automated backups
```

### 3. Production with SSL
```bash
# Start with Nginx reverse proxy
docker-compose --profile nginx up -d

# Add SSL certificates to ./data/ssl/
# Configure domain in ./docker/nginx/default.conf
```

## 📊 Management Commands

### Service Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart web

# View logs
docker-compose logs -f web
docker-compose logs -f database

# Monitor resource usage
docker stats

# Service status
docker-compose ps
```

### Database Management
```bash
# Connect to database
docker-compose exec database psql -U mop_tracker_app -d mop_card_tracker

# Create backup
docker-compose exec database pg_dump -U mop_tracker_app -d mop_card_tracker > backup.sql

# Restore backup
docker-compose exec -T database psql -U mop_tracker_app -d mop_card_tracker < backup.sql

# Database statistics
docker-compose exec database psql -U mop_tracker_app -d mop_card_tracker -c "\dt+"
```

### Application Management
```bash
# Execute commands in web container
docker-compose exec web node --version
docker-compose exec web npm --version

# Access container shell
docker-compose exec web sh

# View application logs
docker-compose exec web tail -f logs/application.log

# Check health status
curl http://localhost:5000/api/health
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or use update script
./docker/scripts/update.sh
```

### Backup Strategy
```bash
# Create complete backup
./docker/scripts/backup.sh

# Automated daily backups (cron)
0 2 * * * /path/to/project/docker/scripts/backup.sh
```

### Health Monitoring
```bash
# Check all container health
docker-compose ps

# Detailed health information
docker inspect --format='{{.State.Health.Status}}' mop-tracker-web
docker inspect --format='{{.State.Health.Status}}' mop-tracker-db

# Health check endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/database
```

## 🔒 Security Configuration

### Production Security Checklist
- [ ] **Strong Passwords**: Generated secure database and JWT secrets
- [ ] **Environment Isolation**: All secrets in environment variables
- [ ] **Network Security**: Services communicate via internal Docker network
- [ ] **Container Security**: Non-root user, minimal attack surface
- [ ] **SSL/TLS**: HTTPS enabled with valid certificates
- [ ] **Rate Limiting**: Configured for production traffic patterns
- [ ] **Regular Updates**: Automated security updates enabled

### SSL Setup
```bash
# 1. Obtain SSL certificates (Let's Encrypt example)
docker run --rm -v $(pwd)/data/ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d your-domain.com \
  --email your-email@domain.com \
  --agree-tos

# 2. Start with SSL
docker-compose --profile nginx up -d
```

## 🐛 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker-compose logs web
docker-compose logs database

# Check disk space
df -h

# Check memory usage
free -m

# Restart Docker daemon
sudo systemctl restart docker
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose exec web pg_isready -h database -p 5432

# Check database logs
docker-compose logs database

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Permission Issues
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER ./data
chmod -R 755 ./data
```

#### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :5432

# Change ports in .env file
APP_PORT=5001
DB_PORT=5433
```

### Performance Tuning
```bash
# Increase PostgreSQL performance
# Edit docker-compose.yml database command section:
command: >
  postgres 
  -c max_connections=200
  -c shared_buffers=512MB
  -c effective_cache_size=2GB
  -c work_mem=8MB

# Monitor container resources
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 📈 Monitoring and Logging

### Log Management
```bash
# View real-time logs
docker-compose logs -f

# Log rotation (add to docker-compose.yml)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

# Export logs
docker-compose logs --since 24h > logs/last-24h.log
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Database performance
docker-compose exec database psql -U mop_tracker_app -d mop_card_tracker -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

## 🚀 Production Deployment

### Recommended Production Setup
```bash
# 1. Clone to production server
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker

# 2. Configure for production
cp .env.docker .env
nano .env  # Set production values

# 3. Setup with SSL
docker-compose --profile nginx up -d

# 4. Configure reverse proxy and SSL
# Edit ./docker/nginx/default.conf with your domain

# 5. Setup automated backups
crontab -e
# Add: 0 2 * * * /path/to/project/docker/scripts/backup.sh
```

### Production Environment Variables
```bash
# Production-specific settings
NODE_ENV=production
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true

# Strong security
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
JWT_EXPIRATION=1h

# SSL Configuration
HTTPS_PORT=443
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

---

## 📞 Support

### Getting Help
- **Documentation**: This guide covers most scenarios
- **Logs**: Always check container logs first
- **GitHub Issues**: Report bugs with logs and configuration
- **Discord**: Join our community for real-time help

### Useful Resources
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL Docker**: https://hub.docker.com/_/postgres
- **Docker Compose**: https://docs.docker.com/compose/

---

**🎉 Congratulations!** You now have a fully containerized, production-ready MoP Inscription Deck Tracker running with PostgreSQL, optimized for performance, security, and easy management.
