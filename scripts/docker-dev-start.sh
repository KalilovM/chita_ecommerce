#!/bin/sh
set -eu

echo "Waiting for database and syncing Prisma schema..."

if [ -d prisma/migrations ] && [ -n "$(find prisma/migrations -mindepth 1 -maxdepth 1 2>/dev/null)" ]; then
  npm run db:deploy
else
  npm run db:push
fi

echo "Seeding database..."
npm run db:seed

exec npm run dev
