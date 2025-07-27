FROM php:8.3-cli-alpine
WORKDIR /code
COPY main.php ./
CMD ["php", "main.php"]
