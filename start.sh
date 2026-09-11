#!/bin/sh
set -e

echo "🚀 Starting ZenBank Engine on port ${PORT:-8080}..."

echo "📦 Running Prisma DB push..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || npx prisma db push --skip-generate --accept-data-loss || true

echo "🌱 Running database seed (if initial setup)..."
node prisma/seed.js || true

echo "⚡ Starting Next.js server..."
if [ -f "server.js" ]; then
  exec node server.js
elif [ -f "zenbank/server.js" ]; then
  exec node zenbank/server.js
else
  exec npx next start -p ${PORT:-8080}
fi
