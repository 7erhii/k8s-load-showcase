# Kubernetes Load Showcase

Local showcase: Next.js frontend + Express API + Kubernetes orchestration.

## What's inside
- `nextjs/` — UI that generates load.
- `api/` — backend with `/work`, `/stats`, `/metrics`.
- `k8s/` — Kubernetes manifests.
- `scripts/start-local.sh` — one-command startup.

## Quick Start
1) Ensure Kubernetes is enabled in Docker Desktop.
2) Run:
   ```bash
   bash show/scripts/start-local.sh
   ```
3) Open the interface:
   ```bash
   kubectl port-forward -n k8s-showcase svc/frontend 8081:80
   ```
   Then `http://localhost:8081`.

## Check load and scaling
Open a separate terminal:
```bash
kubectl get pods -n k8s-showcase -w
```

## Auto-scaling (HPA)
If metrics-server is available:
```bash
kubectl apply -f show/k8s/api-hpa.yaml
kubectl get hpa -n k8s-showcase
```

## Mini-monitoring
```bash
kubectl top pods -n k8s-showcase
```
If `kubectl top` doesn't work, metrics-server needs to be enabled.
