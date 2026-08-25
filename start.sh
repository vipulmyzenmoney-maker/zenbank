#!/bin/sh
set -e

echo "🚀 Starting ZenBank Engine..."

# Push Prisma schema to Postgres
echo "📦 Running Prisma schema sync..."
npx prisma db push --skip-generate || true

# Start Next.js standalone server
echo "⚡ Starting Next.js server on port ${PORT:-8080}..."
exec node server.js
