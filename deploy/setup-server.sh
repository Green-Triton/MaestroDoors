#!/usr/bin/env bash
#
# Первичная настройка чистого Ubuntu-сервера под сайт ООО СК «Пирс».
# Запускается ОДИН раз, от root:
#
#   bash setup-server.sh sk-pirs.ru
#
# Домен можно не указывать — тогда nginx будет отвечать на любой адрес,
# и сайт откроется по IP. Домен подставите позже в
# /etc/nginx/sites-available/pirs-catalog.
#
# Скрипт можно запускать повторно: он не ломает уже настроенное.

set -euo pipefail

DOMAIN="${1:-_}"
APP_DIR=/opt/pirs-catalog
APP_USER=pirs
NODE_MAJOR=20

say() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[33m%s\033[0m\n' "$1"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Запускайте от root: sudo bash $0 $*" >&2
  exit 1
fi

say 'Обновление списка пакетов'
apt-get update -qq

say 'Базовые пакеты'
apt-get install -y -qq curl ca-certificates gnupg ufw nginx

say "Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi
echo "   node $(node -v), npm $(npm -v)"

say "Системный пользователь ${APP_USER}"
# Без домашнего каталога и без возможности войти: под этой учёткой только
# работает сервис, входить в систему ей незачем.
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
fi

say "Каталог ${APP_DIR}"
mkdir -p "$APP_DIR/backend" "$APP_DIR/frontend"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

say 'Файрвол'
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
echo '   открыты 22, 80, 443'

say 'Проверка исходящего SMTP (порт 465)'
# Некоторые хостинги закрывают его от спамеров — без него заявки уходить
# не будут, и узнать об этом лучше сейчас, а не после первой потерянной заявки.
if timeout 8 bash -c 'cat < /dev/null > /dev/tcp/smtp.gmail.com/465' 2>/dev/null; then
  echo '   порт 465 открыт'
else
  warn '   порт 465 недоступен! Заявки отправляться не будут.'
  warn '   Напишите в поддержку хостинга с просьбой открыть исходящий SMTP.'
fi

say 'Юнит systemd'
if [ -f "$(dirname "$0")/pirs-catalog.service" ]; then
  cp "$(dirname "$0")/pirs-catalog.service" /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable pirs-catalog >/dev/null 2>&1 || true
  echo '   установлен, автозапуск включён'
else
  warn '   pirs-catalog.service рядом не найден — скопируйте вручную'
fi

say 'Конфигурация nginx'
NGINX_SRC="$(dirname "$0")/nginx.conf"
if [ -f "$NGINX_SRC" ]; then
  sed "s/ДОМЕН www.ДОМЕН/${DOMAIN}/; s/ДОМЕН/${DOMAIN}/g" "$NGINX_SRC" \
    > /etc/nginx/sites-available/pirs-catalog
  ln -sf /etc/nginx/sites-available/pirs-catalog /etc/nginx/sites-enabled/pirs-catalog
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "   server_name: ${DOMAIN}"
else
  warn '   nginx.conf рядом не найден — скопируйте вручную'
fi

cat <<EOF

────────────────────────────────────────────────────────────────
Сервер готов. Осталось три шага:

1. Создать файл с паролем почты:
     nano ${APP_DIR}/backend/.env
   Содержимое — по образцу backend/.env.example из проекта.
   Затем закрыть его от посторонних:
     chown ${APP_USER}:${APP_USER} ${APP_DIR}/backend/.env
     chmod 600 ${APP_DIR}/backend/.env

2. Залить сайт — со СВОЕЙ машины, из каталога проекта:
     .\\deploy\\deploy.ps1 -Server root@<адрес-сервера>

3. Выпустить сертификат (после того, как домен указывает на этот сервер):
     apt-get install -y certbot python3-certbot-nginx
     certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}
────────────────────────────────────────────────────────────────
EOF
