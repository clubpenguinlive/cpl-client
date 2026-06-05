#!/usr/bin/env bash
# Deploy the CPL client from dev-01 to prod. Run from this repo on dev-01.
# See DEPLOY.md. prod is a deploy target: it never commits or pushes.
set -euo pipefail

BRANCH=main
PROD=nick@10.0.0.72

# Pre-flight: the DB credentials live in db-config.php, which is gitignored and
# therefore NOT shipped by git push. It must already exist (and be filled in) on
# the target, or every account/create request fails. Refuse to deploy otherwise,
# so a fresh/half-provisioned box fails loudly here instead of serving a "green"
# deploy with broken login. This runs BEFORE any push, so a failure changes nothing.
echo ">> pre-flight: required runtime config present + valid on prod"
ssh "$PROD" bash -s <<'PREFLIGHT'
set -e
ok=1
for d in account create; do
  f="/opt/yukon/client/$d/scripts/php/db-config.php"
  if [ ! -f "$f" ]; then echo "  MISSING: $f"; ok=0; continue; fi
  php -r '$c=@require $argv[1];
          if(!is_array($c)){fwrite(STDERR,"  not a config array: ".$argv[1]."\n");exit(1);}
          foreach(["host","user","password","database"] as $k){
            if(empty($c[$k])){fwrite(STDERR,"  ".$argv[1].": missing/empty key ".$k."\n");exit(1);}
          }' "$f" || ok=0
done
[ "$ok" = 1 ] || { echo "  -> create db-config.php from db-config.example.php on the target, then re-deploy"; exit 1; }
echo "  configs OK"
PREFLIGHT

echo ">> publishing to GitHub (source of truth)"
git push origin "$BRANCH"

echo ">> shipping to prod (rejected if prod has uncommitted hand-edits)"
git push prod "$BRANCH"

echo ">> rebuilding dist on prod"
ssh "$PROD" 'bash /opt/yukon/recover_rebuild.sh'

echo ">> deployed $(git rev-parse --short HEAD) to prod"
echo ">> verify: curl -s -o /dev/null -w '%{http_code}\\n' https://play.clubpenguinlive.net"
