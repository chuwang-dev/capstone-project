# HealthSync Project — File Index & Quick Reference

**Project Status:** ✅ COMPLETE  
**Location:** `/workspaces/simple-cicd-app/healthsync/`

---

## 📂 Directory Structure

```
healthsync/
├── README.md                          # Main project documentation
├── DELIVERABLES.md                    # Complete deliverables checklist
├── ARCHITECTURE.md                    # Architecture diagrams and flows
├── .gitignore                         # Git ignore patterns
│
├── backend/                           # Node.js API Service
│   ├── package.json                   # Dependencies & scripts
│   ├── server.js                      # Express REST API (15+ endpoints)
│   ├── migrate.js                     # Database schema creation
│   ├── seed.js                        # Sample data seeding
│   ├── server.test.js                 # Jest test suite (7 tests)
│   ├── jest.config.js                 # Jest configuration
│   ├── Dockerfile                     # Node.js 18 Alpine image
│   └── .env.example                   # Environment variables template
│
├── auth-service/                      # JWT Authentication Service
│   ├── package.json                   # Dependencies
│   ├── server.js                      # Express JWT service
│   ├── Dockerfile                     # Node.js 18 Alpine image
│   └── README.md                      # Auth service docs
│
├── frontend/                          # React SPA
│   ├── index.html                     # React app with CDN imports
│   ├── Dockerfile                     # NGINX Alpine image
│   └── README.md                      # Frontend docs
│
├── docker-compose.yml                 # Local multi-service composition
│
├── terraform/                         # AWS Infrastructure as Code
│   ├── main.tf                        # VPC, subnets, routes, gateways
│   ├── variables.tf                   # Configurable variables
│   ├── security.tf                    # Security groups (ALB, EKS, RDS)
│   ├── terraform.tfvars               # Environment values
│   ├── .gitignore                     # Terraform ignores
│   └── README.md                      # Terraform setup guide
│
├── kubernetes/                        # Kubernetes Manifests
│   ├── README.md                      # K8s deployment guide
│   │
│   ├── namespaces/                    # K8s Namespaces
│   │   └── healthsync-ns.yaml         # healthsync namespace
│   │
│   ├── configmaps/                    # Application Configuration
│   │   └── app-config.yaml            # Backend, auth, frontend config
│   │
│   ├── secrets/                       # Sensitive Data
│   │   └── secrets.yaml               # DB passwords, JWT secrets (TEMPLATE)
│   │
│   ├── deployments/                   # Service Deployments & StatefulSets
│   │   ├── services.yaml              # Backend, Auth, Frontend deployments
│   │   ├── hpa.yaml                   # Horizontal Pod Autoscaling
│   │   ├── blue-green.yaml            # Blue-Green deployment strategy
│   │   └── canary.yaml                # Canary deployment strategy
│   │
│   ├── services/                      # Kubernetes Services
│   │   └── all-services.yaml          # Services & StatefulSets for all components
│   │
│   ├── ingress/                       # Ingress Controllers
│   │   ├── ingress.yaml               # NGINX ingress with routing rules
│   │   └── ssl-ingress.yaml           # TLS/SSL with Let's Encrypt
│   │
│   └── monitoring/                    # Monitoring & Logging Stack
│       ├── prometheus-config.yaml     # Prometheus config & alert rules
│       ├── prometheus-grafana.yaml    # Prometheus & Grafana deployments
│       ├── elk-stack.yaml             # Elasticsearch, Kibana, Filebeat
│       └── README.md                  # Monitoring setup guide
│
├── jenkins/                           # CI/CD Pipeline
│   ├── Jenkinsfile                    # Jenkins declarative pipeline
│   └── README.md                      # Jenkins setup & troubleshooting
│
└── argocd/                            # GitOps Automation
    ├── argocd-application.yaml        # Argo CD Application manifest
    └── README.md                      # Argo CD setup guide
```

---

## 🔑 Key Files Quick Reference

### Application Code

| File | Purpose | Status |
|------|---------|--------|
| `backend/server.js` | REST API with 15+ endpoints | ✅ Complete |
| `backend/migrate.js` | Database schema (6 tables) | ✅ Complete |
| `backend/seed.js` | Sample data insertion | ✅ Complete |
| `backend/server.test.js` | Jest test suite (7 tests) | ✅ Complete |
| `auth-service/server.js` | JWT authentication | ✅ Complete |
| `frontend/index.html` | React SPA with UI components | ✅ Complete |

