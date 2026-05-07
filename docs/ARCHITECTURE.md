# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Workflow                            │
│  (git push to main) → GitHub Repository                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              GitHub Actions CI/CD Pipeline                       │
│  ┌─────────┬─────────┬────────┬────────────────────────────┐   │
│  │  Test   │  Build  │ Push   │ Deploy    | Verify | Alert │   │
│  │ (18,20) │ Docker  │ GHCR   │ SSH → VM  | Health| Status │   │
│  └─────────┴─────────┴────────┴────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Container Registry (GitHub Container Registry)           │
│  ghcr.io/username/simple-cicd-app:latest                        │
│  ghcr.io/username/simple-cicd-app:main-[SHORT_SHA]              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Virtual Machine (EC2 / Azure)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Docker Container                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Node.js + Express Server    (Port 3000)          │  │  │
│  │  │  - Serves React Build                             │  │  │
│  │  │  - API Endpoints (/api/status, /api/health)       │  │  │
│  │  │  CORS & Security Headers                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  Health Check: every 30s                                │  │
│  │  Auto-restart: unless-stopped                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Supporting Services:                                          │
│  - Systemd service for persistence                            │
│  - Log rotation (daily, keep 7 days)                          │
│  - Backup system (/opt/app-backup)                            │
│  - Health monitoring scripts                                  │
│  - Rollback capability                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend (React)

```
src/
├── index.js               # React root component
├── index.css              # Global styles
├── App.js                 # Main application component
│   ├───────────────────────────────────────
│   │ Header Section (Status info)
│   │ ├─ Fetches /api/status
│   │ ├─ Auto-refresh every 5 seconds
│   │ └─ Displays environment, version, timestamp
│   │
│   │ Features Section (UI showcase)
│   │
│   │ Info Section (Deployment metadata)
│   │
│   └─ Footer (Copyright)
│
└── App.css                # Component styles (gradient background)
```

**Key Features:**
- React Hooks (useState, useEffect)
- Auto-refresh status endpoint every 5 seconds
- Error handling and loading states
- Responsive mobile-first design

### 2. Backend (Node.js + Express)

```
server.js
├── Express app setup
├── Middleware
│   ├── CORS configuration
│   ├── JSON body parser
│   └── Static file serving
│
├── API Routes
│   ├── GET /api/status
│   │   └── Returns: {status, environment, timestamp, version}
│   │
│   └── GET /api/health
│       └── Returns: {health, uptime}
│
├── Production mode
│   ├── Serves /build directory (React build)
│   └── Fallback to index.html (SPA routing)
│
└── Error handling
    └── JSON error responses
```

**Environment Variables:**
- `NODE_ENV`: Set to 'production' in Docker
- `PORT`: Default 3000
- `APP_VERSION`: Set during deployment

### 3. Containerization (Docker)

```
Multi-stage build:

Stage 1: Builder
├── node:18-alpine base
├── Install dependencies (npm ci)
├── Copy source code
├── Build React app (npm run build)
└── Output: /app/build directory

Stage 2: Production
├── node:18-alpine base
├── Install only production dependencies
├── Copy build from builder
├── Copy server.js
├── Non-root user (nodejs)
├── Health check configuration
└── Entrypoint: dumb-init node server.js
```

**Advantages:**
- Minimal final image size (~200-300MB)
- No build tools in production image
- Security: runs as non-root user
- Proper signal handling (dumb-init)
- Built-in health checks

### 4. CI/CD Pipeline (GitHub Actions)

```yaml
Trigger: Push to main or develop

Jobs (Sequential with dependencies):

1. Test Job
   ├── Matrix: Node 18.x, 20.x
   ├── Steps:
   │   ├── Checkout code
   │   ├── Setup Node.js + cache
   │   ├── npm ci (install)
   │   ├── npm test (jest)
   │   └── npm run build
   └── Artifacts: Build output

2. Build Job
   ├── Depends on: Test job
   ├── Runs only on: main branch
   ├── Steps:
   │   ├── Setup Docker Buildx
   │   ├── Login to GHCR
   │   ├── Extract metadata
   │   ├── Build & push image
   │   └── Cache layers (gha)
   └── Tags: latest, branch, sha, semver

3. Deploy Job
   ├── Depends on: Build job
   ├── Environment: production (requires approval)
   ├── Steps:
   │   ├── SSH key setup
   │   ├── Execute deploy.sh on VM
   │   └── Verify health check
   └── Failure: Triggers rollback

4. Notification Job
   ├── Final status check
   └── Success/failure reporting
```

### 5. Deployment Architecture

```
VM Setup (Ubuntu 22.04)
├── Docker & Docker Compose
├── Application directories
│   ├── /opt/app               (application code)
│   ├── /opt/app-backup        (version backups)
│   └── /var/log/app           (application logs)
│
├── Systemd service
│   └── simple-cicd-app.service
│       ├── Starts Docker container
│       └── Auto-restart on failure
│
├── Firewall (UFW)
│   ├── 22 (SSH)
│   ├── 80 (HTTP)
│   ├── 443 (HTTPS)
│   └── 3000 (Application)
│
└── Log rotation (/etc/logrotate.d/)
    ├── Daily rotation
    ├── Keep 7 days
    └── Auto-compress
```

## Data Flow

### Deployment Flow

