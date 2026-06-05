#!/usr/bin/env bash
# Deploy the CPL client from dev-01 to prod. Run from this repo on dev-01.
# See DEPLOY.md. prod is a deploy target: it never commits or pushes.
set -euo pipefail

BRANCH=main
PROD=nick@10.0.0.72

echo ">> publishing to GitHub (source of truth)"
git push origin "$BRANCH"

echo ">> shipping to prod (rejected if prod has uncommitted hand-edits)"
git push prod "$BRANCH"

echo ">> rebuilding dist on prod"
ssh "$PROD" 'bash /opt/yukon/recover_rebuild.sh'

echo ">> deployed $(git rev-parse --short HEAD) to prod"
echo ">> verify: curl -s -o /dev/null -w '%{http_code}\\n' https://play.clubpenguinlive.net"
