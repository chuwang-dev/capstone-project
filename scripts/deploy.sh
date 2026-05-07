#!/bin/bash

# Simple CI/CD App - Deployment Script
# This script pulls the latest Docker image and deploys it to the VM

set -e

# Configuration
IMAGE=$1
DOCKER_USERNAME=${2:-$DOCKER_USERNAME}
DOCKER_PASSWORD=${3:-$DOCKER_PASSWORD}
CONTAINER_NAME="simple-cicd-app"
PORT=3000
BACKUP_DIR="/opt/app-backup"
APP_DIR="/opt/app"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Login to Docker registry
login_to_registry() {
    log_info "Logging in to Docker registry..."
    
    if [ -z "$DOCKER_PASSWORD" ]; then
        log_warn "Docker password not provided, skipping login"
        return
    fi
    
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin ghcr.io
    log_info "Successfully logged in to Docker registry"
}

# Backup current deployment
backup_current() {
    log_info "Creating backup of current deployment..."
    
    if [ -d "$APP_DIR" ]; then
        BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
        
        mkdir -p "$BACKUP_DIR"
        cp -r "$APP_DIR" "$BACKUP_PATH"
        log_info "Backup created at $BACKUP_PATH"
    else
        log_info "No existing deployment to backup"
    fi
}

# Pull latest image
pull_image() {
    log_info "Pulling latest Docker image: $IMAGE..."
    docker pull "$IMAGE"
    log_info "Image pulled successfully"
}

# Stop existing container
stop_container() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Stopping existing container..."
        docker stop "$CONTAINER_NAME" || true
        docker rm "$CONTAINER_NAME" || true
        log_info "Container stopped and removed"
    else
        log_info "No existing container found"
    fi
}

# Wait for container to be healthy
wait_for_health() {
    local max_attempts=30
    local attempt=0
    
    log_info "Waiting for application to become healthy..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:$PORT/api/health > /dev/null 2>&1; then
            log_info "Application is healthy!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "Application failed to become healthy after $max_attempts seconds"
    return 1
}

# Deploy new container
deploy_container() {
    log_info "Deploying new container from image: $IMAGE..."
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$PORT:3000" \
        -e NODE_ENV=production \
        -e PORT=3000 \
        -e APP_VERSION=$(date +%Y%m%d.%H%M%S) \
        --restart unless-stopped \
        --health-cmd="curl -f http://localhost:3000/api/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        --health-start-period=10s \
        "$IMAGE"
    
    log_info "Container deployed with ID: $(docker ps -q -f name=$CONTAINER_NAME)"
}

# Perform health check
perform_health_check() {
    log_info "Performing health checks..."
    
    if wait_for_health; then
        log_info "Health checks passed!"
        return 0
    else
        log_error "Health checks failed!"
        return 1
    fi
}

# Rollback to previous version
rollback() {
    log_warn "Starting rollback process..."
    
    # Stop current container
    stop_container
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to: $LATEST_BACKUP"
    # Implementation depends on how the app is deployed
    # This is a placeholder for demonstration
    log_info "Rollback completed"
}

# Cleanup old backups (keep last 5)
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        log_info "Old backups cleaned"
    fi
}

# Main deployment flow
main() {
    log_info "=========================================="
    log_info "Starting deployment process"
    log_info "Image: $IMAGE"
    log_info "Container Name: $CONTAINER_NAME"
    log_info "Port: $PORT"
    log_info "=========================================="
    
    check_prerequisites
    login_to_registry
    backup_current
    pull_image
    stop_container
    deploy_container
    
    if perform_health_check; then
        log_info "=========================================="
        log_info "✅ Deployment successful!"
        log_info "=========================================="
        cleanup_old_backups
        exit 0
    else
        log_error "=========================================="
        log_error "❌ Deployment failed. Initiating rollback..."
        log_error "=========================================="
        rollback
        exit 1
    fi
}

# Run main function
main "$@"
