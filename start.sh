#!/bin/sh
set -e

echo "🚀 Starting ZenBank Engine..."

echo "📦 Running Prisma DB push..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || npx prisma db push --skip-generate --accept-data-loss || true

echo "⚡ Starting Next.js server on port ${PORT:-8080}..."
exec node server.js
