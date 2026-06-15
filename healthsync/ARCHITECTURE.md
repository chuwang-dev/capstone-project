# HealthSync Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Users / Clients                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NGINX Ingress Controller                          │
│                  (SSL/TLS, Rate Limiting, Path-Based Routing)           │
│                              (healthsync.io)                             │
└─────────────────────────────────────────────────────────────────────────┘
         │                          │                          │
         ▼                          ▼                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend SPA   │    │   Backend API    │    │  Auth Service    │
│   (React)        │    │   (Node.js)      │    │   (JWT)          │
│   Port: 80/443   │    │   Port: 3001     │    │   Port: 3002     │
│   Replicas: 2-5  │    │   Replicas: 2-10 │    │   Replicas: 2-4  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────────┐   ┌──────────────────┐
            │   PostgreSQL     │   │      Redis       │
            │   (Primary DB)   │   │     (Cache)      │
            │   Port: 5432     │   │   Port: 6379     │
            │   PVC: 10Gi      │   │   Ephemeral      │
            └──────────────────┘   └──────────────────┘
```

## Kubernetes Cluster Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         KUBERNETES CLUSTER (EKS)                          │
│                                                                            │
│  ┌──────────────────┬──────────────────┬──────────────────┐              │
│  │     Worker 1     │     Worker 2     │     Worker 3     │              │
│  │                  │                  │                  │              │
│  │ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │              │
│  │ │ Backend Pod  │ │ │ Backend Pod  │ │ │ Backend Pod  │ │              │
│  │ │ (Running)    │ │ │ (Running)    │ │ │ (Running)    │ │              │
│  │ └──────────────┘ │ └──────────────┘ │ └──────────────┘ │              │
│  │                  │                  │                  │              │
│  │ ┌──────────────┐ │ ┌──────────────┐ │                  │              │
│  │ │ Frontend Pod │ │ │ Frontend Pod │ │                  │              │
│  │ └──────────────┘ │ └──────────────┘ │                  │              │
│  │                  │                  │                  │              │
│  │ ┌──────────────┐ │ ┌──────────────┐ │                  │              │
│  │ │ Auth Pod     │ │ │ Auth Pod     │ │                  │              │
│  │ └──────────────┘ │ └──────────────┘ │                  │              │
│  └──────────────────┴──────────────────┴──────────────────┘              │
│                                                                            │
│  ┌──────────────────┬──────────────────┐                                  │
│  │   PostgreSQL     │      Redis       │                                  │
│  │   StatefulSet    │    Deployment    │                                  │
│  │   (Persistent)   │   (Ephemeral)    │                                  │
│  └──────────────────┴──────────────────┘                                  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────┐           │
│  │         Monitoring Namespace (monitoring)                 │           │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │           │
│  │  │ Prometheus   │  │   Grafana    │  │  Kibana      │   │           │
│  │  │              │  │              │  │ (ELK Stack)  │   │           │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │           │
│  └───────────────────────────────────────────────────────────┘           │
│                                                                            │
│  HPA: Backend (2-10), Frontend (1-5), Auth (2-4)                          │
│  RBAC: ServiceAccounts, Roles, RoleBindings configured                   │
└───────────────────────────────────────────────────────────────────────────┘
```

## CI/CD Pipeline Flow

```
┌───────────────────┐
│  GitHub Webhook   │
│  (on push main)   │
└────────┬──────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│         Jenkins Pipeline Start            │
│                                           │
│  ┌──────────────────────────────────┐   │
│  │ 1. Checkout Code from Git        │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 2. Build & Test Backend (Jest)   │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 3. Security Scan (Trivy/Sonar)   │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 4. Build Docker Images (3)       │   │
│  │    - Backend, Auth, Frontend     │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 5. Push to Docker Hub Registry   │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 6. Deploy to Kubernetes Cluster  │   │
│  │    - Apply manifests             │   │
│  │    - Verify rollout              │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 7. Smoke Tests (Health Checks)   │   │
│  └──────────────┬───────────────────┘   │
│                 │                        │
│  ┌──────────────▼───────────────────┐   │
│  │ 8. Notify (Slack/Email)          │   │
│  └──────────────────────────────────┘   │
│                                           │
└──────────────────────────────────────────┘
         │
         ▼
    ✓ SUCCESS  /  ✗ FAILURE
    Deployed   \  Alert & Notify
```

