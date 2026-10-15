# Эксплуатационные scripts: CLI и failure state

Источники: [deploy.sh](../../../../scripts/deploy.sh), [dump.sh](../../../../scripts/dump.sh),
[operations.py](../../../../scripts/internal/operations.py),
[cleanup.sh](../../../../scripts/cleanup.sh), [logger.sh](../../../../scripts/internal/logger.sh).
Правила разрешений/окна и порядок live update:
[deployment-policy](deployment-policy.md). Ни пример, ни plan hash не разрешают
выполнение. При анализе достаточно source и изолированных fixtures.

## Общая реализация dump/deploy

Оба Bash wrapper используют `set -euo pipefail`, определяют свой физический
каталог и через `exec python3` передают args helper с operation `dump`/`deploy`.
Logger и shell `source .env` для этих операций больше не используются.
Нужны Unix с `fcntl.flock`, Bash, Python >=3.9, Git и Docker Compose v2,
поддерживающий JSON config. Docker CLI/daemon/PG tools проверяются через
фактические commands; scripts не устанавливают инструменты сами.

| Option | Назначение |
|---|---|
| `--backup-dir ABS` | Обязательный уже существующий private directory вне checkout/context; независимая recovery copy, attempt journal и private build log |
| `--env-file PATH` | Default `.env` |
| `--compose-file PATH` | Default process `DOCKER_COMPOSE_FILE` либо `docker-compose.yml`; Compose file остаётся внутри approved checkout |
| `--latest-file PATH` | Default process `DB_DUMP_FILE` либо `scripts/dump.sql`; selected latest не импортируется при deploy |
| `--revision FULLSHA` | Обязательный deploy commit: lowercase 40-hex SHA, должен совпасть с HEAD; tracked/untracked dirty tree блокирует deploy |
| `--plan` / `--execute` | Взаимоисключающие режимы deploy; без режима — plan |
| `--attempt UUID` | Canonical UUID из принятого плана |
| `--approve-plan SHA256` | Exact `approval_sha256` принятого плана |
| `--writers-frozen` | Operator attestation; не механизм остановки writers |
| `--health-timeout SECONDS` | Default 120, допустимо 1..1800; связан с plan |

Relative paths разрешаются от script checkout root, absolute поддерживаются.
Явный CLI option предпочтительнее process fallback; пути из содержимого `.env`
не являются legacy process override. Paths проверяются на symlinks/type/owner
и отсутствие group/other write; private env/files/dirs требуют отсутствия доступа
group/others (обычно600/700). Parent directories должны существовать; helper
создаёт только свой backup directory при необходимости.

Latest требует suffix `.sql`, не может заменять tracked project file или
config. `--env-file` выбирает как Compose interpolation, так и runtime env
backend: helper устанавливает reserved `GRIPPO_ENV_FILE` для service env_file.

Target preflight internally читает Compose JSON/inspect: проверяет production
flags, fixed build context/Dockerfile/ignore, running DB и существующий backend,
Compose labels, credentials, network alias и named DB volume. Backend должен
использовать именно `db:5432`. Metadata SQL сверяет current database/user/server
port. Backend может быть остановлен для согласованного freeze; dead/restarting
state не допускается. Helper сам не останавливает writers. Внешний DB endpoint
или mismatch приводит к stop, без retarget/bootstrap.

Все Docker commands, включая child dump, используют зафиксированный selector:
`--context` с исходным context либо `--host` для HOST-only configuration с теми
же TLS settings. Смена active-context pointer не перенаправляет rollout.
`docker_selector_sha256` включён в target identity/plan; context, host и TLS
configuration должны оставаться неизменными во время attempt.

Docker/libpq commands используют explicit loopback:5432 внутри проверенного DB
container. PGHOST/PGHOSTADDR/PGPORT/PGSERVICE/PGSERVICEFILE/PGOPTIONS/PGPASSFILE
сбрасываются; password читается только из окружения DB container и не попадает
в host command argv. Сырые diagnostics/SQL не публикуются.

## dump.sh: snapshot, recovery, latest

```bash
bash scripts/dump.sh --backup-dir '<EXISTING_PRIVATE_ABSOLUTE_DIRECTORY>'
```

1. Берёт checkout lock `.grippo-operations.lock`; параллельный dump/deploy
   завершается nonzero. Lock остаётся обычным файлом, владение — advisory fd lock.
2. Выполняет preflight source и storage. Root `backups` создаётся с700 либо
   проверяется на private mode; существующий unsafe directory не исправляется молча.
3. Создаёт private unique `snapshot-UTC-UUID.sql.partial` через exclusive/no-follow.
   Выполняет pg_dump plain SQL с INSERT/no-owner/no-privileges/blobs; timeout 3600s.
4. Только после exit0, fsync и nonempty публикует уникальный snapshot без
   перезаписи existing file. В recovery directory сначала пишет private
   `.recovery-*.partial`, выполняет fsync/SHA256, затем публикует final через
   exclusive hardlink без перезаписи существующего файла.
5. Через private temp в каталоге latest копирует snapshot, fsync, atomic replace;
   повторно проверяет filetype/permissions, непустоту и SHA256 всех трёх файлов.
6. Печатает JSON receipt: `snapshot`, `latest`, `recovery`, `sha256`, `bytes`,
   `source`. Source содержит root/host/daemon/context/project/db/backend/volume,
   immutable backend/DB image IDs, прежнюю revision label при наличии,
   config/env/selector hashes и согласованные paths, без secret values.

