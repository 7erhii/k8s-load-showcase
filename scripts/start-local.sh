#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building images..."
docker build -t k8s-demo-api "${ROOT_DIR}/api"
docker build -t k8s-demo-frontend "${ROOT_DIR}/nextjs"

echo "Applying Kubernetes manifests..."
kubectl apply -f "${ROOT_DIR}/k8s/namespace.yaml"
kubectl apply -f "${ROOT_DIR}/k8s/api-deployment.yaml"
kubectl apply -f "${ROOT_DIR}/k8s/api-service.yaml"
kubectl apply -f "${ROOT_DIR}/k8s/frontend-deployment.yaml"
kubectl apply -f "${ROOT_DIR}/k8s/frontend-service.yaml"

echo ""
echo "Done. Next steps:"
echo "  kubectl get pods -n k8s-showcase"
echo "  kubectl port-forward -n k8s-showcase svc/frontend 8081:80"
echo "  open http://localhost:8081"
