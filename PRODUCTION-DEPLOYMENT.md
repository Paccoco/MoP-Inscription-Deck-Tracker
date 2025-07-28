# Production Deployment Guide - Version 2.0.0

## Overview

This guide covers deploying MoP Inscription Deck Tracker v2.0.0+ to production servers. Version 2.0 introduces Docker containerization, PostgreSQL database, and simplified deployment workflows.

> **⚠️ Important**: Version 2.0.0 is a complete rewrite. Fresh installation required - migration from 1.x versions not supported.

## Deployment Methods

### 🐳 Method 1: Docker Deployment (Recommended)

Docker provides the easiest, most reliable deployment with consistent environments and automatic dependency management.

#### Quick Start
```bash
# Clone repository
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker

# One-command production deployment
./docker/scripts/setup.sh --production
```

#### Manual Docker Setup
```bash
# 1. Configure environment
cp .env.docker .env
# Edit .env with your production settings

# 2. Deploy with Docker Compose
docker-compose up -d

# 3. Initialize database (first run only)
docker-compose exec app npm run db:init

# 4. Create admin user
docker-compose exec app npm run admin:create
```

### 🔧 Method 2: Traditional Installation

For environments where Docker is not available or preferred.

#### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 12+
- Git

#### Installation Steps
```bash
# 1. Clone and install dependencies
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker
npm install
cd client && npm install && npm run build && cd ..

# 2. Setup PostgreSQL database
createdb mop_card_tracker
psql mop_card_tracker < postgresql-schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your database connection and settings

# 4. Initialize application
npm run db:init
npm run admin:create

# 5. Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

## Configuration

### Environment Variables

Required `.env` configuration:

```bash
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/mop_card_tracker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mop_card_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=your-very-secure-random-secret-key
SESSION_SECRET=another-secure-random-secret

# Admin Account
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-admin-password

# Optional: Discord Integration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url

# Optional: Gotify Notifications
GOTIFY_URL=https://your-gotify-server.com
GOTIFY_TOKEN=your-gotify-token
```

### Docker-Specific Configuration

For Docker deployments, additional variables in `.env`:

```bash
# Docker PostgreSQL Configuration
POSTGRES_DB=mop_card_tracker
POSTGRES_USER=cardtracker
POSTGRES_PASSWORD=secure-database-password

# Docker Networking
POSTGRES_HOST=postgres
```

## Database Management

### PostgreSQL Schema

Version 2.0 uses PostgreSQL with advanced features:
- UUID primary keys for better scalability
- JSONB columns for flexible data storage
- Full-text search capabilities
- Optimized indexing for performance

### Backup and Restore

#### Docker Environment
```bash
# Create backup
docker-compose exec postgres pg_dump -U cardtracker mop_card_tracker > backup.sql

# Restore backup
docker-compose exec postgres psql -U cardtracker mop_card_tracker < backup.sql
```

#### Traditional Installation
```bash
# Create backup
pg_dump mop_card_tracker > backup.sql

# Restore backup
psql mop_card_tracker < backup.sql
```

## Health Monitoring

### Service Status

#### Docker
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs app
docker-compose logs postgres

# Monitor resource usage
docker-compose exec app npm run health:check
```

#### Traditional
```bash
# PM2 status
pm2 status

# Application logs
pm2 logs mop-card-tracker

# Database connection test
npm run db:test
```

### Health Check Endpoints

```bash
# Application health
curl http://localhost:5000/api/health

# Database health
curl http://localhost:5000/api/health/database

# Version information
curl http://localhost:5000/api/version
```

## Security Considerations

### Production Security Checklist

- [ ] Use strong, unique passwords for all accounts
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Set secure JWT_SECRET and SESSION_SECRET
- [ ] Enable PostgreSQL SSL connections
- [ ] Configure firewall to restrict database access
- [ ] Regular security updates for host system
- [ ] Backup encryption for sensitive data

### Docker Security

- [ ] Run containers as non-root user (automatically configured)
- [ ] Use Docker secrets for sensitive data
- [ ] Regular container image updates
- [ ] Network isolation between containers
- [ ] Volume encryption for persistent data

## Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Test database connection
docker-compose exec app npm run db:test
# OR for traditional
npm run db:test

# Check PostgreSQL logs
docker-compose logs postgres
```

#### Permission Issues
```bash
# Fix Docker permissions
sudo chown -R $(id -u):$(id -g) .

# Reset database permissions
docker-compose exec postgres psql -U cardtracker -c "GRANT ALL PRIVILEGES ON DATABASE mop_card_tracker TO cardtracker;"
```

#### Application Errors
```bash
# View detailed logs
docker-compose logs --tail=50 app

# Restart services
docker-compose restart app
```

### Recovery Procedures

#### Complete Service Reset
```bash
# Docker environment
docker-compose down
docker-compose up -d
docker-compose exec app npm run db:init

# Traditional environment
pm2 stop mop-card-tracker
pm2 start ecosystem.config.js
npm run db:init
```

## Version 2.0.0 Features

### New in 2.0.0
- **Docker Containerization**: Simplified deployment and scaling
- **PostgreSQL Database**: Production-ready database with advanced features
- **Enhanced Security**: Improved authentication and session management
- **Modern Architecture**: Microservice-ready design with health monitoring
- **Automated Deployment**: One-command setup with Docker
- **Advanced Analytics**: PostgreSQL-powered reporting and insights

### Migration from 1.x

> **Note**: Direct migration from 1.x versions is not supported. Version 2.0 requires fresh installation.

For data preservation:
1. Export data from 1.x version using built-in export tools
2. Fresh install Version 2.0
3. Import data using new import functionality

## Support and Maintenance

### Regular Maintenance

#### Weekly
- Review application logs for errors
- Check disk space and database size
- Verify backup integrity

#### Monthly
- Update container images (Docker)
- Review security configurations
- Performance optimization review

### Update Procedures

#### Docker Updates
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose down
docker-compose up -d
```

#### Traditional Updates
```bash
# Standard update process
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart mop-card-tracker
```

---

**Version**: 2.0.0-alpha  
**Last Updated**: July 28, 2025  
**Docker Support**: Full containerization with PostgreSQL  
**Migration**: Fresh installation required from 1.x versions
