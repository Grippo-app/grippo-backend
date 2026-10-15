# Реальное поведение эксплуатационных скриптов

Источники: [deploy.sh](../../../../scripts/deploy.sh), [dump.sh](../../../../scripts/dump.sh), [cleanup.sh](../../../../scripts/cleanup.sh), [logger.sh](../../../../scripts/internal/logger.sh). Порядок ниже описывает текущий код.

Описанные branches — факты о code, не разрешённый operational workflow.
Обязательные gates пользователя, dump-only и deploy sequence:
[deployment-policy.md](deployment-policy.md). SSH/remote:
[remote-access.md](remote-access.md). Перед **каждой** реальной попыткой deploy
нужны новое успешное выполнение `scripts/dump.sh` и явное human permission на
конкретную попытку. Наличие optional import в коде не отменяет policy.

## deploy.sh: cold reset и restore

`#!/bin/bash`, `set -e`; нет `set -u`, `pipefail`, `ERR`/`EXIT` trap, автоматического backup или rollback.

| Порядок | Текущая операция | Ветка ошибки и состояние после неё |
|---|---|---|
| 1 | Вычисляет `SCRIPT_DIR`, `ROOT_DIR`, путь logger | Нет logger → сообщение, exit 1; Docker ещё не тронут |
| 2 | Выбирает `$ROOT_DIR/.env`, `$ROOT_DIR/${DOCKER_COMPOSE_FILE:-docker-compose.yml}`, `$ROOT_DIR/${DB_DUMP_FILE:-scripts/dump.sql}` | Overrides берутся из вызывающей среды; значения из `.env` загружаются позже и не пересчитывают пути |
| 3 | Проверяет `.env`, выполняет `set -a; source "$ENV_FILE"; set +a` | Нет файла → exit 1. Source возвращает nonzero → `.env syntax error`, exit 1. `.env` — исполняемый Bash; это не полная схема валидации |
| 4 | Проверяет непустые `BACKEND_HOST`, `BACKEND_PORT`, `POSTGRES_CONTAINER_NAME`, `POSTGRES_DATABASE`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | Первый пустой → exit 1. Не валидирует типы, диапазоны, остальные Compose/auth vars |
| 5 | `command -v docker`, наличие выбранного Compose file | Нет binary/file → exit 1. Docker daemon и Compose plugin отдельно не проверяются |
| 6 | `docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v > /dev/null` | Failure → exit 1; teardown мог выполниться частично. Успех удаляет контейнеры, network и non-external named volumes данного проекта, включая `pgdata` |
| 7 | `mktemp`, затем `docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build` | stdout/stderr в temp file. Failure → последние 200 строк в stdout, temp удаляется, exit 1. Старый volume к этому моменту уже удалён; части нового проекта могут остаться |
| 8 | Удаляет build log после успешного `up` | Нет сохранённого build artifact/log. Interrupted process до удаления может оставить temp file: cleanup trap отсутствует |
| 9 | `until docker exec "$POSTGRES_CONTAINER_NAME" pg_isready -U "$POSTGRES_USERNAME"` | Скрыты stdout/stderr; container/user mismatch неотличим от startup delay. Если сразу готов — переход к import |
| 10 | При неготовности: `sleep 1`, `((ATTEMPTS++))`, log, проверка `MAX_ATTEMPTS=30` | На первой итерации post-increment возвращает status 1, потому что прежнее значение 0. На Bash с применением errexit к arithmetic commands script завершится **до** log/timeout; на локальном macOS Bash 3.2.57 pure repro продолжил выполнение. Семантику целевого Bash нужно проверить отдельно. При продолжении loop после 30 неготовностей вызывается timeout branch |
| 11 | Проверяет существование `DUMP_FILE` | Нет файла → warn + skip import, затем success. При уже удалённом volume это может оставить пустую/default БД; её схема зависит от startup backend |
| 12 | Только при точном `DROP_SCHEMA_BEFORE_IMPORT=true`: `docker exec -e PGPASSWORD=... psql -qAt -U ... -d ... -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` | Вывод скрыт. Nonzero останавливает script через `set -e`; ручного recovery нет. Любое другое/пустое значение flag → schema reset skipped |
| 13 | `docker exec -i "$POSTGRES_CONTAINER_NAME" psql -U ... -d ... -q -1 -t < "$DUMP_FILE" > /dev/null 2>&1` | Нет `-v ON_ERROR_STOP=1`, явного `PGPASSWORD`, `-h` или `-p`. По умолчанию libpq использует local socket внутри container, но PGHOST/PGHOSTADDR/PGPORT/PGSERVICE/PGSERVICEFILE могут переопределить endpoint; actual DB нужно установить. SQL errors могут не дать nonzero psql. `-1` задаёт одну транзакцию import; прежний schema drop в неё не входит |
| 14 | Сообщает `Database dump imported successfully` и `Initialization complete!` | Сообщение проверяет только shell flow. Нет запроса в БД, проверки constraints/data, backend health или smoke API |

