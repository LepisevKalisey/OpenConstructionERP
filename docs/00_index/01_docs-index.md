# Documentation Master Index

This index tracks all project documents, their purpose, status, and relationships.

## Delivery & Operations

| Document Path | Title | Purpose | Status | Linked Documents |
|---|---|---|---|---|
| [docs/06_delivery/01_coolify-deployment-fix.md](file:///c:/Projects/Mides/Openconstraction/docs/06_delivery/01_coolify-deployment-fix.md) | Resolving Coolify Deployment Failure on VPS | Implementation plan and VPS operator instructions to resolve the deployment exit code 1. | Proposed | None |
| [docs/RUNBOOK.md](file:///c:/Projects/Mides/Openconstraction/docs/RUNBOOK.md) | OpenConstructionERP Production Runbook | Playbook for the systemd-based deployment on the shared demo VPS. | Legacy | None |
| [docs/INSTALL_LINUX.md](file:///c:/Projects/Mides/Openconstraction/docs/INSTALL_LINUX.md) | Linux Installation Guide | Step-by-step guide to installing the ERP on Linux. | Active | None |

## Decisions

| Document Path | Title | Purpose | Status | Linked Documents |
|---|---|---|---|---|
| [docs/03_decisions/01_coolify-production-dependencies.md](file:///c:/Projects/Mides/Openconstraction/docs/03_decisions/01_coolify-production-dependencies.md) | Production Dependencies Configuration for Coolify Deployment | Decision to install server, semantic, and s3 extras in Dockerfile.backend to fix runtime import crashes. | Accepted | [docs/06_delivery/01_coolify-deployment-fix.md](file:///c:/Projects/Mides/Openconstraction/docs/06_delivery/01_coolify-deployment-fix.md) |
| [docs/03_decisions/02_coolify-app-dir-configuration.md](file:///c:/Projects/Mides/Openconstraction/docs/03_decisions/02_coolify-app-dir-configuration.md) | Uvicorn Application Directory Configuration in Dockerfile.backend | Decision to add --app-dir backend parameter to Uvicorn command to resolve ModuleNotFoundError at runtime. | Accepted | [docs/06_delivery/01_coolify-deployment-fix.md](file:///c:/Projects/Mides/Openconstraction/docs/06_delivery/01_coolify-deployment-fix.md) |

## Product & Architecture

| Document Path | Title | Purpose | Status | Linked Documents |
|---|---|---|---|---|
| [docs/BIM-STORAGE-ARCHITECTURE.md](file:///c:/Projects/Mides/Openconstraction/docs/BIM-STORAGE-ARCHITECTURE.md) | BIM Storage Architecture | Conceptual overview of BIM storage modules and design. | Active | None |
| [docs/MASTER_PLAN_v2.7.md](file:///c:/Projects/Mides/Openconstraction/docs/MASTER_PLAN_v2.7.md) | Master Plan | Strategic goals and roadmap for the project. | Active | None |
| [docs/ROADMAP_v1.9.md](file:///c:/Projects/Mides/Openconstraction/docs/ROADMAP_v1.9.md) | Roadmap | Phased roadmap for the development stages. | Active | None |