## AWS Infrastructure (Terraform)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Account (Region: us-east-1)              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        VPC (10.0.0.0/16)                     │  │
│  │                                                              │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐           │  │
│  │  │   Public Subnet 1   │  │   Public Subnet 2   │           │  │
│  │  │   (10.0.1.0/24)     │  │   (10.0.2.0/24)     │           │  │
│  │  │                     │  │                     │           │  │
│  │  │  - NAT Gateway 1    │  │  - NAT Gateway 2    │           │  │
│  │  │  - Internet Route   │  │  - Internet Route   │           │  │
│  │  └─────────────────────┘  └─────────────────────┘           │  │
│  │           │                        │                         │  │
│  │           └────────┬───────────────┘                         │  │
│  │                    │                                         │  │
│  │              Internet Gateway                               │  │
│  │                                                              │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐           │  │
│  │  │  Private Subnet 1   │  │  Private Subnet 2   │           │  │
│  │  │   (10.0.10.0/24)    │  │   (10.0.11.0/24)    │           │  │
│  │  │                     │  │                     │           │  │
│  │  │  - EKS Worker Nodes │  │  - EKS Worker Nodes │           │  │
│  │  │  - Routes via NAT   │  │  - Routes via NAT   │           │  │
│  │  └─────────────────────┘  └─────────────────────┘           │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────┐                  │  │
│  │  │   Security Groups                    │                  │  │
│  │  │  ┌──────────────────────────────┐   │                  │  │
│  │  │  │ ALB SG (80, 443)             │   │                  │  │
│  │  │  └──────────────────────────────┘   │                  │  │
│  │  │  ┌──────────────────────────────┐   │                  │  │
│  │  │  │ EKS Nodes SG (K8s traffic)   │   │                  │  │
│  │  │  └──────────────────────────────┘   │                  │  │
│  │  │  ┌──────────────────────────────┐   │                  │  │
│  │  │  │ RDS SG (PostgreSQL 5432)     │   │                  │  │
│  │  │  └──────────────────────────────┘   │                  │  │
│  │  └──────────────────────────────────────┘                  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           S3 Bucket (Terraform State Backend)                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## GitOps Workflow (Argo CD)

```
┌──────────────────────────────────────────────────────────────────┐
│                     GitHub Repository                             │
│                  healthsync/kubernetes/                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  main branch:                                              │  │
│  │  - deployments/ (backend, auth, frontend)                 │  │
│  │  - services/ (ClusterIP, LoadBalancer)                    │  │
│  │  - ingress/ (routing rules)                               │  │
│  │  - configmaps/ (app configuration)                        │  │
│  │  - monitoring/ (prometheus, grafana, elk)                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ (Git Webhook)                       │
│                            ▼                                      │
│                      ┌──────────────────┐                        │
│                      │   Argo CD        │                        │
│                      │   (argocd ns)    │                        │
│                      │                  │                        │
│                      │ Watches Git Repo │                        │
│                      │ Detects Changes  │                        │
│                      │ Auto-syncs       │                        │
│                      └──────┬───────────┘                        │
│                             │                                     │
│                             ▼                                     │
│                      ┌──────────────────┐                        │
│                      │  Kubernetes      │                        │
│                      │  Cluster         │                        │
│                      │                  │                        │
│                      │ - Deploys pods   │                        │
│                      │ - Scales services│                        │
│                      │ - Updates config │                        │
│                      └──────────────────┘                        │
│                                                                   │
│  Rollback: 1-click deployment to previous Git commit             │
│  Drift Detection: Alerts if cluster differs from Git             │
│  Auto-heal: Redeploy if pods fail                               │
└──────────────────────────────────────────────────────────────────┘
```

## Deployment Strategies

### Blue-Green Deployment

```
Current (Blue):
  backend:3001 ──┐
                 ├──→ Service selector: "version: blue"
                 │
Backend Blue (v1.0.0) ✓ ACTIVE

Staged (Green):
  backend:3001 ──┐
                 ├──→ Service selector: "version: green"  (initially 0 replicas)
                 │
Backend Green (v1.1.0) Ready

Switch Command:
  kubectl patch service backend -p '{"spec":{"selector":{"version":"green"}}}'

Result:
  All traffic → Backend Green (v1.1.0) instantly
  Can rollback instantly to "version: blue"
```

### Canary Deployment

```
Stable (90%):
  backend-stable ─┐
                  ├──→ Service (matches both)
                  │
Backend v1.0.0   ✓ 3 replicas

Canary (10%):
  backend-canary ─┐
                  │
Backend v1.1.0   → 1 replica (initial)

NGINX Ingress routes:
  10% requests → canary service
  90% requests → stable service

Monitor canary metrics:
  - Error rate
  - Response time
  - Resource usage

If successful:
  Scale canary replicas up
  Eventually switch all traffic to canary
```

## Monitoring Stack

```
┌────────────────────────────────────────────────────────────┐
│                   Application Pods                          │
│  (Backend, Auth, Frontend, PostgreSQL, Redis)              │
│              ↓ (Metrics via Prometheus SDK)                │
│         :9090/metrics                                      │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Prometheus       │  - Scrapes metrics every 15s
        │   (monitoring ns)  │  - Stores time-series data
        │   :9090            │  - Evaluates alert rules
        └────────┬───────────┘
                 │
         ┌───────┴──────────┐
         ▼                  ▼
    ┌─────────────┐   ┌──────────────┐
    │  Grafana    │   │   Alerting   │
    │ (monitoring │   │   Manager    │
    │  ns)        │   │              │
    │ :3000       │   │ Slack, Email │
    └─────────────┘   └──────────────┘

Logging Stack:
┌────────────────────────────────────────────────────────────┐
│                   Pod Logs                                  │
│     /var/log/containers/*.log                              │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Filebeat (DS)    │ - Ships logs to Elasticsearch
        │   (monitoring ns)  │ - Adds K8s metadata
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Elasticsearch     │ - Stores logs
        │  (monitoring ns)   │ - Full-text indexing
        │  :9200             │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │     Kibana         │ - Log visualization
        │  (monitoring ns)   │ - Dashboards & alerts
        │  :5601             │
        └────────────────────┘
```

---

Generated: May 21, 2026  
Status: Complete - Production-Ready
