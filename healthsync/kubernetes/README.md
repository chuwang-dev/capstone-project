# Kubernetes Manifests for HealthSync

This directory contains Kubernetes YAML manifests for deploying HealthSync microservices.

## Structure

- `namespaces/` — Kubernetes namespaces
- `deployments/` — Service deployments
- `services/` — ClusterIP/LoadBalancer services
- `ingress/` — Ingress controller configuration
- `configmaps/` — Application configuration
- `secrets/` — Sensitive data (create manually)
- `monitoring/` — Prometheus, Grafana manifests

## Quick Deploy

```bash
# Create namespace
kubectl apply -f namespaces/

# Create ConfigMaps & Secrets
kubectl apply -f configmaps/
kubectl apply -f secrets/

# Deploy services
kubectl apply -f deployments/
kubectl apply -f services/

# Deploy ingress
kubectl apply -f ingress/

# Deploy monitoring
kubectl apply -f monitoring/
```

## Check Status

```bash
kubectl get pods -n healthsync
kubectl logs -f deployment/backend -n healthsync
```
