#!/bin/bash

# Rollback Script
# Safely rollback to a previous version

set -e

# Configuration
CONTAINER_NAME="simple-cicd-app"
BACKUP_DIR="/opt/app-backup"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    ls -ltr "$BACKUP_DIR" 2>/dev/null | tail -n +2 | awk '{print $NF}' | nl
}

# Rollback to specific backup
rollback_to() {
    local backup_name=$1
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        log_error "Backup not found: $backup_name"
        exit 1
    fi
    
    log_warn "Rolling back to: $backup_name"
    
    # Stop current container
    log_info "Stopping current container..."
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    
    # Wait for container to fully stop
    sleep 5
    
    # Determine the image from backup metadata or use latest
    LOCAL_IMAGE="simple-cicd-app:rollback"
    
    log_info "Starting container from backup..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 3000:3000 \
        -e NODE_ENV=production \
        --restart unless-stopped \
        --health-cmd="curl -f http://localhost:3000/api/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        "$LOCAL_IMAGE"
    
    # Wait for container to be healthy
    log_info "Waiting for application to become healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            log_info "✅ Rollback successful!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "❌ Rollback failed - application did not become healthy"
    exit 1
}

# Auto-rollback to latest working version
auto_rollback() {
    log_warn "Auto-rollback: restoring from latest backup"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found"
        exit 1
    fi
    
    local latest_backup=$(ls -t "$BACKUP_DIR" | head -1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No backups available"
        exit 1
    fi
    
    log_info "Latest backup: $latest_backup"
    rollback_to "$latest_backup"
}

# Main
main() {
    if [ -z "$1" ]; then
        log_info "Rollback Script"
        echo "Usage: $0 [backup_name | --auto | --list]"
        echo ""
        list_backups
        exit 0
    fi
    
    case "$1" in
        --list)
            list_backups
            ;;
        --auto)
            auto_rollback
            ;;
        *)
            rollback_to "$1"
            ;;
    esac
}

main "$@"
