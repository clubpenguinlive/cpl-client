# Self-hosting cpl-client

This is a generic self-host guide for running your own instance of the client. It does not
describe any specific hosting setup, only the pieces the repo actually provides: two Docker
images, the scripts that build them, and the environment variables they read.

The client is one part of a three-repo stack:

- **cpl-client** (this repo): the Phaser game client plus the PHP account/create flows.
- **[cpl-server](https://github.com/clubpenguinlive/cpl-server)**: the Socket.IO world backend
  (login server + one or more world servers).
- **[cpl-assets](https://github.com/clubpenguinlive/cpl-assets)**: room, crumb, and media assets
  merged into the client at build time.

You need working copies of all three to run a full instance. This guide covers the client only.

## What gets built

`Dockerfile.web` and `Dockerfile.php` both build from this repo as the Docker context.

- **`cpl-web`**: a multi-stage build. The first stage runs `npm ci && npm run build` (Node 24) to
  produce `dist/`. The second stage copies `dist/`, the static `assets/`, `create/`, `account/`,
  `pages/`, and `branding/` trees onto an nginx base image and installs the nginx config at
  `/etc/nginx/conf.d/default.conf`. Serves the built client on port 80.
- **`cpl-php`**: PHP-FPM 8.3 with `pdo_mysql` and `mysqli`, serving `create/` and `account/` (the
  registration and account-management pages) on port 9000. It renders `db-config.php` from
  environment variables at container start (see below), so the real credentials never need to be
  committed or baked into the image.

The `Dockerfile.web` build context expects two things that are not tracked in this repo:

- A `minigames/` directory at the repo root. This is a separate asset tree of licensed minigame
  files; you will need to source or build your own if you want minigames to work, or drop the
  `COPY minigames ./minigames` line from `Dockerfile.web` if you do not need them.
- An nginx config staged at `deploy/nginx.conf`. Write your own, or adapt the one referenced from
  [cpl-server](https://github.com/clubpenguinlive/cpl-server)'s `deploy/` directory if you are
  running the matching server. At minimum it needs to serve the static files above and proxy
  Socket.IO traffic through to your login/world server processes (see Networking below).

`cpl-assets` also needs to be merged into `assets/` before building; see the README for local dev,
the same merge applies to a production build.

## Building the images

From a checkout of this repo, with `minigames/` and `deploy/nginx.conf` staged as described above:

```bash
docker build -f Dockerfile.web -t cpl-web:latest .
docker build -f Dockerfile.php -t cpl-php:latest .
```

`Dockerfile.web` takes one build arg, `ASSETS_BASE`, an image name to use as the base layer for
`cpl-web` (defaults to `ghcr.io/clubpenguinlive/cpl-assets-base:stable`, our own media/fonts base
image; point it at your own base image or a plain `nginx:latest` if you are supplying those files
another way).

```bash
docker build -f Dockerfile.web --build-arg ASSETS_BASE=nginx:latest -t cpl-web:latest .
```

## Configuring the backend connection

The client does not hardcode a backend host. Two separate things need to point at your backend:

1. **World server addresses.** The client reads the Socket.IO host and path for each world from
   crumb data (`game.crumbs.worlds[world]` in `src/engine/network/Network.js`), which comes from
   cpl-assets, not this repo. Configure your world entries there to point at wherever your
   cpl-server login and world processes are reachable.
2. **Reverse proxy routing.** In dev, `webpack.config.js` proxies `/world/login` and
   `/world/blizzard` to `localhost:6111` / `localhost:6112` (see the `devServer.proxy` block) and
   `/create/scripts/php` to a local PHP server on port 80. In production your web server needs to
   do the equivalent: serve the built client and proxy the same paths (with WebSocket upgrade) to
   your running cpl-server processes and PHP-FPM. This is what the nginx config staged into
   `deploy/nginx.conf` is for.

## Environment variables

`cpl-php`'s entrypoint (`deploy/entrypoint-php.sh`) renders `db-config.php` for both `create/` and
`account/` from these variables at container start:

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `mariadb` | MySQL/MariaDB host |
| `DB_USER` | `yukon` | Database user |
| `DB_PASSWORD` | (none, required) | Database password |
| `DB_NAME` | `clubpenguinlive` | Database name |

`account.php` also reads `TURNSTILE_SECRET` from the environment for Cloudflare Turnstile
(captcha) verification on account actions. If unset, it falls back to an empty string, which will
fail captcha checks; set it to your own Turnstile secret key, and update the `data-sitekey` values
in `account/` and `create/` to your own site key.

For local development without Docker, copy `account/scripts/php/db-config.example.php` to
`db-config.php` in both `account/scripts/php/` and `create/scripts/php/` (gitignored, never
commit the real file) and fill in your own values directly instead of relying on the entrypoint
script.

## Running the stack

The two images serve different paths of the same site and are meant to sit behind one web server
(or reverse proxy) that fans out static/asset requests to `cpl-web` and PHP requests under
`/create` and `/account` to `cpl-php` on port 9000 (FastCGI). A minimal `docker-compose.yml` might
look like:

```yaml
services:
  cpl-web:
    image: cpl-web:latest
    ports:
      - "80:80"
  cpl-php:
    image: cpl-php:latest
    environment:
      DB_HOST: mariadb
      DB_USER: yukon
      DB_PASSWORD: change-me
      DB_NAME: clubpenguinlive
      TURNSTILE_SECRET: your-turnstile-secret
    depends_on:
      - mariadb
  mariadb:
    image: mariadb:11
    environment:
      MARIADB_DATABASE: clubpenguinlive
      MARIADB_USER: yukon
      MARIADB_PASSWORD: change-me
      MARIADB_ROOT_PASSWORD: change-me
    volumes:
      - db-data:/var/lib/mysql
volumes:
  db-data:
```

This assumes `cpl-web`'s nginx config is set up to proxy PHP requests to `cpl-php:9000` and
Socket.IO requests to your cpl-server processes; adapt it to match wherever your services actually
live. You still need cpl-server running separately (it is not one of these two images) and the
database schema from cpl-server's migrations applied to `mariadb` before account creation will
work.
