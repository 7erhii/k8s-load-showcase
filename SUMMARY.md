# Kubernetes Load Showcase - Summary

## What We Built

A local Kubernetes demo showcasing **load generation**, **auto-scaling**, and **monitoring** capabilities.

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │─────▶│   Express    │─────▶│ Kubernetes  │
│  Frontend   │      │     API      │      │  (Docker    │
│             │      │              │      │   Desktop)  │
└─────────────┘      └──────────────┘      └─────────────┘
     Port 8081           Port 3000         Manages pods
```

### Components

1. **Frontend** (`nextjs/`)
   - Load generator UI (requests/sec, duration, response size)
   - Real-time monitoring panel (uptime, requests, memory, CPU)
   - English interface

2. **Backend** (`api/`)
   - `/work` - Simulates CPU-intensive work
   - `/stats` - Returns server metrics (uptime, memory, load)
   - `/metrics` - Prometheus-style metrics endpoint

3. **Kubernetes** (`k8s/`)
   - `namespace.yaml` - Isolated namespace `k8s-showcase`
   - `*-deployment.yaml` - Pod definitions (frontend + api)
   - `*-service.yaml` - Internal service discovery (ClusterIP)
   - `api-hpa.yaml` - Horizontal Pod Autoscaler (requires metrics-server)

## Quick Start

```bash
# 1. Build images and deploy
bash show/scripts/start-local.sh

# 2. Port-forward to access frontend
kubectl port-forward -n k8s-showcase svc/frontend 8081:80

# 3. Open browser
open http://localhost:8081
```

## Stop / Restart / Cleanup

```bash
# Restart deployments (after code changes)
kubectl rollout restart deployment/frontend -n k8s-showcase
kubectl rollout restart deployment/api -n k8s-showcase

# Stop everything (delete namespace)
kubectl delete namespace k8s-showcase

# Full cleanup (stop all containers + delete namespace)
docker stop $(docker ps -q) 2>/dev/null || true
kubectl delete namespace k8s-showcase 2>/dev/null || true

# Check status
kubectl get pods -n k8s-showcase
kubectl get all -n k8s-showcase
```

## Key Concepts Demonstrated

- **Containerization**: Docker images for frontend & backend
- **Service Discovery**: Kubernetes Services (ClusterIP)
- **Load Balancing**: Service distributes requests across pods
- **Auto-scaling**: HPA scales pods based on CPU/memory (when metrics-server enabled)
- **Monitoring**: Real-time stats from API + Kubernetes metrics

## Current Limitations

- **No metrics-server**: HPA won't work without it
- **Single replica**: API starts with 1 pod (manual scaling: `kubectl scale deployment/api -n k8s-showcase --replicas=3`)
- **Browser keep-alive**: Load from browser may hit same pod (use external load generator for true distribution)

## Next Steps (Optional)

- Install metrics-server for HPA
- Add Prometheus + Grafana for advanced monitoring
- Switch to NodePort/Ingress (remove need for port-forward)
- Add database (PostgreSQL) for persistent state
