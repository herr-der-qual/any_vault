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

echo "==> Publishing frontend to web root..."
sudo mkdir -p /var/www/any-vault/html /var/www/any-vault/static /var/www/any-vault/media
sudo rsync -a --delete frontend/dist/ /var/www/any-vault/html/

echo "==> Rebuilding and starting containers..."
docker compose up --build -d --remove-orphans

echo "==> Running migrations..."
docker compose exec -T backend python manage.py migrate

echo "==> Collecting static files..."
docker compose exec -T backend python manage.py collectstatic --noinput

echo "==> Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "==> Deploy complete!"