### Docker & Local Development

| File | Purpose | Status |
|------|---------|--------|
| `backend/Dockerfile` | Node.js 18 Alpine image | ✅ Complete |
| `auth-service/Dockerfile` | Node.js 18 Alpine image | ✅ Complete |
| `frontend/Dockerfile` | NGINX Alpine image | ✅ Complete |
| `docker-compose.yml` | Multi-service local stack | ✅ Complete |

### Infrastructure as Code (Terraform)

| File | Purpose | Status |
|------|---------|--------|
| `terraform/main.tf` | VPC, subnets, routes, gateways | ✅ Complete |
| `terraform/security.tf` | Security groups (3 total) | ✅ Complete |
| `terraform/variables.tf` | Configurable parameters | ✅ Complete |
| `terraform/terraform.tfvars` | Default environment values | ✅ Complete |

### Kubernetes Manifests

| File | Purpose | Resources | Status |
|------|---------|-----------|--------|
| `kubernetes/namespaces/healthsync-ns.yaml` | K8s namespace | 1 | ✅ |
| `kubernetes/configmaps/app-config.yaml` | App configuration | 3 ConfigMaps | ✅ |
| `kubernetes/secrets/secrets.yaml` | Credentials | 3 Secrets | ✅ |
| `kubernetes/deployments/services.yaml` | Deployments | 3 Deployments | ✅ |
| `kubernetes/services/all-services.yaml` | Services | 8 Services + 1 StatefulSet | ✅ |
| `kubernetes/ingress/ingress.yaml` | Ingress routing | 1 Ingress | ✅ |
| `kubernetes/deployments/hpa.yaml` | Auto-scaling | 2 HPA | ✅ |
| `kubernetes/deployments/blue-green.yaml` | Blue-Green | 2 Deployments | ✅ |
| `kubernetes/deployments/canary.yaml` | Canary | 2 Deployments + Ingress | ✅ |
| `kubernetes/ingress/ssl-ingress.yaml` | TLS/SSL | 2 ClusterIssuers + 1 Ingress | ✅ |

### Monitoring & Logging

| File | Purpose | Components | Status |
|------|---------|-----------|--------|
| `kubernetes/monitoring/prometheus-config.yaml` | Prometheus setup | ConfigMaps, alert rules | ✅ |
| `kubernetes/monitoring/prometheus-grafana.yaml` | Prometheus & Grafana | 2 Deployments, Services, RBAC | ✅ |
| `kubernetes/monitoring/elk-stack.yaml` | ELK Stack | ES, Kibana, Filebeat DaemonSet | ✅ |

### CI/CD & GitOps

| File | Purpose | Status |
|------|---------|--------|
| `jenkins/Jenkinsfile` | 8-stage CI/CD pipeline | ✅ Complete |
| `argocd/argocd-application.yaml` | GitOps auto-deployment | ✅ Complete |

### Documentation

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Project overview & quick start | ✅ Complete |
| `DELIVERABLES.md` | Detailed deliverables checklist | ✅ Complete |
| `ARCHITECTURE.md` | System diagrams & flows | ✅ Complete |

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Total YAML Manifests | 20+ |
| Terraform Files | 4 |
| Backend Endpoints | 15+ |
| Database Tables | 6 |
| Test Cases | 7+ |
| Kubernetes Resources | 50+ |
| Docker Images | 3 |
| Pod Replicas (min) | 8 |
| Pod Replicas (max) | 22 |
| Security Groups | 3 |
| Subnets | 4 |

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Clone repository
- [ ] Update `terraform.tfvars` with your AWS region
- [ ] Update `kubernetes/secrets/secrets.yaml` with real credentials
- [ ] Configure Docker Hub credentials in Jenkins
- [ ] Update domain in `kubernetes/ingress/ssl-ingress.yaml`

### Phase 1: Local Testing

```bash
cd healthsync
docker compose up --build
# Verify all services running
```

### Phase 2: AWS Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Phase 3: Kubernetes Setup

```bash
# Apply core resources
kubectl apply -f kubernetes/namespaces/
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/ingress/

# Apply monitoring
kubectl apply -f kubernetes/monitoring/

# Verify deployments
kubectl get deployments -n healthsync
kubectl get pods -n healthsync
```

### Phase 4: Jenkins Setup

