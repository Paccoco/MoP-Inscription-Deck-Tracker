# Multi-stage Docker build for MoP Inscription Deck Tracker
# Optimized for production deployment with minimal image size

#==============================================================================
# Stage 1: Build React Frontend
#==============================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files for better caching
COPY client/package*.json ./

    # Install dependencies
    RUN npm ci --omit=dev && npm cache clean --force

    # Copy source code and build
COPY client/ ./
RUN npm run build

#==============================================================================
# Stage 2: Build Node.js Backend Dependencies
#==============================================================================
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

#==============================================================================
# Stage 3: Production Runtime
#==============================================================================
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S moptracker && \
    adduser -S moptracker -u 1001 -G moptracker

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source code
COPY --chown=moptracker:moptracker . .

# Copy built frontend from first stage
COPY --from=frontend-builder --chown=moptracker:moptracker /app/client/build ./client/build

# Create necessary directories
RUN mkdir -p logs database && \
    chown -R moptracker:moptracker logs database

# Remove unnecessary files
RUN rm -rf client/src client/public client/package*.json client/node_modules

# Switch to non-root user
USER moptracker

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
