# Deploy workflow (client)

**The repo is the source of truth. dev-01 is where you work. prod only runs what it is given.**

```
edit + commit + push   ->   overlay onto prod   ->   docker build   ->   swap containers   ->   verify
       (dev-01)               (git archive)           (on prod host)      (compose up -d)
```

## Rules

- **All authoring happens on dev-01** (this clone). Edit, commit, and `git push origin main` here.
  dev-01 is the only machine that talks to GitHub.
- **prod is a deploy target, not a dev box.** It never commits, never pushes, and holds no GitHub
  credentials. It runs whatever files the last deploy overlaid into `~/cpl/cpl-client/`.
- **Never edit files directly on prod.** Make the change here, commit, deploy. Hand-edits on prod get
  clobbered by the next overlay.
- **The DB volume is sacred.** Never `docker compose down -v`. Migrations are additive only.

## Prod host

- **`cpl-prod`** is the single source for the prod address, a Host alias in `~/.ssh/config` on dev-01
  pointing at the `clubpenguinlive` VM (`10.0.0.43`, Docker Compose stack on HOST-02). The deploy
  script and these docs reference the alias; if the IP or user changes, edit only the ssh config.
- The client ships as two images built from this repo:
  - **`cpl-web`** (nginx + the built client), `Dockerfile.web`, layered on `cpl-assets-base`.
  - **`cpl-php`** (PHP-FPM 8.3 for the account/create flows), `Dockerfile.php`.
- The nginx config is canonical in `cpl-server/deploy/nginx.conf` and staged into this repo's
  `deploy/nginx.conf` by `deploy.sh` before the Docker build.

## Deploy

From this repo on dev-01:

```bash
./deploy.sh
```

which is, in essence:

```bash
git push origin main                                        # publish to GitHub (source of truth)
git archive HEAD | ssh cpl-prod "tar -x -C ~/cpl/cpl-client/"  # overlay files onto prod
# stage build context: cp cpl-server/deploy/nginx.conf and cpl/minigames into cpl-client/
ssh cpl-prod "docker build -f ~/cpl/cpl-client/Dockerfile.web ... -t .../cpl-web:stable ~/cpl/cpl-client/"
ssh cpl-prod "docker build -f ~/cpl/cpl-client/Dockerfile.php   -t .../cpl-php:stable ~/cpl/cpl-client/"
ssh cpl-prod "docker compose -f ~/cpl/cpl-server/deploy/docker-compose.yml up -d --no-deps cpl-web cpl-php"
```

The Docker build assembles the client (`npm run build` runs inside the image), so there is no
`npm`/`pm2` on prod and no build step to run by hand. `docker compose up -d --no-deps` hot-swaps only
`cpl-web` and `cpl-php`, leaving the world containers and the database untouched. Both briefly restart
while the new images start.

## First-time provisioning (new / rebuilt target)

The DB credentials live in `db-config.php`, which is gitignored and never shipped by the overlay.
On a fresh target, create it once in both PHP dirs from the example, then fill in the real password:

```bash
ssh cpl-prod
for d in account create; do
  cp ~/cpl/cpl-client/$d/scripts/php/db-config.example.php \
     ~/cpl/cpl-client/$d/scripts/php/db-config.php
done
```

## Verify after deploy

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://play.clubpenguinlive.net   # expect 200
# full path check (login + world join + CSP):
node <repo>/.local-scratch/verify_game.js   # from dev-01, expect RESULT: PASS
```

## Rollback

Redeploy a known-good commit: check it out on dev-01 and run `./deploy.sh`, or rebuild the images on
prod from a previously overlaid tree. Then reconcile `main` on GitHub to the same commit.
