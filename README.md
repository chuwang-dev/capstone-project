# Simple CI/CD App 🚀

A comprehensive example of a modern CI/CD pipeline that demonstrates automated testing, building, containerization, and deployment of a web application to cloud VMs.

## Overview

This project showcases production-ready deployment practices using:

- **Frontend**: React.js for interactive UX
- **Backend**: Node.js + Express for API server
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions for automation
- **Infrastructure**: AWS EC2 or Azure VMs
- **Tooling**: Complete deployment automation scripts

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml                 # GitHub Actions CI/CD pipeline
├── docs/
│   ├── DEPLOY_AWS_EC2.md            # AWS EC2 deployment guide
│   ├── DEPLOY_AZURE.md              # Azure VM deployment guide
│   └── ARCHITECTURE.md              # System architecture details
├── scripts/
│   ├── setup-vm.sh                  # VM initialization script
│   ├── deploy.sh                    # Application deployment script
│   ├── health-check.sh              # Health monitoring script
│   └── rollback.sh                  # Rollback to previous version
├── src/
│   ├── App.js                       # React main component
│   ├── App.css                      # Application styles
│   ├── index.js                     # React entry point
│   └── index.css                    # Global styles
├── public/
│   └── index.html                   # HTML template
├── server.js                        # Express server
├── package.json                     # Dependencies and scripts
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # Docker Compose for local dev
└── README.md                        # This file
```

## Features

### Application Features
- ✅ Real-time health status monitoring
- ✅ API endpoints for status and health checks
- ✅ Responsive React UI
- ✅ Server-side rendering support
- ✅ Error handling and logging

### CI/CD Pipeline Features
- ✅ Automated testing on push/PR
- ✅ Multi-version Node.js testing
- ✅ Docker image building and pushing
- ✅ Automated deployment to VM
- ✅ Health verification after deployment
- ✅ Automatic rollback on failure
- ✅ Backup and restore capabilities

### Infrastructure Features
- ✅ Support for AWS EC2 and Azure VMs
- ✅ Automatic VM setup scripts
- ✅ Docker containerized deployment
- ✅ Health checks and monitoring
- ✅ Secure SSH-based deployment
- ✅ Firewall configuration
- ✅ Systemd service integration
- ✅ Log rotation and management

## Quick Start

### Local Development

#### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (optional)

#### Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/simple-cicd-app.git
cd simple-cicd-app

# Install dependencies
npm install

# Start in development mode
npm run dev

# Or run separately:
# Terminal 1: npm run server
# Terminal 2: npm run client
```

Access the app at `http://localhost:3000`

#### Build
```bash
# Build React app
npm run build

# Build Docker image
docker build -t simple-cicd-app:latest .

# Run in Docker
docker run -p 3000:3000 simple-cicd-app:latest
```

### Using Docker Compose

```bash
# Build and start
docker-compose up --build

# Stop
docker-compose down
```

## Deployment Guides

### AWS EC2 Deployment
Comprehensive guide for deploying to Amazon EC2 instances.

**→ [AWS EC2 Deployment Guide](docs/DEPLOY_AWS_EC2.md)**

Key steps:
1. Create and configure EC2 instance
2. Set up security groups
3. Configure GitHub secrets
4. Push to main branch (automatic deployment)

### Azure VM Deployment
Complete guide for deploying to Azure Virtual Machines.

**→ [Azure VM Deployment Guide](docs/DEPLOY_AZURE.md)**

Key steps:
1. Create resource group and VM
2. Configure network security
3. Set up GitHub secrets
4. Push to main branch (automatic deployment)

## CI/CD Pipeline Details

### Workflow Stages

#### 1. Test Stage
- Runs on Node.js 18.x and 20.x
- Executes unit tests
- Builds React application
- Validates dependencies

#### 2. Build Stage
- Builds multi-stage Docker image
- Pushes to GitHub Container Registry
- Automatically tagged with latest, branch, and SHA

#### 3. Deploy Stage
- SSH into VM using secure key
- Pulls latest Docker image
- Stops previous container
- Starts new container
- Verifies application health

#### 4. Rollback
- Automatically triggered on health check failure
- Restores from latest backup
- No manual intervention required

### Pipeline Variables

Set these in GitHub Settings → Secrets and variables → Actions:

| Secret | Description | Example |
|--------|-------------|---------|
| `DEPLOY_KEY` | Private SSH key for VM access | (PEM file content) |
| `VM_HOST` | Public IP or DNS of VM | `203.0.113.42` |
| `VM_USER` | SSH user for VM | `ubuntu` (AWS) or `azureuser` (Azure) |
| `DOCKER_USERNAME` | Docker registry username | `ghcr.io` |
| `DOCKER_PASSWORD` | Docker registry token | (GitHub personal access token) |

## Manual Deployment

### Deploy to Running VM

```bash
# SSH into VM
ssh -i deploy_key.pem ubuntu@VM_HOST

# Deploy application
cd /opt/app
bash scripts/deploy.sh ghcr.io/YOUR_USERNAME/simple-cicd-app:latest \
  DOCKER_USERNAME \
  DOCKER_PASSWORD
```

### Monitor Application

```bash
# View container logs
docker logs -f simple-cicd-app

# Check container status
docker ps -a

# Test health endpoint
curl http://localhost:3000/api/health
```

### Rollback to Previous Version

