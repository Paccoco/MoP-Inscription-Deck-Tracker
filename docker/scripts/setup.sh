#!/bin/bash
# Docker Setup Script for MoP Inscription Deck Tracker
# Handles initial setup, environment configuration, and deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DATA_DIR="$PROJECT_DIR/data"

echo -e "${BLUE}🐳 MoP Inscription Deck Tracker - Docker Setup${NC}"
echo -e "${BLUE}=================================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        echo "Please start Docker and try again"
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed and running"
}

# Create necessary directories
create_directories() {
    print_info "Creating data directories..."
    
    mkdir -p "$DATA_DIR"/{postgres,backups,logs,app-backups,ssl,nginx-logs}
    
    # Set proper permissions
    chmod 755 "$DATA_DIR"
    chmod 700 "$DATA_DIR/postgres"
    chmod 755 "$DATA_DIR"/{backups,logs,app-backups,ssl,nginx-logs}
    
    print_status "Data directories created at $DATA_DIR"
}

# Setup environment file
setup_environment() {
    print_info "Setting up environment configuration..."
    
    cd "$PROJECT_DIR"
    
    if [[ ! -f .env ]]; then
        if [[ -f .env.docker ]]; then
            cp .env.docker .env
            print_status "Environment file created from .env.docker template"
        else
            print_error "No environment template found"
            exit 1
        fi
    else
        print_warning "Environment file already exists, skipping creation"
    fi
    
    # Generate secure secrets if using default values
    if grep -q "change-this" .env; then
        print_info "Generating secure secrets..."
        
        JWT_SECRET=$(openssl rand -base64 48)
        JWT_REFRESH_SECRET=$(openssl rand -base64 48)
        DB_PASSWORD=$(openssl rand -base64 32)
        
        sed -i "s/your-super-secure-jwt-secret-minimum-32-characters-change-this/$JWT_SECRET/g" .env
        sed -i "s/your-refresh-token-secret-different-from-jwt-change-this/$JWT_REFRESH_SECRET/g" .env
        sed -i "s/secure_password_change_this_in_production_123/$DB_PASSWORD/g" .env
        
        print_status "Secure secrets generated and configured"
    fi
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."
    
    cd "$PROJECT_DIR"
    
    docker-compose build --no-cache
    
    print_status "Docker images built successfully"
}

# Start services
start_services() {
    print_info "Starting services..."
    
    cd "$PROJECT_DIR"
    
    # Start core services
    docker-compose up -d database web
    
    print_status "Core services started"
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    timeout=60
    while ! docker-compose exec -T database pg_isready -U mop_tracker_app -d mop_card_tracker &> /dev/null; do
        timeout=$((timeout - 1))
        if [[ $timeout -eq 0 ]]; then
            print_error "Database failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
    done
    
    print_status "Database is ready"
    
    # Wait for web service to be ready
    print_info "Waiting for web service to be ready..."
    timeout=60
    while ! curl -f http://localhost:5000/api/health &> /dev/null; do
        timeout=$((timeout - 1))
        if [[ $timeout -eq 0 ]]; then
            print_error "Web service failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
    done
    
    print_status "Web service is ready"
}

# Display status and access information
show_status() {
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}🔗 Access Information:${NC}"
    echo -e "  • Web Application: ${GREEN}http://localhost:5000${NC}"
    echo -e "  • Database: ${GREEN}localhost:5432${NC}"
    echo ""
    echo -e "${BLUE}📝 Default Development Credentials:${NC}"
    echo -e "  • Admin: ${GREEN}testadmin / testadmin123${NC}"
    echo -e "  • User: ${GREEN}testuser / testuser123${NC}"
    echo ""
    echo -e "${BLUE}🛠️  Useful Commands:${NC}"
    echo -e "  • View logs: ${GREEN}docker-compose logs -f${NC}"
    echo -e "  • Stop services: ${GREEN}docker-compose down${NC}"
    echo -e "  • Restart: ${GREEN}docker-compose restart${NC}"
    echo -e "  • Update: ${GREEN}./docker/scripts/update.sh${NC}"
    echo ""
}

# Main execution
main() {
    check_docker
    create_directories
    setup_environment
    build_images
    start_services
    show_status
}

# Handle command line arguments
case "${1:-setup}" in
    setup)
        main
        ;;
    check)
        check_docker
        print_status "Docker environment is ready"
        ;;
    dirs)
        create_directories
        ;;
    env)
        setup_environment
        ;;
    build)
        build_images
        ;;
    start)
        start_services
        ;;
    status)
        cd "$PROJECT_DIR"
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {setup|check|dirs|env|build|start|status}"
        echo ""
        echo "Commands:"
        echo "  setup   - Complete setup (default)"
        echo "  check   - Check Docker installation"
        echo "  dirs    - Create data directories"
        echo "  env     - Setup environment file"
        echo "  build   - Build Docker images"
        echo "  start   - Start services"
        echo "  status  - Show service status"
        exit 1
        ;;
esac
