# Uvicorn Application Directory Configuration in Dockerfile.backend

- **Status**: Accepted
- **Date**: 2026-05-23
- **Author**: Antigravity (DevOps Engineer)

## Context

During a production deployment via Coolify, `Dockerfile.backend` copies the application source code to `/app/backend/` and sets the `WORKDIR` to `/app`. 
To optimize Docker layer caching, `pip install` is run in an earlier layer using only `pyproject.toml` and `README.md`. As a result, the `app` package is built as an empty shell in python's `site-packages` during the build stage.

When Uvicorn was run with `CMD ["python", "-m", "uvicorn", "app.main:create_app", ...]`, it started in `/app`. Because `/app/backend` was not in python's search path, Uvicorn was unable to import the actual `app` module containing the server logic, causing a `ModuleNotFoundError: No module named 'app'` crash immediately upon startup (container error state after ~1 second).

## Decision

We will configure Uvicorn to run with the `--app-dir backend` flag in the Dockerfile `CMD` instructions:
```dockerfile
CMD ["python", "-m", "uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend"]
```

This instructs Uvicorn to add the `/app/backend` directory to `sys.path`, allowing it to correctly import the python modules inside the `backend/app/` subdirectory.

## Alternatives Considered

1. **Copying the source code before `pip install`**:
   - This would allow `pip install` to package the full app files into site-packages.
   - *Reason for rejection*: This invalidates the Docker cache for the 6-minute `pip install` step whenever any python file changes, severely increasing deployment times (from 15 seconds to over 6 minutes).
2. **Setting `PYTHONPATH=/app/backend` in the environment**:
   - This works similarly by adding the directory to the python path.
   - *Reason for rejection*: Configuring this via Uvicorn's native `--app-dir` command-line argument is more explicit, matches the project's official `Dockerfile.unified` configuration, and avoids polluting global env variables.

## Consequences

- Uvicorn will successfully find and load the `app.main:create_app` factory on startup.
- Fast incremental builds are preserved (the 6-minute `pip install` layer remains cached unless `pyproject.toml` changes).
- The container starts and connects to PostgreSQL/Qdrant normally.
