# Ilea Palm Ops Runbook

Use this when deploying or troubleshooting on the mini PC/WSL setup.

## 1) One-command update (WSL)

From WSL:

```bash
cd ~/apps/ilea-palm
printf '#!/usr/bin/env bash\nset -e\ncd ~/apps/ilea-palm\ngit pull --ff-only\ndocker compose up -d --build\ndocker compose ps\n' > update.sh
chmod +x update.sh
```

Then every update is:

```bash
~/apps/ilea-palm/update.sh
```

## 2) Normal deploy/update (WSL)

```bash
cd ~/apps/ilea-palm
git pull --ff-only
docker compose up -d --build
docker compose ps
```

## 3) View logs (WSL)

```bash
cd ~/apps/ilea-palm
docker compose logs -f app
```

## 4) Local dev run (Windows/WSL dev machine)

Terminal 1 (API):

```bash
dotnet run --project EmployeeHub.Api
```

Terminal 2 (frontend):

```bash
npm run dev --prefix employee-hub-ui
```

Open:

```text
http://localhost:5173
```

## 5) If port 8080 is already in use (WSL)

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker stop ilea-palm 2>/dev/null || true
docker rm ilea-palm 2>/dev/null || true
cd ~/apps/ilea-palm
docker compose up -d --build
```

## 6) Caddy restart (Windows PowerShell)

Use existing config path:

```powershell
cd C:\Caddy
caddy run --config C:\Caddy\Caddyfile
```

Leave that window open if running Caddy directly.

Quick check in another PowerShell window:

```powershell
Get-Process caddy
netstat -ano | findstr :80
netstat -ano | findstr :443
```

## 7) Portainer role

Portainer is for:
- Checking container status
- Restarting containers
- Viewing logs

Build/deploy is still done from WSL with `docker compose up -d --build`.

## 8) Quick health check

From WSL:

```bash
curl -I http://localhost:8080
```

From any browser:

```text
https://ilea-palm.tomslab.casa
```