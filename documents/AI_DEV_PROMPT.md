# AI Development Rules

This project uses a pnpm monorepo. 

Tech stack:

* Next.js
* Prisma
* PostgreSQL
* Docker
* Zod
* Tailwind
* Python

STRICT RULES

1. Only ONE `.env` file allowed at root
2. Prisma schema exists only at:

packages/db/prisma/schema.prisma

3. Never run prisma init inside apps
4. Never create additional prisma folders
5. Docker configs stay in `/docker`
6. Always reuse existing code
7. Do not change project architecture

Development Principles

* Follow Architecture.md
* Follow DB_SCHEMA.md
* Follow Plan.md