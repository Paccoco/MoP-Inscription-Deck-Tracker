#!/bin/bash

# PostgreSQL Setup Script for MoP Card Tracker
# This script installs and configures PostgreSQL for the application

set -e

echo "🐘 PostgreSQL Setup for MoP Card Tracker"
echo "========================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons."
   echo "   Please run as a regular user with sudo privileges."
   exit 1
fi

# Function to check if PostgreSQL is installed
check_postgres_installed() {
    if command -v psql &> /dev/null; then
        echo "✅ PostgreSQL client is installed"
        return 0
    else
        return 1
    fi
}

# Function to install PostgreSQL
install_postgresql() {
    echo "📦 Installing PostgreSQL..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
        # RHEL/CentOS/Fedora
        elif command -v yum &> /dev/null; then
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y postgresql-server postgresql-contrib
            sudo postgresql-setup --initdb
        else
            echo "❌ Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "❌ Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    else
        echo "❌ Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Function to configure PostgreSQL
configure_postgresql() {
    echo "⚙️ Configuring PostgreSQL..."
    
    # Start PostgreSQL service
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    # Create database and user
    echo "🔧 Creating database and user..."
    
    # Create user and database
    sudo -u postgres psql << EOF
-- Create user
CREATE USER mop_user WITH PASSWORD 'mop_password';

-- Create database
CREATE DATABASE mop_card_tracker OWNER mop_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mop_card_tracker TO mop_user;

-- Connect to the database and grant schema privileges
\c mop_card_tracker

-- Grant privileges on schema
GRANT ALL ON SCHEMA public TO mop_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mop_user;

-- Allow user to create tables
ALTER USER mop_user CREATEDB;

\q
EOF

    echo "✅ Database and user created successfully"
}

# Function to initialize database schema
initialize_schema() {
    echo "🏗️ Initializing database schema..."
    
    # Check if schema file exists
    if [[ ! -f "postgresql-schema.sql" ]]; then
        echo "❌ postgresql-schema.sql not found in current directory"
        echo "   Please run this script from the project root directory"
        exit 1
    fi
    
    # Apply schema
    PGPASSWORD=mop_password psql -h localhost -U mop_user -d mop_card_tracker -f postgresql-schema.sql
    
    echo "✅ Database schema initialized successfully"
}

# Function to test database connection
test_connection() {
    echo "🔍 Testing database connection..."
    
    PGPASSWORD=mop_password psql -h localhost -U mop_user -d mop_card_tracker -c "SELECT 'PostgreSQL connection successful!' as message;"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Database connection test passed"
    else
        echo "❌ Database connection test failed"
        exit 1
    fi
}

# Function to create .env file
create_env_file() {
    echo "📝 Creating environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        cp .env.postgresql .env
        echo "✅ Created .env file from .env.postgresql template"
        echo "⚠️ Please edit .env file to set secure passwords and secrets"
    else
        echo "⚠️ .env file already exists, skipping creation"
        echo "   You may want to update it with PostgreSQL settings from .env.postgresql"
    fi
}

# Main execution
main() {
    echo "Starting PostgreSQL setup process..."
    
    # Check if PostgreSQL is already installed
    if ! check_postgres_installed; then
        echo "PostgreSQL not found. Installing..."
        install_postgresql
    else
        echo "PostgreSQL is already installed"
    fi
    
    # Configure PostgreSQL
    configure_postgresql
    
    # Initialize schema
    initialize_schema
    
    # Test connection
    test_connection
    
    # Create environment file
    create_env_file
    
    echo ""
    echo "🎉 PostgreSQL setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit the .env file to set secure passwords"
    echo "2. Run the migration script: node scripts/migrate-to-postgres.js"
    echo "3. Start the application with: DB_TYPE=postgresql npm start"
    echo ""
    echo "Database connection details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: mop_card_tracker"
    echo "  User: mop_user"
    echo "  Password: mop_password (change this in production!)"
}

# Run main function
main "$@"
