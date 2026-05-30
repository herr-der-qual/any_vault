#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment...${NC}"

cd "$(dirname "$0")"

echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull

echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm ci --only=production || npm ci
npm run build
cd ..

echo -e "${YELLOW}Stopping old containers...${NC}"
docker compose down

echo -e "${YELLOW}Rebuilding and starting containers...${NC}"
docker compose build
docker compose up -d

echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 5
for i in {1..30}; do
    if docker compose exec -T backend python -c "import sys; sys.exit(0)" 2>/dev/null; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

echo -e "${YELLOW}Running migrations...${NC}"
docker compose exec -T backend python manage.py makemigrations
docker compose exec -T backend python manage.py migrate

echo -e "${YELLOW}Collecting static files...${NC}"
docker compose exec -T backend python manage.py collectstatic --noinput

echo -e "${YELLOW}Health check...${NC}"
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|302"; then
    echo -e "${GREEN}Deployment complete!${NC}"
else
    echo -e "${RED}Warning: Deployment completed but health check failed. Check logs: docker compose logs backend${NC}"
fi

echo -e "${GREEN}Last 20 lines of logs:${NC}"
docker compose logs --tail 20 backend