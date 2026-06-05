# Deploy workflow (client)

**The repo is the source of truth. dev-01 is where you work. prod only runs what it is given.**

```
edit + commit + push   →   deploy to prod   →   rebuild   →   verify
       (dev-01)                (git push)        (on prod)
```

## Rules

- **All authoring happens on dev-01** (this clone). Edit, commit, and `git push origin main` here.
  dev-01 is the only machine that talks to GitHub.
- **prod is a deploy target, not a dev box.** It never commits, never pushes, and holds no GitHub
  credentials. It runs `/opt/yukon/client` checked out to whatever commit was last deployed.
- **prod must always match a known commit.** Deploys are `git push` from dev-01 with
  `receive.denyCurrentBranch=updateInstead` set on prod, so prod's working tree is checked out to the
  pushed commit, and the push is **refused if prod has any uncommitted hand-edit**. That guarantee is
  the whole point: it makes the prod-drift we cleaned up impossible to reintroduce silently.
- **Never edit files directly on prod.** If you do, the next deploy will reject the push until prod is
  clean again. Make the change here, commit, deploy.

## One-time setup (already done)

- dev-01 has a `prod` git remote: `nick@10.0.0.72:/opt/yukon/client`
- prod has `git config receive.denyCurrentBranch updateInstead`
- prod's GitHub (`cpl`) push URL is disabled (prod cannot push to GitHub)

## First-time provisioning (new / rebuilt target)

The DB credentials live in `db-config.php`, which is **gitignored and never shipped by
git push**. On a fresh target you must create it once, in BOTH php dirs, from the example:

```bash
ssh nick@10.0.0.72
for d in account create; do
  cp /opt/yukon/client/$d/scripts/php/db-config.example.php \
     /opt/yukon/client/$d/scripts/php/db-config.php
  # then edit each db-config.php and fill in the real password
done
```

`deploy.sh` runs a **pre-flight** that refuses to deploy (before pushing anything) if either
`db-config.php` is missing or incomplete, so a half-provisioned box fails loudly instead of
serving a "green" deploy with broken account/create.

## Deploy

From this repo on dev-01:

```bash
./deploy.sh
```

which is just:

```bash
git push origin main        # publish to GitHub (source of truth)
git push prod   main        # ship to prod working tree (rejected if prod is dirty)
ssh nick@10.0.0.72 'bash /opt/yukon/recover_rebuild.sh'   # rebuild dist on prod
```

`recover_rebuild.sh` runs `npm run build` and re-links the piefruit asset/font dirs, branding, and
static folders into `dist/` (nginx serves `/opt/yukon/client/dist`). No service restart is needed for
the client (static assets).

## Verify after deploy

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://play.clubpenguinlive.net   # expect 200
# full path check (login + world join + CSP):
node <repo>/.local-scratch/verify_game.js   # from dev-01, expect RESULT: PASS
```

## Rollback

```bash
git push prod <previous-good-sha>:main --force-with-lease
ssh nick@10.0.0.72 'bash /opt/yukon/recover_rebuild.sh'
```
(then reconcile `main` on GitHub to the same commit).
