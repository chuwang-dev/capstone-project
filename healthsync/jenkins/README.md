# Jenkins CI/CD Pipeline for HealthSync

This folder contains the Jenkins pipeline configuration for automated build, test, and deployment of HealthSync microservices.

## Pipeline Stages

1. **Checkout** — Clone repository code
2. **Build & Test Backend** — Install dependencies and run Jest tests
3. **Security Scan** — Optional Trivy and SonarQube scans
4. **Build Docker Images** — Build images for backend, auth, and frontend
5. **Push to Registry** — Push images to Docker Hub
6. **Deploy to Kubernetes** — Apply manifests and deploy to K8s
7. **Smoke Tests** — Basic health checks
8. **Notify** — Send build status notifications

## Setup Instructions

### Prerequisites

- Jenkins server (v2.400+)
- Docker installed on agent
- kubectl configured for K8s cluster
- Docker Hub credentials
- Kubeconfig file for cluster access

### 1. Create Jenkins Credentials

```bash
# Docker Hub credentials
Jenkins → Manage Credentials → Add Credentials
- ID: docker-hub-credentials
- Username: <your-docker-username>
- Password: <your-docker-password>

# Kubeconfig
Jenkins → Manage Credentials → Add Credentials
- ID: kubeconfig
- File: ~/.kube/config (upload your kubeconfig)
```

### 2. Create Pipeline Job

```bash
# In Jenkins UI:
1. New Item → Pipeline
2. Name: healthsync-pipeline
3. Pipeline section:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: https://github.com/chuwang-dev/simple-cicd-app.git
   - Branch: main
   - Script Path: healthsync/jenkins/Jenkinsfile
```

### 3. Configure Webhook (Optional)

```bash
# GitHub → Repository Settings → Webhooks
- Payload URL: https://jenkins.example.com/github-webhook/
- Content type: application/json
- Triggers: Push events
```

### 4. Optional: Enable Slack Notifications

```bash
# Jenkins → Manage Plugins → Install "Slack Notification"
# Jenkins → Manage Credentials → Add Slack webhook URL
# Update Jenkinsfile SLACK_WEBHOOK variable
```

## Run Pipeline

```bash
# Trigger manually in Jenkins UI or via webhook
# Monitor logs: Jenkins → Build → Console Output
```

## Environment Variables

- `BUILD_VERSION` — Build number + Git commit hash
- `BACKEND_IMAGE`, `AUTH_IMAGE`, `FRONTEND_IMAGE` — Docker image names
- `DOCKER_REGISTRY` — Docker Hub (configurable)

## Troubleshooting

- **Docker push fails:** Check Docker Hub credentials
- **Kubernetes deploy fails:** Verify kubeconfig and cluster connectivity
- **Tests fail:** Check Jest configuration and test files
- **Pod crashes:** Check logs with `kubectl logs <pod-name> -n healthsync`

## Security Best Practices

1. Use Jenkins secrets manager for credentials
2. Enable SSL/TLS for Jenkins
3. Restrict access to Jenkins UI
4. Use sealed-secrets for K8s secrets
5. Scan images with Trivy before deployment
6. Enable RBAC in Kubernetes