```bash
# Automatic rollback to latest working version
bash scripts/rollback.sh --auto

# List available backups
bash scripts/rollback.sh --list

# Rollback to specific backup
bash scripts/rollback.sh backup_20260506_120000
```

## Environment Variables

Configure these on your deployment VM:

```bash
NODE_ENV=production        # Set Node environment
PORT=3000                 # Server port
APP_VERSION=1.0.0         # Application version
```

## API Endpoints

### Health Check
```bash
GET /api/health
```
Response:
```json
{
  "health": "healthy",
  "uptime": 3600.5
}
```

### Status
```bash
GET /api/status
```
Response:
```json
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2026-05-06T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Monitoring

### Docker Health Checks
The application includes automated health checks:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3 before marking unhealthy
- Start period: 10 seconds grace

### Log Files
- Application logs: `/var/log/app/`
- Docker logs: `docker logs simple-cicd-app`
- System logs: `journalctl -u simple-cicd-app -f`

### Health Monitoring Script
```bash
# Start continuous monitoring
bash scripts/health-check.sh localhost 3000 30 3
```

## Troubleshooting

### Application won't start
```bash
# Check logs
docker logs simple-cicd-app

# Verify node_modules
docker exec simple-cicd-app npm list

# Check dependencies
docker inspect simple-cicd-app
```

### Health checks failing
```bash
# Test endpoint directly
curl -v http://localhost:3000/api/health

# Check docker health
docker inspect --format='{{.State.Health.Status}}' simple-cicd-app

# View events
docker events --filter container=simple-cicd-app
```

### Docker login fails
```bash
# Verify credentials
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME ghcr.io

# Create personal access token on GitHub
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Scopes: repo, write:packages
```

### Deployment timeout
```bash
# Check server connectivity
ping VM_HOST
ssh -i deploy_key.pem VM_USER@VM_HOST

# Verify firewall
sudo ufw status

# Check security group rules (AWS/Azure)
```

## Security Considerations

### Best Practices ✅
- ✅ Use HTTPS in production (add reverse proxy with TLS)
- ✅ Limit security group/NSG rules to necessary ports
- ✅ Rotate SSH keys regularly
- ✅ Keep system packages updated
- ✅ Use secrets management (don't commit credentials)
- ✅ Enable audit logging on VM
- ✅ Run container as non-root user
- ✅ Use minimal base image (Alpine)

### Production Hardening
```bash
# Enable firewall
sudo ufw enable

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Configure SSH
sudo nano /etc/ssh/sshd_config
# Change: PermitRootLogin no
# Change: PasswordAuthentication no
sudo systemctl restart sshd

# Setup fail2ban
sudo apt-get install fail2ban
sudo systemctl start fail2ban
```

## Performance Optimization

### Docker Image
- Multi-stage build reduces image size
- Production-only dependencies (npm ci --only=production)
- Non-root user execution
- Health checks included

### Application
- Caching headers for static assets
- Compression middleware
- Connection pooling
- Error boundaries

### Infrastructure
- Appropriate instance type sizing
- Auto-scaling (if using AWS/Azure)
- CDN for static content (optional)
- Database optimization (if added)

## Cost Estimation

### AWS EC2 (US East 1)
- t3.micro: ~$0.0104/hour (eligible for free tier 12 months)
- t3.small: ~$0.0208/hour
- Monthly estimate (730 hours): $7.59-$15.18

### Azure
- B1s: ~$9.40/month
- B2s: ~$37.59/month
- Standard storage: ~$0.17/GB/month

## Production Checklist

Before deploying to production:

- [ ] Configure custom domain
- [ ] Set up SSL/TLS certificate
- [ ] Enable HTTPS redirect
- [ ] Configure CDN
- [ ] Set up monitoring and alerting
- [ ] Enable automated backups
- [ ] Configure log aggregation
- [ ] Test disaster recovery
- [ ] Document runbooks
- [ ] Perform load testing
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Establish SLAs

## Deployment Flow Diagram

```
Push to main
    ↓
GitHub Actions triggered
    ↓
Test (multiple Node versions)
    ↓
Build Docker image
    ↓
Push to registry
    ↓
Deploy to VM (SSH)
    ↓
Health check verification
    ↓
✅ Deployment successful
   └─ or └─ ❌ Rollback on failure
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Learning Resources

This project demonstrates:
- Git workflow and automated testing
- Docker containerization best practices
- GitHub Actions CI/CD pipeline design
- Infrastructure as Code (IaC) principles
- Secure credential management
- Blue-green deployment strategies
- Health checks and monitoring
- Disaster recovery procedures

## Customization

### Add Database
1. Update docker-compose.yml with database service
2. Modify server.js to connect to database
3. Update CI/CD to handle migrations
4. Document connection strings in secrets

### Add Custom Domain
1. Configure DNS to point to VM IP
2. Obtain SSL certificate (Let's Encrypt)
3. Add reverse proxy (nginx)
4. Update GitHub secrets as needed

### Scale to Multiple Instances
1. Use load balancer (AWS ALB, Azure LB)
2. Configure auto-scaling
3. Use shared database backend
4. Implement session management

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the [troubleshooting](#troubleshooting) section
- Review the deployment guides
- Open a GitHub issue with details

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Azure VM Documentation](https://docs.microsoft.com/azure/virtual-machines/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

---

**Last Updated**: May 6, 2026
**Status**: Production Ready ✅