#!/usr/bin/env bash
# Deploy the CPL client to the Docker stack on cpl-prod.
# Overlays client files via git archive, builds cpl-web + cpl-php on the prod host,
# then hot-swaps both containers. No npm/pm2 on prod; no git remote on the prod host.
# NOTE: briefly restarts cpl-web and cpl-php while new images start.
set -euo pipefail

BRANCH=main
PROD="${CPL_PROD:-cpl-prod}"
REGISTRY="${REGISTRY:-ghcr.io/clubpenguinlive}"
COMPOSE_FILE="~/cpl/server-clubpenguinlive/deploy/docker-compose.yml"

echo ">> publishing to GitHub"
git push origin "$BRANCH"

echo ">> overlaying client files onto $PROD"
git archive HEAD | ssh "$PROD" "tar -x -C ~/cpl/client-clubpenguinlive/"

echo ">> staging build context extras (nginx.conf + minigames)"
ssh "$PROD" bash -s <<'STAGE'
set -e
mkdir -p ~/cpl/client-clubpenguinlive/deploy
cp ~/cpl/server-clubpenguinlive/deploy/nginx.conf ~/cpl/client-clubpenguinlive/deploy/nginx.conf
rm -rf ~/cpl/client-clubpenguinlive/minigames
cp -r ~/cpl/minigames ~/cpl/client-clubpenguinlive/minigames
STAGE

echo ">> building cpl-web on $PROD"
ssh "$PROD" "docker build -f ~/cpl/client-clubpenguinlive/Dockerfile.web \
  --build-arg ASSETS_BASE=${REGISTRY}/cpl-assets-base:stable \
  -t ${REGISTRY}/cpl-web:stable \
  ~/cpl/client-clubpenguinlive/"

echo ">> building cpl-php on $PROD"
ssh "$PROD" "docker build -f ~/cpl/client-clubpenguinlive/Dockerfile.php \
  -t ${REGISTRY}/cpl-php:stable \
  ~/cpl/client-clubpenguinlive/"

echo ">> swapping cpl-web + cpl-php"
ssh "$PROD" "docker compose -f $COMPOSE_FILE up -d --no-deps cpl-web cpl-php"

echo ">> deployed $(git rev-parse --short HEAD) to prod"
echo ">> verify: curl -s -o /dev/null -w '%{http_code}' https://play.clubpenguinlive.net"
