# Resolving Coolify Deployment Failure on VPS

Implementation plan and diagnostic instructions to fix the VPS deployment failure (exit code 1) during the docker compose up phase.

- **Status**: Active
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
2. **Healthcheck Tuning (Timeout Fix):** The backend boot time takes **3-4 minutes** due to loading 71+ modules, pinging Qdrant, and database initialization. We increased the `start_period` to **300 seconds** (5 minutes).

### Dockerfile.backend

3. **Uvicorn Path Fix:** Running as non-root user `oe` resulted in:
   `exec: "uvicorn": executable file not found in $PATH`
   We resolved this by invoking uvicorn as a python module: `python -m uvicorn`.

4. **Production Dependencies (`[server,semantic,s3]`):** Running standard `pip install ./backend` did not install optional production modules like `asyncpg` (for Postgres), `qdrant-client` (for Qdrant vector search), and `aioboto3` (for S3 support), causing immediate startup crashes (`ModuleNotFoundError`).
   Additionally, standard PyTorch installation downloads ~2GB of unused NVIDIA/CUDA packages. We updated the installation command to target production extras and use the PyTorch CPU-only index for optimization:
   ```dockerfile
   RUN mkdir -p frontend/dist && \
       pip install --no-cache-dir "./backend[server,semantic,s3]" --extra-index-url https://download.pytorch.org/whl/cpu
   ```

5. **Uvicorn Application Directory Configuration (`--app-dir backend`):** Since the source code is copied into `/app/backend` and `WORKDIR` is `/app`, Uvicorn would fail with `ModuleNotFoundError: No module named 'app'` unless `/app/backend` is added to python's import path.
   We updated the startup command to include `--app-dir backend`:
   ```dockerfile
   CMD ["python", "-m", "uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend"]
   ```

## Verification

1. Commit and push the changes to Git.
2. Trigger a new deployment via the Coolify API/UI.
3. Confirm all containers (`postgres`, `qdrant`, `backend`, `frontend`) start and report `healthy`.
