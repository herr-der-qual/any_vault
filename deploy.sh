#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Pulling latest changes..."
git pull

echo "==> Building frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "==> Rebuilding and starting containers..."
docker compose up --build -d --remove-orphans

echo "==> Running migrations..."
docker compose exec -T backend python manage.py makemigrations products users
docker compose exec -T backend python manage.py migrate

echo "==> Deploy complete!"
