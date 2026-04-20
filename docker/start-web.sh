#!/bin/sh
set -eu

pnpm --filter @eveheart/db exec prisma migrate deploy
exec pnpm --filter @eveheart/web start
