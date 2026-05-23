# Production Dependencies Configuration for Coolify Deployment

- **Status**: Accepted
- **Date**: 2026-05-23
- **Author**: Antigravity (DevOps Engineer)

## Context

When deploying the application in a production environment via Coolify, we use PostgreSQL (with `pgduckdb`) and Qdrant for semantic search. The backend requires additional optional dependencies defined in `backend/pyproject.toml` under extras (`server` for PostgreSQL/Redis support, `semantic` for Qdrant client and embedding models, and `s3` for object storage).

Previously, `deploy/docker/Dockerfile.backend` only ran `pip install --no-cache-dir ./backend`, which installed only the base dependencies. This resulted in runtime errors such as `ModuleNotFoundError: No module named 'asyncpg'` causing the backend container to crash immediately upon startup.

## Decision

We will modify `deploy/docker/Dockerfile.backend` to install the backend with optional dependencies `[server,semantic,s3]` required for the production server environment.

Specifically:
```dockerfile
RUN mkdir -p frontend/dist && \
    pip install --no-cache-dir "./backend[server,semantic,s3]"
```

## Alternatives Considered

1. **Installing `openconstructionerp[all]`**:
   - This would install all optional dependencies, including `cv` (computer vision packages like `paddleocr` and `ultralytics`).
   - *Reason for rejection*: Computer vision wheels are extremely large (several gigabytes) and would exceed the 8GB RAM VPS capacity during build/installation or severely bloat the final docker image size.
2. **Adding packages to base dependencies**:
   - *Reason for rejection*: Keeping them as extras in `pyproject.toml` is clean and allows the base package to remain lightweight for standard/local installations.

## Consequences

- The backend container will successfully install `asyncpg`, `psycopg2-binary`, `qdrant-client`, `aioboto3`, and other production-critical dependencies.
- The backend startup will not crash due to missing import modules.
- The overall size of the backend image remains optimized as we avoid massive computer vision libraries.
