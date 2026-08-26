# cpl-client

[Club Penguin Live](https://clubpenguinlive.net) is a fan-made recreation of the original Club
Penguin, running on a from-scratch client and server built for the browser.

This repo is the Phaser game client: the browser-side game itself, plus the PHP account/create
flows served alongside it. It builds and runs on its own, but needs a running
[cpl-server](https://github.com/clubpenguinlive/cpl-server) (the Socket.IO world backend) to
actually log in and play, and [cpl-assets](https://github.com/clubpenguinlive/cpl-assets) (rooms,
crumbs, fonts, media) merged in to build.

## Built With

* [Node.js](https://nodejs.org/en/)
* [Socket.IO](https://socket.io/)
* [Phaser 3](https://phaser.io/)
* [Phaser Editor](https://phasereditor2d.com/)
* [Texture Packer](https://www.codeandweb.com/texturepacker)

## Local Installation

These instructions get you a copy of the client running locally for development.

### Prerequisites

* [Node.js](https://nodejs.org/en/)
* [cpl-server](https://github.com/clubpenguinlive/cpl-server) for the game worlds
* Assets from [cpl-assets](https://github.com/clubpenguinlive/cpl-assets)

### Installation

1. Clone this repository.

```console
git clone https://github.com/clubpenguinlive/cpl-client
```

2. Install node dependencies.

```console
npm install
```

3. Merge the cpl-assets contents into the `assets` folder.

### Usage

* Running the dev server. Serves the real client page (`index.ejs`) with hot rebuild
  at `localhost:8080`. World sockets proxy to a local cpl-server; without one running
  they simply do not connect, which is fine for frontend and layout work.

```console
npm run dev
```

* Building the client for production. Output lands in `/dist` (`index.html` plus the
  minified bundle under `assets/scripts/client`). In practice the Docker build runs
  this for you (see Deploy), so you rarely invoke it by hand.

```console
npm run build
```

* Building crumbs. Merges the files in `/assets/media/crumbs/en` into a single JSON
  file. Only needed when modifying crumbs.

```console
npm run build-crumbs
```

### Scene Editing

Editing `.scene` files requires a copy of [Phaser Editor](https://phasereditor2d.com/).

### Account creation

The PHP account and registration pages live in `create/` and `account/`. Locally, host
them on a PHP web server at `/create/scripts/php`; the webpack dev server proxies
requests there per `webpack.config.js`.

### Editing the page template

The served page is generated from `index.ejs` at build time. Edit that template and
rebuild rather than touching any generated `dist/index.html`.

## Deploy

Production is a Docker Compose stack on the CPL prod host. The client ships as two
images built from this repo: `cpl-web` (nginx + the built client, `Dockerfile.web`)
and `cpl-php` (PHP-FPM for the account/create flows, `Dockerfile.php`). The nginx
config is canonical in `cpl-server/deploy/nginx.conf` and staged into `deploy/nginx.conf`
at build time.

See [DEPLOY.md](DEPLOY.md) for the full flow. Do not deploy autonomously.

Self-hosting your own instance against your own backend does not require any of the CPL-specific
production details above; see [DEPLOY.md](DEPLOY.md) for a generic build-and-run guide.

## Contributing

Issues and pull requests are welcome. For anything beyond a small fix, open an issue first to
discuss the approach before writing code, since some changes need matching work in cpl-server
and/or cpl-assets to actually function (see the cross-repo note in `CLAUDE.md`).

## License

MIT, see [LICENSE](LICENSE). This project is a fork of [wizguin/yukon](https://github.com/wizguin/yukon);
see [NOTICE](NOTICE) for upstream attribution.

## Disclaimer

Club Penguin Live is a fan-run private server. It is not affiliated with, endorsed by,
or sponsored by The Walt Disney Company. Intended for personal use only.
