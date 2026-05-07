#!/bin/bash

# Health Check Script
# Monitors the application and alerts if issues are detected

set -e

# Configuration
HOST=${1:-localhost}
PORT=${2:-3000}
CHECK_INTERVAL=${3:-30}
MAX_FAILURES=${4:-3}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

failure_count=0
success_count=0

log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

check_health() {
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" http://$HOST:$PORT/api/health 2>&1 || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        log_info "✅ Health check passed (HTTP $http_code)"
        failure_count=0
        success_count=$((success_count + 1))
        return 0
    else
        log_error "❌ Health check failed (HTTP $http_code)"
        failure_count=$((failure_count + 1))
        success_count=0
        return 1
    fi
}

alert() {
    log_error "⚠️  ALERT: Application health check failed $failure_count times"
    log_error "Please investigate the application status immediately"
}

main() {
    log_info "Starting health check monitor for $HOST:$PORT"
    log_info "Check interval: ${CHECK_INTERVAL}s, Max failures: $MAX_FAILURES"
    
    while true; do
        if ! check_health; then
            if [ $failure_count -ge $MAX_FAILURES ]; then
                alert
                exit 1
            fi
        fi
        
        sleep "$CHECK_INTERVAL"
    done
}

# Run health check
main
