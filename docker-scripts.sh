#!/bin/bash

# Docker deployment scripts for MoP Inscription Deck Tracker
# Provides easy commands for Docker operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available (requires Docker Compose v2+)"
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

# Check for .env file
check_env() {
    if [[ ! -f ".env" ]]; then
        log_warning ".env file not found, creating from .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_info "Please edit .env file with your configuration before running the application"
        else
            log_error ".env.example file not found. Please create a .env file with your configuration."
            exit 1
        fi
    else
        log_success ".env file found"
    fi
}

# Production deployment
deploy_production() {
    log_info "Deploying MoP Card Tracker in production mode..."
    
    check_docker
    check_env
    
    log_info "Building Docker images..."
    docker compose build --no-cache
    
    log_info "Starting services..."
    docker compose up -d
    
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        log_success "Services are running!"
        log_info "Application should be available at: http://localhost:5000"
        log_info "Database is available at: localhost:5432"
        
        # Show running containers
        echo ""
        log_info "Running containers:"
        docker compose ps
    else
        log_error "Some services failed to start. Check logs with: ./docker-scripts.sh logs"
        exit 1
    fi
}

# Development deployment
deploy_development() {
    log_info "Deploying MoP Card Tracker in development mode..."
    
    check_docker
    check_env
    
    log_info "Building development Docker images..."
    docker compose -f docker compose.dev.yml build --no-cache
    
    log_info "Starting development services..."
    docker compose -f docker compose.dev.yml up -d
    
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are running
    if docker compose -f docker compose.dev.yml ps | grep -q "Up"; then
        log_success "Development services are running!"
        log_info "Application should be available at: http://localhost:5000"
        log_info "Database is available at: localhost:5433"
        
        # Show running containers
        echo ""
        log_info "Running containers:"
        docker compose -f docker compose.dev.yml ps
    else
        log_error "Some services failed to start. Check logs with: ./docker-scripts.sh logs-dev"
        exit 1
    fi
}

# Stop all services
stop_services() {
    log_info "Stopping all services..."
    
    log_info "Stopping production services..."
    docker compose down || true
    
    log_info "Stopping development services..."
    docker compose -f docker compose.dev.yml down || true
    
    log_success "All services stopped"
}

# Show logs
show_logs() {
    local service=${1:-""}
    
    if [[ -n "$service" ]]; then
        log_info "Showing logs for service: $service"
        docker compose logs -f "$service"
    else
        log_info "Showing logs for all production services..."
        docker compose logs -f
    fi
}

# Show development logs
show_logs_dev() {
    local service=${1:-""}
    
    if [[ -n "$service" ]]; then
        log_info "Showing development logs for service: $service"
        docker compose -f docker compose.dev.yml logs -f "$service"
    else
        log_info "Showing logs for all development services..."
        docker compose -f docker compose.dev.yml logs -f
    fi
}

# Clean up Docker resources
cleanup() {
    log_info "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker compose down --remove-orphans || true
    docker compose -f docker compose.dev.yml down --remove-orphans || true
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (careful with this)
    read -p "Do you want to remove unused volumes? This will delete database data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        log_warning "Volumes removed. Database data has been deleted."
    fi
    
    log_success "Cleanup completed"
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    local backup_name="mop-tracker-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # Check if production database is running
    if docker compose ps database | grep -q "Up"; then
        docker compose exec database pg_dump -U mop_tracker_app mop_card_tracker > "backups/$backup_name"
        log_success "Backup created: backups/$backup_name"
    else
        log_error "Database container is not running"
        exit 1
    fi
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        log_error "Please specify backup file: ./docker-scripts.sh restore <backup-file>"
        exit 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "Restoring database from: $backup_file"
    
    # Check if production database is running
    if docker compose ps database | grep -q "Up"; then
        docker compose exec -T database psql -U mop_tracker_app -d mop_card_tracker < "$backup_file"
        log_success "Database restored successfully"
    else
        log_error "Database container is not running"
        exit 1
    fi
}

# Show status
show_status() {
    log_info "Docker services status:"
    
    echo ""
    echo "Production services:"
    docker compose ps || echo "No production services running"
    
    echo ""
    echo "Development services:"
    docker compose -f docker compose.dev.yml ps || echo "No development services running"
    
    echo ""
    echo "Docker images:"
    docker images | grep -E "(mop|postgres)" || echo "No MoP related images found"
    
    echo ""
    echo "Docker volumes:"
    docker volume ls | grep -E "(mop|postgres)" || echo "No MoP related volumes found"
}

# Show help
show_help() {
    echo "MoP Inscription Deck Tracker - Docker Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  deploy          Deploy in production mode"
    echo "  deploy-dev      Deploy in development mode"
    echo "  stop            Stop all services"
    echo "  restart         Restart production services"
    echo "  restart-dev     Restart development services"
    echo "  logs [service]  Show production logs (optionally for specific service)"
    echo "  logs-dev [service]  Show development logs (optionally for specific service)"
    echo "  status          Show status of all services and resources"
    echo "  backup          Create database backup"
    echo "  restore <file>  Restore database from backup file"
    echo "  cleanup         Clean up Docker resources (images, volumes)"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy production"
    echo "  $0 deploy-dev               # Deploy development"
    echo "  $0 logs web                 # Show web service logs"
    echo "  $0 backup                   # Create database backup"
    echo "  $0 restore backup.sql       # Restore from backup"
}

# Main script logic
case "${1:-help}" in
    "deploy")
        deploy_production
        ;;
    "deploy-dev")
        deploy_development
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        log_info "Restarting production services..."
        docker compose restart
        log_success "Production services restarted"
        ;;
    "restart-dev")
        log_info "Restarting development services..."
        docker compose -f docker compose.dev.yml restart
        log_success "Development services restarted"
        ;;
    "logs")
        show_logs "$2"
        ;;
    "logs-dev")
        show_logs_dev "$2"
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
