# cpl-php: php-fpm 8.3 serving the create/account signup + account-management PHP. Files live at the
# SAME docroot path nginx (cpl-web) uses, so the SCRIPT_FILENAME nginx sends resolves here.
# db-config.php is rendered from env at startup (decision 8). Build context = the cpl-client repo.
FROM php:8.3-fpm-bookworm
RUN docker-php-ext-install pdo_mysql mysqli
WORKDIR /usr/share/nginx/html
COPY create ./create
COPY account ./account
COPY deploy/entrypoint-php.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    # Pre-create the db-config.php files so www-data can overwrite them at startup
    && install -o www-data -g www-data -m 644 /dev/null /usr/share/nginx/html/create/scripts/php/db-config.php \
    && install -o www-data -g www-data -m 644 /dev/null /usr/share/nginx/html/account/scripts/php/db-config.php \
    && chown -R www-data:www-data /usr/share/nginx/html
USER www-data
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