```
1. Developer pushes to main
   └─ GitHub receives push

2. GitHub Actions triggered
   └─ Checkout code

3. Test stage
   ├─ npm ci            (install dependencies)
   ├─ npm test          (run tests)
   └─ npm run build     (build React app)

4. Build stage (if tests pass)
   ├─ docker build      (create image)
   ├─ docker push       (push to GHCR)
   └─ Tag with: latest, main, v1.2.3, sha-abc123

5. Deploy stage (if build succeeds)
   ├─ SSH into VM
   ├─ Execute deploy.sh
   │   ├─ docker pull       (get latest image)
   │   ├─ docker stop       (stop old container)
   │   └─ docker run        (start new container)
   └─ Verify health check

6. Verify Deployment
   ├─ Wait 10 seconds for startup
   └─ curl /api/health (check 30 times, 1 second intervals)

7. Success or Rollback
   ├─ Success: Cleanup old backups
   └─ Failure: Rollback to previous version
```

### Runtime Flow

```
User Browser
    │
    ├─► HTTP Request (GET /)
    │
    ▼
Docker Container (Port 3000)
    │
    ├─► Express Server
    │   ├─ Middleware (CORS, body-parser)
    │   └─ Routes
    │       ├─ Static files (/build)
    │       ├─ API routes (/api/*)
    │       └─ SPA fallback (/)
    │
    └─► Response (HTML + JS + CSS)
         │
         ▼
    React App (Browser)
         │
         ├─► useEffect Hook
         │   └─ fetch('/api/status') every 5 seconds
         │
         └─► Display UI
             ├─ Header with status
             ├─ Features list
             └─ Footer
```

### Health Check Flow

```
Docker Engine (every 30 seconds)
    │
    └─► Execute health check command:
         curl -f http://localhost:3000/api/health
    │
    ├─ Success (HTTP 200)
    │   └─ Status: healthy
    │
    └─ Failure (non-200 or timeout)
        └─ Retry 3 times
            └─ If all fail: mark unhealthy
```

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│          Internet / GitHub                          │
└────────────────────┬────────────────────────────────┘
                     │
            SSH (encrypted, key-based)
                     │
    ┌────────────────▼────────────────┐
    │    Security Group / Firewall     │
    │  ├─ Port 22 (SSH) - restricted  │
    │  ├─ Port 80 (HTTP) - all        │
    │  ├─ Port 443 (HTTPS) - all      │
    │  └─ Port 3000 (App) - all       │
    └────────────────┬────────────────┘
                     │
    ┌────────────────▼────────────────┐
    │       Virtual Machine            │
    │  ├─ Run as non-root user        │
    │  ├─ Updated system packages     │
    │  └─ Fail2ban configured         │
    └────────────────┬────────────────┘
                     │
    ┌────────────────▼────────────────┐
    │    Docker Container              │
    │  ├─ Alpine base (minimal)        │
    │  ├─ Non-root user                │
    │  ├─ Read-only filesystem (conf)  │
    │  └─ Health checks                │
    └───────────────────────────────────┘
```

### Secrets Management

```
GitHub Repository
├── Secrets (encrypted, not in logs)
│   ├── DEPLOY_KEY           (private SSH key)
│   ├── VM_HOST              (VM IP/DNS)
│   ├── VM_USER              (ubuntu/azureuser)
│   ├── DOCKER_USERNAME      (registry user)
│   └── DOCKER_PASSWORD      (registry token)
│
└── Accessed only in CI/CD actions
    └── Never logged or printed
```

## Scalability Considerations

### Current Design
- Single VM deployment
- Suitable for: Development, staging, small production

### Scaling Options

#### Horizontal Scaling
```
Load Balancer
    ├─ VM 1 (App instance)
    ├─ VM 2 (App instance)
    └─ VM N (App instance)
```

#### Improvements Needed
1. Shared database (if data storage needed)
2. Session management (Redis)
3. Load balancer (ALB / Azure LB)
4. Auto-scaling policies
5. Centralized logging

## Monitoring Points

1. **Application Level**
   - /api/health endpoint
   - /api/status endpoint
   - Docker health checks
   - Application logs

2. **Container Level**
   - Docker resource usage (memory, CPU)
   - Container restart count
   - Health status transitions

3. **VM Level**
   - Disk space (/opt/app, /var/log)
   - Network connectivity
   - System load
   - SSH access logs

4. **Pipeline Level**
   - GitHub Actions status
   - Deployment duration
   - Test coverage
   - Build artifacts

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Backend | Node.js + Express | 18.x, 20.x |
| Container | Docker | Latest |
| Orchestration | Docker Compose | 3.8 |
| CI/CD | GitHub Actions | Native |
| Registry | GitHub Container Registry | ghcr.io |
| Base Image | Alpine Linux | 18-alpine |
| Process Manager | dumb-init | Latest |
| Package Manager | npm | latest |

## Future Enhancements

1. **Database Integration**
   - PostgreSQL / MongoDB
   - Connection pooling
   - Migration scripts

2. **Advanced Monitoring**
   - Prometheus metrics
   - ELK Stack for logging
   - Grafana dashboards
   - CloudWatch / Azure Monitor

3. **Caching**
   - Redis for sessions
   - CDN for static assets
   - Client-side caching

4. **Authentication**
   - OAuth2 / OpenID Connect
   - JWT tokens
   - Rate limiting

5. **Infrastructure**
   - Kubernetes migration
   - Infrastructure as Code (Terraform)
   - Multi-region deployment
   - Disaster recovery plan

---

**Last Updated**: May 6, 2026
