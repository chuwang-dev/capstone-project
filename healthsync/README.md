# HealthSync — Enterprise DevOps Platform

A production-grade microservices-based healthcare management platform demonstrating enterprise-level DevOps, cloud infrastructure, Kubernetes orchestration, and CI/CD automation.

## 📋 Project Overview

HealthSync is a complete end-to-end DevOps project showcasing:

- **Microservices Architecture** — Backend API, Auth service, frontend SPA
- **Infrastructure as Code** — Terraform for AWS provisioning
- **Container Orchestration** — Kubernetes manifests with deployments, HPA, ingress
- **CI/CD Automation** — Jenkins pipeline with automated build, test, and deployment
- **Monitoring & Logging** — Prometheus, Grafana, ELK Stack
- **GitOps** — Argo CD for continuous deployment
- **Enterprise Features** — SSL/TLS, Blue-Green deployment, Canary releases

## 🏗️ Architecture

```
Users
  ↓
NGINX Ingress (SSL/TLS)
  ↓
Kubernetes Cluster
├── Frontend (React)
├── Backend API (Node.js)
├── Auth Service (JWT)
├── PostgreSQL (data)
└── Redis (cache)
  ↓
Monitoring & Logging
├── Prometheus + Grafana
└── ELK Stack
```

## 📁 Key Folders

- `backend/` — Node.js API: 15+ endpoints, PostgreSQL, Redis caching, Jest tests
- `auth-service/` — JWT authentication service
- `frontend/` — React SPA with patient management UI
- `terraform/` — AWS IaC: VPC, subnets, security groups, NAT gateways
- `kubernetes/` — K8s manifests: deployments, services, ingress, HPA, monitoring
- `jenkins/` — CI/CD pipeline: build, test, Docker, deploy, smoke tests
- `argocd/` — GitOps: continuous deployment automation
- `docker-compose.yml` — Local multi-service development environment

## 🚀 Quick Start

### Local (Docker Compose)

```bash
docker compose up --build
# Frontend: http://localhost:8080
# Backend API: http://localhost:3001
```

### Kubernetes

```bash
kubectl apply -f kubernetes/namespaces/
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/ingress/
```

### AWS Infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform apply
```

### CI/CD (Jenkins)

Pipeline stages: Checkout → Build & Test → Docker Build → Push Registry → Deploy K8s → Smoke Tests

See `jenkins/README.md` for setup instructions.

### GitOps (Argo CD)

Automatic continuous deployment from Git repository to Kubernetes.

## 🎯 Enterprise Features

✅ **SSL/TLS** — Let's Encrypt integration via cert-manager  
✅ **Blue-Green Deployment** — Zero-downtime rollouts  
✅ **Canary Releases** — Gradual traffic shifting  
✅ **Auto-scaling** — HPA for dynamic pod scaling  
✅ **Monitoring** — Prometheus + Grafana dashboards  
✅ **Logging** — ELK Stack for centralized log aggregation  
✅ **Security** — RBAC, secrets management, network policies  

## 📊 API Endpoints

- `GET /api/health` — Health check
- `GET /api/patients` — List patients
- `POST /api/patients` — Create patient
- `GET /api/patients/:id/appointments` — Patient appointments
- `GET /api/stats` — Dashboard statistics

## 🔐 Security

- JWT authentication
- Kubernetes RBAC
- Secret management
- Network policies
- SSL/TLS enforcement
- Image scanning (Trivy)

## 📚 Documentation

- [Backend API](backend/README.md)
- [Terraform IaC](terraform/README.md)
- [Kubernetes Deployment](kubernetes/README.md)
- [Jenkins CI/CD](jenkins/README.md)
- [Argo CD GitOps](argocd/README.md)

---

**Status:** Production-ready skeleton with all enterprise components
