# Waitress Order System

Full-stack application for waitstaff to manage orders.

## Components

- **Backend**: .NET 8, Entity Framework Core, PostgreSQL
- **Frontend**: Angular standalone app (served by nginx)
- **Database**: PostgreSQL deployment in k8s
- **Ingress**: Traefik on `waitress.ai.hinterdorfer.dev`

## Quickstart

### 1. Initial Setup on GitHub

Create a new public repository on GitHub (or use your own) named e.g. `waitress-system`.

Then push this project to it:

```bash
# Inside waitress-app directory (already initialized as git)
git remote add origin https://github.com/YOURUSER/waitress-system.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. Set up GitHub Secret `KUBE_CONFIG_DATA`

The workflow needs your cluster kubeconfig to deploy. Generate it from inside this OpenClaw pod (where you have cluster access):

```bash
# Run these commands inside the OpenClaw environment to generate the base64-encoded kubeconfig:
TOKEN=$(kubectl get secret openclaw-k8s-token -n openclaw -o jsonpath='{.data.token}' | base64 -d)
CA=$(kubectl get secret openclaw-k8s-token -n openclaw -o jsonpath='{.data.ca\.crt}')
SERVER="https://${KUBERNETES_SERVICE_HOST}:${KUBERNETES_SERVICE_PORT}"
KUBE_CONFIG_DATA=$(cat <<EOF | base64 -w0
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: ${CA}
    server: ${SERVER}
  name: homelab
contexts:
- context:
    cluster: homelab
    namespace: ai-workloads
    user: openclaw-k8s
  name: openclaw
current-context: openclaw
users:
- name: openclaw-k8s
  user:
    token: ${TOKEN}
EOF
)
echo $KUBE_CONFIG_DATA
```

Copy the output and add it as a repository secret named `KUBE_CONFIG_DATA` in your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.

(Alternatively, if you have `gh` installed locally: `gh secret set KUBE_CONFIG_DATA --body "$KUBE_CONFIG_DATA" --repo YOURUSER/waitress-system`.)

### 3. Adjust Image Names

The workflow uses `ghcr.io/yourrepo/waitress-backend` and `ghcr.io/yourrepo/waitress-frontend`. Replace `yourrepo` with your GitHub username (lowercase). The workflow computes lowercase automatically, but if you push to a different repo, update the image names in the k8s YAML files (`k8s/backend-deployment.yaml` and `k8s/frontend-deployment.yaml`) accordingly.

### 4. Push to Trigger CI/CD

After setting the secret, push to `main` to build Docker images and deploy to the cluster.

### 5. Access the App

After deployment, open in your browser:
- `https://waitress.ai.hinterdorfer.dev`

You should see the waitstaff UI. Enter a table number, click products to add orders, and view the total.

## Customizing Products

To change the product list, edit the ConfigMap in `k8s/configmap.yaml` and run `kubectl rollout restart deployment/waitress-backend -n ai-workloads`, or modify via k8s and let ConfigMap update trigger rollout.

## Notes

- The backend API is available under `/api/*`. The Angular app uses relative paths.
- The Angular app and backend are separate deployments behind the same host.
