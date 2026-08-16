# Развёртывание на сервере

Инструкция для чистого VPS с Ubuntu (Beget и любой другой). Один процесс
Node отдаёт и сайт, и API, перед ним стоит nginx с сертификатом.

Ориентировочно — час на первый раз. Обновления после этого занимают минуту.

```
ваша машина                          сервер (Ubuntu)
─────────────                        ───────────────
npm run build      ──── SSH ────►    /opt/pirs-catalog/
  frontend/dist                        ├── frontend/dist  ← nginx отдаёт напрямую
  backend/dist                         └── backend/dist   ← systemd держит запущенным
                                                              └── /api/leads → Gmail
```

Сборка идёт на вашей машине. Серверу не нужны ни исходники, ни Python, ни
PDF-каталог — только результат, около 6 МБ.

---

## Что понадобится

- VPS с Ubuntu 22.04 или 24.04 (хватит 1 ядра и 1 ГБ памяти — расход около 300 МБ);
- доступ по SSH и IP-адрес сервера;
- домен, направленный на этот IP (можно добавить позже);
- заполненный `backend/.env` — почта и пароль приложения.

---

## Шаг 1. Подключиться к серверу

```bash
ssh root@159.194.209.187
```

Подставьте IP из панели Beget. При первом входе согласитесь с отпечатком ключа.

---

## Шаг 2. Настроить сервер

Со **своей машины** скопируйте на сервер каталог `deploy/`:

```bash
scp -r deploy root@159.194.209.187:/tmp/
```

На **сервере** запустите настройку, указав свой домен:

```bash
bash /tmp/deploy/setup-server.sh dveripirs.ru
```

Домена ещё нет — запустите без него, сайт будет открываться по IP:

```bash
bash /tmp/deploy/setup-server.sh
```

Скрипт поставит Node 20, nginx и файрвол, заведёт системного пользователя
`pirs`, создаст `/opt/pirs-catalog`, установит службу и конфигурацию nginx.

**Обратите внимание на строку про порт 465.** Если скрипт напишет, что порт
недоступен, — хостинг закрыл исходящий SMTP, и заявки отправляться не будут.
Это лечится обращением в поддержку Beget с просьбой открыть исходящие
подключения на 465; всё остальное можно настраивать не дожидаясь ответа.

---

## Шаг 3. Положить пароль почты

Файл `.env` содержит пароль приложения Gmail, поэтому он **не** хранится в git
и **не** заливается скриптом. Создайте его на сервере один раз:

```bash
nano /opt/pirs-catalog/backend/.env
```

Вставьте (подставьте свои значения — те же, что в локальном `backend/.env`):

```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=sk.pirs.doors@gmail.com
SMTP_PASS=пароль приложения, 16 символов

RECIPIENT_EMAIL=andrey.ves@yandex.ru
SEND_COPY_TO_SENDER=true
MAIL_FROM_NAME=Сайт ООО СК «Пирс»

PORT=3001
ALLOWED_ORIGINS=
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX=5
```

Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`.

Закройте файл от посторонних:

```bash
chown pirs:pirs /opt/pirs-catalog/backend/.env
chmod 600 /opt/pirs-catalog/backend/.env
```

`ALLOWED_ORIGINS` оставляйте пустым: сайт и API на одном домене, и CORS не нужен.

---

## Шаг 4. Залить сайт

Со **своей машины**, из каталога проекта:

```powershell
.\deploy\deploy.ps1 -Server root@159.194.209.187
```

Скрипт соберёт фронтенд и бэкенд, упакует результат, отправит на сервер,
поставит зависимости и перезапустит службу. В конце напишет «Сервис запущен».

Откройте `http://159.194.209.187` — сайт должен работать.

<details>
<summary>То же самое вручную, без скрипта</summary>

```bash
npm run build --prefix frontend
npm run build --prefix backend

tar -czf deploy.tar.gz frontend/dist backend/dist backend/package.json backend/package-lock.json
scp deploy.tar.gz root@159.194.209.187:/tmp/

ssh root@159.194.209.187 '
  rm -rf /opt/pirs-catalog/frontend/dist /opt/pirs-catalog/backend/dist
  tar -xzf /tmp/deploy.tar.gz -C /opt/pirs-catalog
  cd /opt/pirs-catalog/backend && npm ci --omit=dev
  chown -R pirs:pirs /opt/pirs-catalog
  systemctl restart pirs-catalog
'
```

