---
title: "M9 Docker and deployment"
order: 9
summary: "Package the service and its environment as a container image, run it with PostgreSQL in Compose, and deploy it to a public URL."
---

This module takes the service from your laptop to a public URL. You separate the app, the environment and the machine. You write a Dockerfile whose layer order keeps rebuilds fast. You run the API with PostgreSQL in Compose. Then you deploy with config and secrets from the environment. Every AI service in later levels ships the same way.

**Outcome:** you can put a service that works on your laptop into a container, deploy it, and debug it when production behaves differently.

**Before this module:** [M4 FastAPI services](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m04-fastapi-services), [M6 PostgreSQL persistence](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m06-postgresql) and [1.9 Modules, packages and uv projects](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l9-modules-packages-and-uv).

| Code | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|
| 9.1 | [App, environment, machine: images and containers](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l1-images-and-containers) | An image packs the app with its environment. A container is a process with a temporary writable layer. | Local practice project | not started |
| 9.2 | [Dockerfiles, layers, caching and uv](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l2-dockerfiles-layers-and-uv) | Dependencies before code, `uv sync --locked`, multi-stage, non-root, exec-form `CMD`. | Local practice project | not started |
| 9.3 | [Running containers, logs, startup failures and Compose](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l3-running-logs-and-compose) | Ports, bind addresses, logs first, healthchecks and named volumes. | Local practice project | not started |
| 9.4 | [Deploying to a public URL and production config](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m09-docker-and-deployment/l4-deploying-and-production-config) | One image, config from the environment, secrets from a store, proxy headers, health routes, a debug order. | A platform of your choice | not started |

The exercises need Docker on your computer. On Windows, that is Docker Desktop with the WSL 2 backend. They do not run in a browser lab.

The sandbox measurements in these lessons ran on 2026-10-19 with Docker Engine 29.8.2 and Docker Compose 5.5.1. The sandbox could not reach public registries. So it used local base images with Python 3.13.14, uv 0.11.32 and PostgreSQL 16.15. The cache, startup and shutdown behavior does not depend on the base image. Image sizes do.