### Последствия порядка

- `up` запускает **db и backend**, `depends_on` ждёт DB healthcheck. Дополнительный script readiness выполняется уже после `up`. При задержанном DB healthcheck `up` может завершиться ошибкой ещё до собственного readiness loop.
- Backend может устанавливать DB connection, синхронизировать schema (если это реально включено средой) и принимать запросы одновременно с reset/import. `restart: unless-stopped` не сериализует эти операции.
- `POSTGRES_CONTAINER_NAME` — имя контейнера для `docker exec`; Compose service называется `db`. Timeout branch вызывает `docker compose logs "$POSTGRES_CONTAINER_NAME"` без `-f`/`--env-file` и передаёт container name как service name. На Bash, где timeout branch достижим, диагностика может промахнуться по service/project/CWD.
- `BACKEND_HOST` проверяется, но не используется bootstrap для bind: Nest слушает `0.0.0.0`. Compose не использует эту переменную.
- Неполный import после `down -v` нельзя отменить Git revert. Повторный deploy повторяет удаление volume и не восстанавливает удалённые текущие данные.

## dump.sh: snapshot и latest SQL

`set -Eeuo pipefail`, `IFS=$'\n\t'`; `ERR` trap пишет номер строки и exit code. Не запускай его как «чтение состояния»: DB читается, но sensitive SQL создаётся на host и latest перезаписывается.

| Порядок | Текущая операция | Failure branch / артефакт |
|---|---|---|
| 1 | Загружает logger при наличии; иначе объявляет fallback через printf | Fallback `log_error` пишет stderr. Общий logger пишет все уровни stdout |
| 2 | Объявляет `on_error`, `require_bin`, `file_size_h`; ставит `ERR` trap | Необработанный failure → error line/code; при доступном docker и непустом container name дополнительно `docker ps --filter name=...`, затем тот же exit code. Explicit `exit 1` в проверках не равен вызову ERR trap |
| 3 | Вычисляет `ROOT_DIR`, `.env`, `SQL_TARGET="$ROOT_DIR/${DB_DUMP_FILE:-scripts/dump.sql}"`, `BACKUP_DIR="$ROOT_DIR/backups"` | `.env` override `DB_DUMP_FILE` ещё не загружен; абсолютный override безусловно префиксируется root |
| 4 | Проверяет `.env`, `set -a`, `source`, `set +a` | Нет файла → log + exit 1. Source/необъявленная переменная при `set -u`/синтаксис могут оборвать script; содержимое `.env` исполняется |
| 5 | `${...:?}` для container, database, username, password | Неустановленное или пустое значение → Bash error и остановка. Типы/доступность DB не проверяются |
| 6 | `require_bin docker`; `mkdir -p` для dirname target и backups | Нет docker → explicit exit 1. Ошибка mkdir → ERR trap |
| 7 | `date -u +%Y%m%d_%H%M%SZ`; путь `backups/${POSTGRES_DATABASE}_${STAMP}.sql` | UTC, точность секунда. Повтор для той же DB в ту же секунду совпадёт по имени и truncate прежний файл; нет collision check |
| 8 | `docker exec "$POSTGRES_CONTAINER_NAME" sh -lc 'command -v pg_dump >/dev/null'` | Нет container/pg_dump/shell → `pg_dump not found...`, exit 1. Это не проверка credentials, DB readiness, free space или полного dump |
| 9 | `docker exec -e PGPASSWORD=... "$POSTGRES_CONTAINER_NAME" pg_dump -U ... -d ... -F p --inserts --no-owner --no-privileges -b > "$SQL_SNAPSHOT"` | Редирект создаёт/truncate host file **до** `docker exec`. Failure → trap; partial/empty snapshot не удаляется, latest обычно не затронут. stderr pg_dump не скрыт; stdout SQL в файл |
| 10 | Проверяет `[[ -s "$SQL_SNAPSHOT" ]]` | Empty → log + exit 1. Непустой файл ещё не доказательство полного/восстанавливаемого backup |
| 11 | `cp -f "$SQL_SNAPSHOT" "$SQL_TARGET"` | Нет temp+rename, atomic guarantee отсутствует. При ошибке/прерывании copy snapshot может сохраниться, latest может оказаться partial; cp failure → trap |
| 12 | Выводит пути/размеры и `Done` | `du -h`/`awk`, fallback stat для размера. Никакой checksum, compression, encryption, retention, off-host copy или restore verification нет |

