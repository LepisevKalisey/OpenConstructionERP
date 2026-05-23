# Resolving Coolify Deployment Failure on VPS

Implementation plan and diagnostic instructions to fix the VPS deployment failure (exit code 1) during the docker compose up phase.

- **Status**: Proposed
- **Date**: 2026-05-23
- **Author**: Antigravity (DevOps Engineer)

## Context

The modular ERP system (`OpenConstructionERP`) is being deployed on a VPS with exactly 8GB of RAM using Coolify. The deployment process builds backend/frontend images, then runs `docker compose up -d` to start all containers: `postgres` (with `pgduckdb`), `qdrant`, `backend`, and `frontend`. 
During the pulling and layer extraction phase, the execution fails with exit code 1.

## Diagnostics & Troubleshooting Steps

Because we lack direct SSH access to the VPS, the host operator should run the following commands:

### 1. Disk Space Verification & Cleanup
Docker image layer extraction fails if the target volume is full.
- Check disk space:
  ```bash
  df -h
  ```
- Purge unused Docker resources:
  ```bash
  docker system prune -a --volumes -f
  ```

### 2. Memory & Swap Configuration
Extracting large images (`pgduckdb` and `qdrant` are substantial) while running other containers under 8GB of RAM can trigger the Linux Out-Of-Memory (OOM) killer.
- Check current memory and swap allocation:
  ```bash
  free -m
  ```
- If swap space is 0 or less than 4GB, configure a 4GB swap file:
  ```bash
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

### 3. Check for OOM Events
Check if processes were terminated by the kernel:
```bash
dmesg | grep -i "oom\|killed"
```

## Proposed Changes

### docker-compose.prod.yml

1. **Shared Memory (`shm_size`):** We added `shm_size: 256mb` to the PostgreSQL container. Standard postgres (especially with the `pgduckdb` extension) requires more shared memory than Docker's default of 64MB.
2. **Healthcheck Tuning (Timeout Fix):** The backend boot time takes **3-4 minutes** due to loading 71+ modules, pinging Qdrant, and database initialization. The default healthcheck configuration timed out after **95 seconds**, causing Docker Compose to abort deployment. We increase the `start_period` to **300 seconds** (5 minutes).

```yaml
  postgres:
    image: pgduckdb/pgduckdb:16-main
    restart: unless-stopped
    shm_size: 256mb
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-oe}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-openestimate}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-oe} -d ${POSTGRES_DB:-openestimate}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 45s

  backend:
    ...
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"]
      interval: 20s
      timeout: 10s
      retries: 10
      start_period: 300s
```

## Verification

1. Trigger a new deployment via Coolify API or UI.
2. Confirm the containers start successfully.
