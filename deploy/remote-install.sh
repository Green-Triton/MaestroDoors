#!/usr/bin/env bash
#
# Серверная половина развёртывания: распаковать сборку и перезапустить службу.
# Вызывается скриптом deploy.ps1, вручную запускать не нужно.
#
#   bash remote-install.sh /opt/pirs-catalog /tmp/pirs-catalog.tar.gz

set -euo pipefail

APP_DIR="${1:-/opt/pirs-catalog}"
ARCHIVE="${2:-/tmp/pirs-catalog.tar.gz}"
APP_USER=pirs
SERVICE=pirs-catalog

# Скрипт может выполняться и от root (тогда sudo не нужен), и от обычного
# пользователя с правами sudo.
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Не найден архив $ARCHIVE" >&2
  exit 1
fi

echo "Распаковка в $APP_DIR"
$SUDO mkdir -p "$APP_DIR"
# Старые сборки удаляем целиком: у файлов в assets/ имена с хешем содержимого,
# и без очистки на диске копились бы все прошлые версии.
$SUDO rm -rf "$APP_DIR/frontend/dist" "$APP_DIR/backend/dist"
$SUDO tar -xzf "$ARCHIVE" -C "$APP_DIR"
rm -f "$ARCHIVE"

echo "Установка зависимостей"
cd "$APP_DIR/backend"
$SUDO npm ci --omit=dev --no-audit --no-fund

if [ ! -f "$APP_DIR/backend/.env" ]; then
  echo ""
  echo "ВНИМАНИЕ: нет файла $APP_DIR/backend/.env — служба не запустится." >&2
  echo "Создайте его по образцу backend/.env.example (см. DEPLOY.md)." >&2
  exit 1
fi

$SUDO chown -R "$APP_USER:$APP_USER" "$APP_DIR"
$SUDO chmod 600 "$APP_DIR/backend/.env"

echo "Перезапуск службы"
$SUDO systemctl restart "$SERVICE"
sleep 3

if $SUDO systemctl is-active --quiet "$SERVICE"; then
  echo "Служба запущена."
else
  echo "Служба не поднялась. Последние строки журнала:" >&2
  $SUDO journalctl -u "$SERVICE" -n 30 --no-pager >&2
  exit 1
fi