1. Create Jenkins Pipeline job
2. Point to `healthsync/jenkins/Jenkinsfile`
3. Add credentials: Docker Hub, Kubeconfig
4. Configure GitHub webhook (optional)

### Phase 5: GitOps (Argo CD)

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f argocd/argocd-application.yaml
```

---

## 📚 Documentation Files

### Root Level
- **README.md** — Project overview, features, quick start
- **DELIVERABLES.md** — Complete deliverables checklist
- **ARCHITECTURE.md** — System diagrams and architecture flows

### Component-Level
- `backend/` — API endpoints, database schema (in code comments)
- `terraform/README.md` — Infrastructure setup guide
- `kubernetes/README.md` — K8s deployment instructions
- `jenkins/README.md` — CI/CD pipeline setup
- `argocd/README.md` — GitOps configuration

---

## 🔍 Important Endpoints

### Local Development
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3001`
- Auth Service: `http://localhost:3002`
- Grafana (later): `http://localhost:3000`
- Kibana (later): `http://localhost:5601`

### Kubernetes
- Prometheus: `kubectl port-forward svc/prometheus -n monitoring 9090:9090`
- Grafana: `kubectl port-forward svc/grafana -n monitoring 3000:3000`
- Kibana: `kubectl port-forward svc/kibana -n monitoring 5601:5601`
- Argo CD: `kubectl port-forward svc/argocd-server -n argocd 8080:443`

---

## 🛠️ Development Commands

### Backend

```bash
cd backend
npm install
npm start           # Start server
npm test            # Run Jest tests
npm run migrate     # Create database schema
npm run seed        # Insert sample data
```

### Docker

```bash
# Build all images
docker compose build

# Run all services
docker compose up

# Stop services
docker compose down

# View logs
docker compose logs -f backend
```

### Kubernetes

```bash
# Deploy to K8s
kubectl apply -f kubernetes/

# Check status
kubectl get pods -n healthsync
kubectl logs deployment/backend -n healthsync

# Scale deployment
kubectl scale deployment backend -n healthsync --replicas=5

# Port forward services
kubectl port-forward svc/frontend -n healthsync 8080:80
```

### Terraform

```bash
cd terraform
terraform init      # Initialize Terraform
terraform plan      # Preview changes
terraform apply     # Apply infrastructure
terraform destroy   # Tear down infrastructure
```

---

## 📌 Key Configuration Values

### Environment

```
AWS Region: us-east-1
VPC CIDR: 10.0.0.0/16
Public Subnets: 10.0.1.0/24, 10.0.2.0/24
Private Subnets: 10.0.10.0/24, 10.0.11.0/24
```

### Database

```
PostgreSQL User: postgres
Database Name: healthsync
Port: 5432
```

### Services

```
Backend Port: 3001
Auth Service Port: 3002
Frontend Port: 80/443
Redis Port: 6379
Prometheus Port: 9090
Grafana Port: 3000
Kibana Port: 5601
```

### Kubernetes

```
Namespace: healthsync
Monitoring Namespace: monitoring
Backend Replicas: 2-10 (HPA)
Frontend Replicas: 1-5 (HPA)
```

---

## 🎓 Learning Resources

### For Each Technology

- **Node.js/Express** → `backend/server.js`
- **React** → `frontend/index.html`
- **PostgreSQL** → `backend/migrate.js`
- **Docker** → `*/Dockerfile` and `docker-compose.yml`
- **Terraform** → `terraform/*.tf`
- **Kubernetes** → `kubernetes/**/*.yaml`
- **Jenkins** → `jenkins/Jenkinsfile`
- **Prometheus/Grafana** → `kubernetes/monitoring/prometheus-grafana.yaml`
- **ELK Stack** → `kubernetes/monitoring/elk-stack.yaml`
- **Argo CD** → `argocd/argocd-application.yaml`

---

## ✅ Verification Steps

```bash
# 1. Local services running
docker compose up --build
curl http://localhost:3001/api/health

# 2. Database connected
curl http://localhost:3001/api/stats

# 3. Auth service working
curl -X POST http://localhost:3002/auth/login \
  -d '{"username":"test","password":"test"}' \
  -H "Content-Type: application/json"

# 4. Frontend loading
curl http://localhost:8080 | head -20

# 5. Kubernetes deployment
kubectl apply -f kubernetes/
kubectl get pods -n healthsync
kubectl get svc -n healthsync
```

---

**Generated:** May 21, 2026  
**Project Status:** ✅ COMPLETE - Production-Ready
