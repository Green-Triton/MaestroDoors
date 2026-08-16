<#
.SYNOPSIS
    Собирает проект локально и разворачивает его на сервере.

.DESCRIPTION
    Сборка идёт на вашей машине, на сервер уезжает только результат:
    статика сайта и скомпилированный бэкенд. Поэтому серверу не нужны ни
    исходники, ни Python, ни PDF-каталог, ни dev-зависимости — а 90 МБ
    инструментов сборки не занимают его диск и память.

    Файл .env на сервере скрипт не трогает: он создаётся один раз вручную
    и содержит пароль приложения.

.PARAMETER Server
    Адрес сервера: root@203.0.113.10 или root@sk-pirs.ru

.PARAMETER Path
    Каталог установки на сервере. По умолчанию /opt/pirs-catalog

.PARAMETER SkipBuild
    Не пересобирать, взять уже готовые frontend/dist и backend/dist.

.EXAMPLE
    .\deploy\deploy.ps1 -Server root@203.0.113.10

.EXAMPLE
    .\deploy\deploy.ps1 -Server root@sk-pirs.ru -SkipBuild
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Server,

    [string]$Path = '/opt/pirs-catalog',

    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$archiveName = 'pirs-catalog.tar.gz'
$stage = Join-Path ([System.IO.Path]::GetTempPath()) "pirs-deploy-$(Get-Random)"
$archive = Join-Path ([System.IO.Path]::GetTempPath()) $archiveName

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "ОШИБКА: $text" -ForegroundColor Red; exit 1 }

<#
.SYNOPSIS
    Запускает внешнюю программу и проверяет её код возврата.
.DESCRIPTION
    Обёртка нужна из-за особенности PowerShell: при $ErrorActionPreference='Stop'
    любая строка, которую внешняя программа написала в stderr, считается
    фатальной ошибкой. А туда пишут обычные сообщения — npm свои notice, scp
    индикатор progress. Без этой обёртки скрипт обрывался на успешной команде.

    Единственный надёжный признак успеха для внешней программы — код возврата,
    его и проверяем.
#>
function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Command,
        [Parameter(Mandatory = $true)][string]$ErrorMessage
    )

    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command 2>&1 | ForEach-Object { Write-Host $_ }
    } finally {
        $ErrorActionPreference = $previous
    }

    if ($LASTEXITCODE -ne 0) { Fail $ErrorMessage }
}

foreach ($tool in 'ssh', 'scp', 'tar', 'npm') {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Fail "не найдена команда '$tool'. ssh/scp/tar входят в Windows 10+, npm — в Node.js."
    }
}

# ---- Сборка -----------------------------------------------------------------

if (-not $SkipBuild) {
    Step 'Сборка фронтенда'
    Invoke-Native { npm run build --prefix "$root/frontend" } 'сборка фронтенда не прошла'

    Step 'Сборка бэкенда'
    Invoke-Native { npm run build --prefix "$root/backend" } 'сборка бэкенда не прошла'
}

foreach ($required in "$root/frontend/dist/index.html", "$root/backend/dist/index.js") {
    if (-not (Test-Path $required)) { Fail "нет файла $required — соберите проект без -SkipBuild" }
}

# ---- Упаковка ---------------------------------------------------------------

Step 'Упаковка'
New-Item -ItemType Directory -Force -Path "$stage/frontend", "$stage/backend" | Out-Null

Copy-Item "$root/frontend/dist" "$stage/frontend/dist" -Recurse
Copy-Item "$root/backend/dist" "$stage/backend/dist" -Recurse
# package-lock нужен для npm ci: он ставит ровно те версии, что проверены локально.
Copy-Item "$root/backend/package.json", "$root/backend/package-lock.json" "$stage/backend/"

if (Test-Path $archive) { Remove-Item $archive -Force }
Invoke-Native { tar -czf $archive -C $stage . } 'не удалось создать архив'

$sizeMb = [math]::Round((Get-Item $archive).Length / 1MB, 1)
Write-Host "   архив: $sizeMb МБ"

# ---- Отправка ---------------------------------------------------------------

Step "Отправка на $Server"
Invoke-Native { scp $archive "${Server}:/tmp/$archiveName" } `
    'не удалось скопировать архив (проверьте адрес и доступ по SSH)'

# Серверная часть уезжает файлом, а не через конвейер: при передаче команд
# по конвейеру PowerShell перекодирует текст, и кириллица внутри скрипта
# приходит на сервер испорченной.
Invoke-Native { scp "$PSScriptRoot/remote-install.sh" "${Server}:/tmp/pirs-remote-install.sh" } `
    'не удалось скопировать установочный скрипт'

# ---- Установка --------------------------------------------------------------

Step 'Установка на сервере'
Invoke-Native {
    ssh $Server "bash /tmp/pirs-remote-install.sh '$Path' '/tmp/$archiveName'; rm -f /tmp/pirs-remote-install.sh"
} 'установка на сервере не завершилась (смотрите вывод выше)'

# ---- Уборка -----------------------------------------------------------------

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $archive -Force -ErrorAction SilentlyContinue

Step 'Готово'
Write-Host "Сайт обновлён. Проверьте: http://$($Server.Split('@')[-1])/" -ForegroundColor Green
Write-Host "Логи сервера: ssh $Server 'journalctl -u pirs-catalog -f'"
