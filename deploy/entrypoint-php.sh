#!/bin/sh
# Render db-config.php for both PHP trees from env (single .env source, decision 8), then exec php-fpm.
set -e

render() {
  cat > "$1" <<EOF
<?php
    return [
        'host'     => '${DB_HOST:-mariadb}',
        'user'     => '${DB_USER:-yukon}',
        'password' => '${DB_PASSWORD}',
        'database' => '${DB_NAME:-clubpenguinlive}',
    ];
EOF
}

render /usr/share/nginx/html/create/scripts/php/db-config.php
render /usr/share/nginx/html/account/scripts/php/db-config.php

exec "$@"
