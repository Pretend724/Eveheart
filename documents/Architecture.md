# Architecture

This project uses pnpm workspace monorepo.

Structure:

apps/
web → Next.js frontend

packages/
db → Prisma database layer
validation → Zod schemas

services/
ai → Python AI service

docker/
postgres → PostgreSQL container

Rules:

* Prisma schema only exists in packages/db
* Only one .env at project root
* Apps must not contain prisma folder
* Docker config stays in /docker