При ошибке dump/copy cleanup удаляет только partial, созданные этим запуском;
чужой файл при collision сохраняется. Complete
snapshot/recovery сохраняются. Latest меняется только после завершённой recovery
copy. После kill/power loss возможны partial files: не принимай их за backup,
не удаляй good copies и не делай автоматический deploy/retry.
Receipt/hash не доказывают restore. Это обычный SQL с чувствительными данными,
без encryption/compression/retention/off-host transfer.

## deploy.sh: plan и одна attempt

`--plan` не создаёт backup/lock/journal и не меняет containers/files. Читает
actual target, проверяет Git и возвращает JSON `plan` + `approval_sha256`.
Plan связывает attempt/revision, target identity/config/env hashes/paths,
прежний immutable image ID (даже если у legacy image нет revision label),
health timeout и фиксированные actions. UUID нового плана отличается; для
execute бери exact UUID/hash уже согласованного результата.

Execute:

1. Берёт тот же checkout lock, повторяет target/Git preflight и проверяет
   flags/hash. `--writers-frozen` обязателен; human permission остаётся внешним
   требованием агента.
2. Exclusive create `attempt-UUID.json` в recovery directory фиксирует начало.
   Existing marker запрещает replay даже после failure; не удаляй его ради retry.
3. Через Bash вызывает **реальный штатный scripts/dump.sh заново**, передавая
   exact paths и унаследованный lock fd. Проверяет source/path/size/SHA256 receipt
   и actual backup files, затем повторно target/Git.
4. `compose build --build-arg RELEASE_SHA=<approved SHA> backend`; private `build-UUID.log` остаётся в recovery
   directory, сырое содержимое не печатается. Build timeout 1800s.
   Build tag строго `<Compose project>-backend:local`. Проверяет ID/label
   построенного image и сохраняет ID в checkpoint; old image должен быть доступен.
5. Повторяет identity/revision/latest checks до recreate. Устанавливает reserved
   `GRIPPO_RELEASE_IMAGE` в проверенный immutable ID только для rollout, разбирает
   config и требует отличие исключительно `backend.image`. Тот же env получает:
   `compose up -d --no-deps --force-recreate --no-build --pull never backend`.
   Rollout timeout 180s. DB service и volume не запускаются/пересоздаются.
6. Ждёт Docker health updated backend. Missing healthcheck, exited/unhealthy
   container или timeout — failure. Проверяет, что прежняя DB ещё running.
7. Проверяет точный immutable image ID, revision label и runtime DB endpoint/
   production flags; затем печатает JSON success с status/revision/attempt/backup и
   `database_recreated: false`. Writer controls сохраняются до approved API smoke.

До build/recreate все gates fail closed; build failure сохраняет прежний backend.
После recreate failure возможен новый неготовый backend: DB/backup сохранены,
но availability не гарантируется. Timeout/SSH disconnect не доказывают, что
Docker operation отменена. Сначала диагностика, затем отдельное permission на
recovery/новую attempt. Автоматического retry/rollback/import нет.

## Ресурсы build и временный swap

До остановки API оцени available RAM, фактический swap/disk и peak build вместе
с работающей DB; remote Docker build не имеет гарантии по локальному RSS.
Если выбран временный swap, явно включи эту host mutation в конкретный
reviewed plan: новый private regular file, точные tools/размер/путь и собственный
journal. Resource preflight выполняй до freeze; allocation/activation предпочитай
до freeze, когда prerequisites уже готовы. Если порядок иной, заранее отрази в
плане зависимость, окно недоступности и остановку при отказе; уже разрешённый
подшаг того же плана не требует повторного permission.
В таком workflow не добавляй fstab/sysctl, global prune или reboot.
Перед mkswap/swapon и cleanup сверяй owner/mode/inode и точную запись /proc/swaps;
не трогай чужой swap. После build отключай свой только при свежем RAM budget,
покрывающем used swap плюс запланированный reserve. Отказ guard означает
cleanup pending: не форсируй swapoff, не удаляй active file и не объявляй cleanup
успешным. Unlink допускается только после подтверждённого отключения своего swap.

## Переход со старой SFTP installation

Отсутствие `.git` — отдельный bootstrap, а не повод для `git reset/clean`.
Сверь pinned hashes действующих scripts, сохрани старые config/code/image и
проверь backup до первого live overwrite. Exact revision публикуй из проверенного
artifact вне live root с сохранением `.env`, SQL и чужих файлов.
Старый source-sourcing dump и password в host argv требуют отдельной оценки
риска. Для первого перехода потребовалось явное разрешение этих разовых
исключений, строгая проверка dotenv grammar и private diagnostics;
нормальные wrappers `.env` не исполняют. Не копируй прошлое разрешение или
временные helpers в следующий workflow. Старый destructive deploy не запускай.
После перехода современный execute всё равно делает новый штатный dump.

## Что не входит в deploy

Git fetch/pull/checkout/reset/clean, live upload, DB up/recreate/upgrade,
schema creation/migrations/synchronize/drop/import, восстановление из SQL,
maintenance/proxy management и off-host backup. Их нельзя получить старым
`DROP_SCHEMA_BEFORE_IMPORT` или другим env flag. Compatibility с действующей
schema и API smoke проверяются отдельно; health SELECT 1 этого не заменяет.

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

Logger используется cleanup, а не новыми dump/deploy wrapper. Разрешение recovery,
retention/удаления snapshots и host cleanup не следует из успешного deploy.
