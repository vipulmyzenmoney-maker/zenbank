#!/bin/bash
set -e

# Create zenbank database if it doesn't already exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE zenbank'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'zenbank')\gexec
    GRANT ALL PRIVILEGES ON DATABASE zenbank TO $POSTGRES_USER;
EOSQL

echo "✅ Databases initialized: $POSTGRES_DB and zenbank"
