# Argo CD GitOps Configuration for HealthSync

Argo CD automatically syncs your Git repository with your Kubernetes cluster, providing GitOps-based deployment automation.

## Installation

```bash
# Create argocd namespace
kubectl create namespace argocd

# Install Argo CD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

## Configuration Files

- `argocd-application.yaml` — Application manifest for GitOps sync
- `argocd-repo-credentials.yaml` — GitHub credentials (sealed-secrets)

## Usage

1. Add Git repository to Argo CD
2. Create Application resource pointing to Git repo + K8s cluster
3. Argo CD automatically detects changes and syncs

See YAML files for specific configurations.
