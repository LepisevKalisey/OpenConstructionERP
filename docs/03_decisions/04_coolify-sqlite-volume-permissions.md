# Running Unified Container as Root for SQLite Volume Permissions

- **Status**: Accepted
- **Date**: 2026-05-23
- **Author**: Antigravity (DevOps Engineer)

## Context

When deploying OpenConstructionERP in the unified image mode ([Dockerfile.unified](file:///c:/Projects/Mides/Openconstraction/deploy/docker/Dockerfile.unified)) on Coolify, a persistent Docker volume is mounted at `/data` to persist the SQLite database and LanceDB vectors.

By default, Docker volumes on the host system are created and owned by `root` (UID 0). When the container ran using the non-root user `USER oe` (configured at line 60 of `Dockerfile.unified`), it failed to initialize the SQLite database on startup, throwing the following error:
`sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) unable to open database file`
This occurred because the `oe` user did not have write permissions to the root-owned `/data` directory.

## Decision

We will comment out the `USER oe` instruction in [Dockerfile.unified](file:///c:/Projects/Mides/Openconstraction/deploy/docker/Dockerfile.unified) so that the application runs as the `root` user by default. This ensures the container has full read and write access to the mounted volume `/data` without requiring manual host-level permission overrides (e.g. `chown` or `chmod` on the VPS host).

Specifically:
```dockerfile
# USER oe
```

## Alternatives Considered

1. **Host-level permission fixes via SSH**:
   - Keeping `USER oe` and running `chown -R 1000:1000 /var/lib/docker/volumes/...` on the VPS host.
   - *Reason for rejection*: This requires direct SSH root access to the VPS host, breaks the automation of the Coolify deployment pipeline, and makes setup much more complex for the operator.
2. **Runtime permission correction via entrypoint wrapper**:
   - Starting the container as `root`, running `chown -R oe:oe /data`, and then dropping privileges to `oe` using `gosu` or `su-exec` before launching `uvicorn`.
   - *Reason for rejection*: Installing `gosu` or `su-exec` adds extra package dependencies to the Debian-based `python-slim` base image, increases image size, and complicates the Dockerfile startup scripts. Running as root is a pragmatic and simple solution for self-hosted instances.

## Consequences

- The application successfully starts up and initializes the SQLite database `/data/openestimate.db`.
- Data persistence is fully functional across container restarts and redeployments.
- No manual host configuration or SSH access is required to set up storage volumes.
- Security boundary inside the container is slightly lowered (runs as root), which is acceptable for a self-hosted, private ERP setup.
