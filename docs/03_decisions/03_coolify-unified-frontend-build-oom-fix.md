# Frontend Build Memory Optimization in Dockerfile.unified

- **Status**: Accepted
- **Date**: 2026-05-23
- **Author**: Antigravity (DevOps Engineer)

## Context

During a production deployment of OpenConstructionERP on Coolify using the unified Docker image ([Dockerfile.unified](file:///c:/Projects/Mides/Openconstraction/deploy/docker/Dockerfile.unified)), the frontend build step (`RUN npm run build`) failed with a JavaScript heap out of memory error (`exit code: 134`).

The project contains heavy dependencies like Cesium, Maplibre-gl, Three.js, and PDFJS. Running `npm run build` triggers `tsc -b && vite build`. The TypeScript compiler (`tsc -b`) does full static type checking across all dependencies, which requires substantial memory (often exceeding 2.4 GB) and caused the build process to crash under Docker's default heap limits on the VPS.

## Decision

We will configure the build step in [Dockerfile.unified](file:///c:/Projects/Mides/Openconstraction/deploy/docker/Dockerfile.unified) to run Vite build directly using `npx vite build` and increase the Node heap size to 3GB via `NODE_OPTIONS="--max-old-space-size=3072"`, completely bypassing the heavy `tsc` compilation stage.

Specifically:
```dockerfile
RUN NODE_OPTIONS="--max-old-space-size=3072" npx vite build
```

## Alternatives Considered

1. **Increasing Node heap memory without skipping type-checking (`NODE_OPTIONS="--max-old-space-size=4096" npm run build`)**:
   - This would keep `tsc -b` but allocate up to 4GB of RAM for the process.
   - *Reason for rejection*: Running `tsc` inside Docker takes massive CPU resources and memory. On an 8GB VPS hosting other services, this can trigger host-level OOM kills or prolong the build by several minutes. Type-checking is better suited for development and CI pipelines rather than production image builds.
2. **Pre-building the frontend locally or in CI and copying it**:
   - Building the React app outside of the Docker container.
   - *Reason for rejection*: This would require the deployment pipeline to have Node.js installed on the host and run pre-build scripts, which defeats the portability of Coolify's container-native build process.

## Consequences

- The frontend build memory usage is reduced by bypassing TypeScript compilation (`tsc -b`).
- The build succeeds without memory crashes on resource-constrained VPS hosts.
- The build time is significantly reduced since Vite (using esbuild for TS files) is extremely fast.
- The production assets are built and bundled correctly, matching the behaviour of the standalone [Dockerfile.frontend](file:///c:/Projects/Mides/Openconstraction/deploy/docker/Dockerfile.frontend).
