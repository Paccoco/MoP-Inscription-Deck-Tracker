# Changelog

All notable changes to the MoP Inscription Deck Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-alpha] - 2025-07-28

### Changed
- **Production Deployment Guide**: Complete rewrite for Version 2.0 architecture and Docker deployment
  - **Why**: Version 2.0 introduces Docker containerization and PostgreSQL, requiring entirely new deployment procedures
  - **How**: Restructured guide to prioritize Docker deployment with fallback to traditional installation
  - **Where**: `/PRODUCTION-DEPLOYMENT.md` - Complete file rewrite (228 lines → comprehensive Docker-focused guide)
  - **Features**: Docker one-command setup, PostgreSQL configuration, health monitoring, security checklist
  - **Migration**: Clearly documented that 2.0 requires fresh installation (no migration from 1.x)

- **CHANGELOG.md Reset**: Cleared previous version history and started fresh tracking for Version 2.0+ development
  - **Why**: Version 2.0 is a complete rewrite, previous changelog was cluttered with legacy version fixes
  - **How**: Archived all previous entries (1.0.0-1.2.5) and started with clean [2.0.0-alpha] section
  - **Where**: `/CHANGELOG.md` - Complete file restructure with archived version history note

### Added
- **Complete Docker Containerization Infrastructure**: Created comprehensive Docker setup for production deployment
  - **Why**: Simplify deployment, ensure consistent environments, and improve scalability
  - **How**: Multi-stage Dockerfiles, docker-compose configurations, automated setup scripts
  - **Where**: `/Dockerfile`, `/docker-compose.yml`, `/docker-compose.dev.yml`, `/docker/scripts/setup.sh`
  - **Files**: `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`, `docker-compose.dev.yml`, `.env.docker`, `DOCKER.md`

- **PostgreSQL Database Schema Design**: Complete database replacement architecture
  - **Why**: Replace SQLite for better concurrent access, advanced features, and production scalability
  - **How**: Designed UUID-based schema with JSONB columns, full-text search, and optimized indexing
  - **Where**: `/postgresql-schema.sql`, `/database/postgresql.js`
  - **Files**: `postgresql-schema.sql`, `database/postgresql.js`

- **Task Management System Enhancement**: Updated development task priorities and added Docker/PostgreSQL tasks
  - **Why**: Prioritize Docker containerization and PostgreSQL migration for Version 2.0 rewrite
  - **How**: Restructured tasks.md with detailed sub-tasks and implementation plans
  - **Where**: `/tasks.md` - Added Docker as High Priority task #2, PostgreSQL as task #3

- **Documentation Architecture**: Updated README.md to prioritize Docker deployment
  - **Why**: Docker provides easier, more reliable deployment than traditional installation
  - **How**: Reorganized setup section to feature Docker as recommended method
  - **Where**: `/README.md` - Updated Tech Stack and Setup sections

- **Project Planning Documentation**: Overhauled PLANNING.md for Version 2.0 architecture
  - **Why**: Align documentation with complete rewrite and autonomous development standards
  - **How**: Added current status, technical architecture, development standards, and workflow procedures
  - **Where**: `/PLANNING.md` - Complete restructure from basic overview to comprehensive development guide

- **Update Documentation**: Completely rewrote HOWTOUPDATE.md for Version 2.0 fresh installation approach
  - **Why**: Version 2.0 is complete rewrite requiring fresh installs, not migrations
  - **How**: Created fresh installation procedures with data preservation and migration testing
  - **Where**: `/HOWTOUPDATE.md` - Complete rewrite focusing on fresh installation with data migration

### Technical Details
- **Docker Benefits**: One-command deployment, PostgreSQL integration, isolated environment, easy backups
- **PostgreSQL Features**: UUID primary keys, JSONB columns, full-text search, connection pooling, advanced analytics
- **Development Workflow**: Enhanced copilot-instructions.md for autonomous development with clear standards

---

## Version History Archive

*Previous versions (1.0.0 - 1.2.5) have been archived. This changelog now tracks changes for Version 2.0+ development.*