Dump — plain SQL, не custom archive: для него используется `psql`, не `pg_restore`. `--no-owner --no-privileges` не сохраняет ownership/ACL; `-b` включает large objects, если они есть, но не означает cluster-level backup. Роли, tablespaces, другие БД и host/env/image не сохраняются. File permissions задаются umask вызывающей среды; script не делает `chmod 600`.

## cleanup.sh: глобальная уборка Linux host и reboot

`set -euo pipefail`, logger обязателен. Нет dry run, host allowlist, project scoping или rollback.

1. Не root (`EUID != 0`) → `exec sudo -E bash "$0" "$@"`. Ошибка sudo прекращает script; аргументы передаются, но script ими не управляет. Environment сохраняется по sudo policy.
2. Диагностика `df -h /`, `du -xhd1 /var | sort -h`, аналогично `/home`, при наличии `/var/lib/docker` — `du -sh`. Ошибки подавляются `|| true`.
3. Если docker доступен: `docker system df`; `docker system prune -af`; `docker volume prune -f`; `docker builder prune --all --force`; размер `/var/lib/docker`; повтор `docker system df`. Все failures подавлены `|| true`, success messages безусловны. Это daemon-wide cleanup, затрагивающий другие проекты. Нельзя считать любой неиспользуемый volume disposable.
4. `export DEBIAN_FRONTEND=noninteractive`; `apt-get clean`; `apt-get autoremove --purge -y`. Нет проверки apt-get перед вызовом; failure только warn, выполнение продолжается.
5. Если найден journalctl: usage; `journalctl --vacuum-size=200M`; usage. Failures warn/ignore; без binary — skip.
6. `rm -rf /tmp/*`, затем `rm -rf /var/tmp/*`; failures warn. Glob не включает обычные dotfiles. Нет age/ownership/exclusion checks: удаляются и свежие файлы других процессов.
7. Повтор диагностики и `Cleanup complete!`.
8. **`sudo reboot`**. Если reboot не запускается, nonzero под `set -e` завершает script; успешность cleanup не доказывается сообщением до reboot.

Команды `apt-get`, `/var/lib/docker`, `/home`, `du -xhd1` и systemd показывают ориентацию на Linux Debian/Ubuntu host. На macOS не запускать для проверки синтаксиса или очистки проекта: root escalation и rm/reboot остаются реальными независимо от отсутствия apt.

## logger.sh

Только функции `log_step_start`, `log_step_end`, `log_info`, `log_success`, `log_warn`, `log_error` на `echo`. Каждый уровень берёт `$1`; это stdout, без timestamp, file sink, redaction или уровней фильтрации. Это оформление терминала, не durable audit log. Не добавляй секреты/SQL values в сообщения, включая diagnostics и build tail.

Решения после failure/retry и обязательные permission/backup gates находятся в
[deployment-policy](deployment-policy.md); recovery procedure — в
[dump-and-restore](dump-and-restore.md). Таблицы выше описывают последствия
текущего кода, а не исправляют их. Не меняй scripts/config попутно при аудите
инструкций и не выполняй их ради проверки описанной ветки.
