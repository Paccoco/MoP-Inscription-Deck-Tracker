# Docker Deployment Guide

*Complete containerization for MoP Inscription Deck Tracker - Version 2.0.0-alpha.1*

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum, 8GB recommended
- 10GB disk space

### One-Command Deployment

```bash
# Production deployment
./docker-scripts.sh deploy

# Development deployment  
./docker-scripts.sh deploy-dev
```

## 🏗️ Architecture Overview

### Production Stack
- **Web Container**: Node.js 18 Alpine + React build
- **Database Container**: PostgreSQL 15 Alpine
- **Volumes**: Persistent data and logs
- **Networks**: Isolated internal networking
- **Health Checks**: Automated monitoring and restart

### Development Stack
- **Web Container**: Node.js 18 with hot reload
- **Database Container**: PostgreSQL 15 (separate dev instance)
- **Volume Mounts**: Source code for live editing
- **Debug Tools**: Enhanced logging and debugging

## 📋 Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_NAME=mop_card_tracker
DB_USER=mop_tracker_app
DB_PASSWORD=secure_password_123

# Security
JWT_SECRET=your-64-character-secure-random-string
BCRYPT_ROUNDS=12

# Application
APP_PORT=5000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Notifications (Optional)
DISCORD_WEBHOOK_URL=
GOTIFY_DEFAULT_SERVER=
GOTIFY_ADMIN_TOKEN=
```

### Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate database password
openssl rand -base64 32
```

## 🐳 Docker Commands

### Management Script

The `docker-scripts.sh` provides easy management:

```bash
# Deployment
./docker-scripts.sh deploy          # Production
./docker-scripts.sh deploy-dev      # Development

# Monitoring
./docker-scripts.sh status          # Show status
./docker-scripts.sh logs            # Show logs
./docker-scripts.sh logs web        # Specific service logs

# Maintenance
./docker-scripts.sh stop            # Stop all services
./docker-scripts.sh restart         # Restart services
./docker-scripts.sh cleanup         # Clean up resources

# Database
./docker-scripts.sh backup          # Create backup
./docker-scripts.sh restore file.sql # Restore backup
```

### Manual Docker Commands

```bash
# Production
docker-compose up -d                # Start
docker-compose down                 # Stop
docker-compose logs -f              # Follow logs
docker-compose ps                   # Status

# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
```

## 🌐 Service Access

### Production
- **Application**: http://localhost:5000
- **Database**: localhost:5432
- **Health Check**: http://localhost:5000/api/health

### Development
- **Application**: http://localhost:5000
- **Database**: localhost:5433 (different port)
- **Health Check**: http://localhost:5000/api/health

## 📊 Monitoring & Health Checks

### Built-in Health Checks

Both containers include health checks:

```yaml
# Web application health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

# Database health check  
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U mop_tracker_app -d mop_card_tracker"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

### Monitoring Commands

```bash
# Check container health
docker-compose ps

# View detailed health status
docker inspect mop-tracker-web | jq '.[0].State.Health'
docker inspect mop-tracker-db | jq '.[0].State.Health'

# Monitor resource usage
docker stats mop-tracker-web mop-tracker-db
```

## 💾 Data Management

### Persistent Volumes

- **postgres_data**: Database files
- **app_logs**: Application logs
- **app_backups**: Backup files

### Backup & Restore

```bash
# Automated backup
./docker-scripts.sh backup

# Manual backup
docker-compose exec database pg_dump -U mop_tracker_app mop_card_tracker > backup.sql

# Restore from backup
./docker-scripts.sh restore backup.sql

# Manual restore
docker-compose exec -T database psql -U mop_tracker_app -d mop_card_tracker < backup.sql
```

### Volume Management

```bash
# List volumes
docker volume ls | grep mop

# Inspect volume
docker volume inspect mop-inscription-deck-tracker_postgres_data

# Backup volume
docker run --rm -v mop-inscription-deck-tracker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

## 🔧 Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Change ports in .env file
APP_PORT=5001
DB_PORT=5433
```

**2. Permission Issues**
```bash
# Fix volume permissions
docker-compose exec web chown -R nodejs:nodejs /app/logs
```

**3. Database Connection Issues**
```bash
# Check database logs
./docker-scripts.sh logs database

# Test database connection
docker-compose exec database psql -U mop_tracker_app -d mop_card_tracker -c "SELECT 1;"
```

**4. Memory Issues**
```bash
# Check container resource usage
docker stats --no-stream

# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

### Log Analysis

```bash
# Application logs
./docker-scripts.sh logs web

# Database logs
./docker-scripts.sh logs database

# Health check logs
docker-compose exec web cat /app/logs/app.log | grep health

# Error logs only
docker-compose logs web 2>&1 | grep ERROR
```

### Container Debugging

```bash
# Execute shell in running container
docker-compose exec web sh
docker-compose exec database bash

# Run temporary debug container
docker run --rm -it --network mop-tracker-network node:18-alpine sh

# Inspect container configuration
docker inspect mop-tracker-web
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./docker-scripts.sh stop
./docker-scripts.sh deploy

# Or use Docker Compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Migrations

```bash
# Connect to database
docker-compose exec database psql -U mop_tracker_app -d mop_card_tracker

# Run migration script
docker-compose exec -T database psql -U mop_tracker_app -d mop_card_tracker < migration.sql
```

### Security Updates

```bash
# Update base images
docker-compose pull
docker-compose build --no-cache --pull

# Update Node.js dependencies
docker-compose exec web npm audit fix
```

## 🚀 Production Deployment

### Server Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM  
- 20GB SSD storage
- Docker Engine 20.10+

**Recommended:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer/reverse proxy

### Production Checklist

- [ ] Configure environment variables
- [ ] Set up SSL/TLS termination
- [ ] Configure backup automation
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Test disaster recovery procedures
- [ ] Implement CI/CD pipeline
- [ ] Security hardening review

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/health {
        proxy_pass http://localhost:5000/api/health;
        access_log off;
    }
}
```

## 📈 Performance Optimization

### Resource Limits

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          memory: 512M
          
  database:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          memory: 1G
```

### PostgreSQL Tuning

The database container includes optimized settings:

```bash
# View current settings
docker-compose exec database psql -U mop_tracker_app -d mop_card_tracker -c "SHOW all;"

# Key performance settings (already configured)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

---

*Docker implementation completed as part of Task #4 - Version 2.0.0-alpha.1*
