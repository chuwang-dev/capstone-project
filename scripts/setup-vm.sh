#!/bin/bash

# VM Setup Script
# Prepares the VM for application deployment

set -e

# Configuration
APP_DIR="/opt/app"
LOG_DIR="/var/log/app"
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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Update system
update_system() {
    log_info "Updating system packages..."
    apt-get update
    apt-get upgrade -y
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker is already installed"
        return
    fi
    
    log_info "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start Docker
    systemctl start docker
    systemctl enable docker
    
    log_info "Docker installed successfully"
}

# Install monitoring tools
install_monitoring() {
    log_info "Installing monitoring tools..."
    apt-get install -y curl wget htop
}

# Setup directories
setup_directories() {
    log_info "Setting up directories..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Set proper permissions
    chmod 755 "$APP_DIR"
    chmod 755 "$LOG_DIR"
    chmod 755 "$BACKUP_DIR"
    
    log_info "Directories created"
}

# Setup firewall
setup_firewall() {
    if command -v ufw &> /dev/null; then
        log_info "Configuring firewall..."
        
        # Allow SSH, HTTP, HTTPS
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp
        ufw enable || true
        
        log_info "Firewall configured"
    fi
}

# Create systemd service for app
create_systemd_service() {
    log_info "Creating systemd service..."
    
    cat > /etc/systemd/system/simple-cicd-app.service <<'EOF'
[Unit]
Description=Simple CI/CD Application
After=docker.service
Requires=docker.service

[Service]
Type=simple
ExecStart=/usr/bin/docker start -a simple-cicd-app
ExecStop=/usr/bin/docker stop -t 10 simple-cicd-app
Restart=unless-stopped
RestartSec=10s
User=root

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    log_info "Systemd service created"
}

# Setup log rotation
setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/simple-cicd-app <<EOF
$LOG_DIR/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker restart simple-cicd-app > /dev/null 2>&1 || true
    endscript
}
EOF
    
    log_info "Log rotation configured"
}

# Main
main() {
    log_info "=========================================="
    log_info "VM Setup for Simple CI/CD App"
    log_info "=========================================="
    
    check_root
    update_system
    install_docker
    install_monitoring
    setup_directories
    setup_firewall
    create_systemd_service
    setup_log_rotation
    
    log_info "=========================================="
    log_info "✅ VM setup completed successfully!"
    log_info "=========================================="
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure Docker credentials (if using private registry)"
    log_info "2. Deploy the application using: ./scripts/deploy.sh <image-url>"
    log_info ""
}

main "$@"