</details>

---

## Шаг 5. Домен и HTTPS

Убедитесь, что A-запись домена указывает на IP сервера (`ping dveripirs.ru`
должен показать этот адрес). Затем на **сервере**:

```bash
apt-get install -y certbot python3-certbot-nginx
```

```bash
certbot --nginx -d dveripirs.ru -d www.dveripirs.ru
```

Certbot спросит почту, попросит согласиться с условиями и предложит
перенаправлять HTTP на HTTPS — соглашайтесь. Конфигурацию nginx он поправит
сам, править её руками не нужно. Сертификат обновляется автоматически.

---

## Проверка

**Сайт открывается** — зайдите браузером.

**API отвечает:**

```bash
curl https://dveripirs.ru/api/health
```

Ожидается `{"ok":true,"service":"leads",...}`.

**Почта настроена** — на сервере:

```bash
cd /opt/pirs-catalog/backend && sudo -u pirs node -e "console.log('ok')"
```

Полная проверка SMTP делается со стороны исходников (`npm run check-smtp`),
на сервере её нет — там нет dev-зависимостей. Проще проверить через сам сайт:
заполните форму и убедитесь, что письмо пришло на оба ящика.

**Служба работает:**

```bash
systemctl status pirs-catalog
```

---

## Обновление сайта

Изменили код или пересобрали каталог из PDF — одна команда со своей машины:

```powershell
.\deploy\deploy.ps1 -Server root@159.194.209.187
```

`.env` на сервере при этом не трогается.

---

## Обслуживание

| Задача | Команда (на сервере) |
|---|---|
| Логи в реальном времени | `journalctl -u pirs-catalog -f` |
| Последние 50 строк | `journalctl -u pirs-catalog -n 50 --no-pager` |
| Перезапустить | `systemctl restart pirs-catalog` |
| Остановить | `systemctl stop pirs-catalog` |
| Состояние | `systemctl status pirs-catalog` |
| Проверить конфиг nginx | `nginx -t` |
| Перечитать конфиг nginx | `systemctl reload nginx` |

---

## Если что-то не работает

**Сайт не открывается, в браузере «502 Bad Gateway».**
Node-процесс не запущен. Смотрите `journalctl -u pirs-catalog -n 50 --no-pager`.
Чаще всего — нет `/opt/pirs-catalog/backend/.env` или в нём пустой `SMTP_USER`:
приложение специально падает на старте с понятным сообщением, чтобы поломка не
всплыла на первой заявке.

**Сайт открывается, но форма пишет об ошибке связи.**
Проверьте `curl http://127.0.0.1:3001/api/health` на сервере. Отвечает — дело в
nginx (`nginx -t`, блок `location /api/`). Не отвечает — служба не работает.

**Форма отправляется, письма не приходят.**
Смотрите логи: там будет причина отказа SMTP. Обычные варианты — хостинг
закрыл исходящий порт 465 (проверка: `timeout 5 bash -c 'cat </dev/null >/dev/tcp/smtp.gmail.com/465' && echo ok`)
либо пароль приложения отозван и его нужно выпустить заново.

**Сайт показывает старую версию.**
Обновите страницу с `Ctrl+Shift+R`. `index.html` отдаётся без кеша, так что
обычно достаточно обычной перезагрузки.

**Картинки дверей не грузятся (404).**
В сборку не попал `frontend/public/doors/` — соберите каталог из PDF
(`venv\Scripts\python parser\run.py`) и залейте заново.

---

## Что где лежит на сервере

```
/opt/pirs-catalog/
├── backend/
│   ├── dist/            скомпилированный сервер
│   ├── node_modules/    только рабочие зависимости (~5 МБ)
│   ├── package.json
│   └── .env             пароль почты, права 600, в git не хранится
└── frontend/
    └── dist/            сайт: html, js, css и 205 картинок дверей

/etc/systemd/system/pirs-catalog.service   служба
/etc/nginx/sites-available/pirs-catalog    конфигурация nginx
```
