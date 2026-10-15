# Deployment: hardening и первый production rollout

Актуальный результат — «Первый production rollout» в конце отчёта. Предыдущие
разделы сохраняют историю подготовки и ограничения соответствующего этапа;
их NOT_RUN не описывают итог выполненного запуска.

Первоначальный запрос: исправить scripts/Docker с self-review и независимым review.
На первоначальном этапе SSH, production dump/deploy и реальные Docker runtime
операции были запрещены.
Исходный tracked tree чист; пользовательские SQL и .DS_Store сохраняются.

## Критерии

- Release меняет только backend; нет down, удаления volume, reset/import.
- Конкретный approval plan, одноразовая attempt, точная revision/source identity.
- Новый штатный dump до build/rollout; private unique snapshot, atomic latest,
  independent recovery copy, checksum; fail-closed и взаимное исключение.
- Dotenv не исполняется, секреты не попадают в argv/вывод/build context.
- Production synchronize/migrations отключены; реальный DB-aware /health.
- Документация соответствует коду; restore/bootstrap не автоматизированы.
- Статика, изолированные fake-Docker проверки и независимое review/closure.

## Ownership

- Root: scripts/helper, src health/DB configuration, Git hygiene, интеграция.
- docker_hardening: Docker/Compose, затем актуализация docs.
- deployment_design_audit: read-only архитектурный аудит.
- ops_isolated_verification: временный harness, без постоянных repo tests.
- Отдельный reviewer: итоговый diff и повторная проверка исправлений.

## Реализовано

- Bash wrappers передают управление одному Python helper; dotenv разбирает
  Compose, shell evaluation отсутствует. Пароль не попадает в host argv.
- Plan связывает host/root, revision, daemon/закреплённый selector, project,
  existing source containers/volume, config/env hashes, paths и timeout.
- Execute требует exact approval/attempt и writer attestation, сохраняет
  одноразовый private journal с завершёнными фазами и вызывает новый dump.
- Dump публикует private unique snapshot, отдельную recovery copy и atomic
  latest с equality/SHA256; error/collision сохраняет прежние good files.
- Только backend build/recreate; existing DB/volume не пересоздаются,
  SQL/reset/import/автоматического retry или rollback нет.
- Allowlist context/explicit COPY, pruned dependencies, nonroot runtime,
  OCI revision label, Node healthcheck и DB-aware health endpoint.
- Строгие DB booleans/ports, production запрет synchronize/migrationsRun и
  автоматической установки extensions; инструкции приведены к реализации.

## Self-review и независимый review loop

1. Self-review: сохранность latest при failed dump/copy, file collisions,
   symlink/hardlink/parent permissions, inherited lock, .env/SQL leakage,
   source/config/revision mismatch, image revision и отсутствие retry.
2. Независимый reviewer нашёл R1/P2: bare Docker CLI мог выбрать другой daemon
   после переключения active context другим терминалом. Исправлено: explicit
   selector для всех commands/repeated preflight/child dump, с сохранением
   precedence DOCKER_CONTEXT над DOCKER_HOST/TLS. R1 независимо закрыто.
3. Дополнительный self-review: cleanup не удаляет pre-existing partial при
   collision; recovery final публикуется только после complete copy/fsync/hash;
   unsafe writable/foreign parents отклоняются. Все эти изменения повторно
   просмотрены reviewer: APPROVE, открытых P0/P1/P2 нет.

## Проверки

- TypeScript noEmit/build config — PASS.
- Existing Jest discovery: 2 isolated suites, 86 tests — PASS. HTTP suite
  использует только loopback, mock guards/services; AppModule/DB не запускаются.
- Python AST, Bash syntax и scoped whitespace — PASS.
- Agent kit validator — PASS: 7 skills, 8 agents, 580 links, 128 indexed files.
- Synthetic Compose config с fake credentials, default/custom env path с
  пробелами, production flags/ports/DB credential boundaries — PASS.
- Node healthcheck VM success/non200/network/timeout/invalid port — PASS.
- Docker Compose build/up flags — PASS: help only с несуществующим Unix socket,
  без daemon access.
- Final isolated fake-Docker/Git matrix: exit0, **190 assertions PASS**.
  Direct DatabaseService/HealthController checks: exit0, **60 assertions PASS**.
  Включены success/fail dump/build/up/health, last-good preservation,
  deterministic collisions/interrupted copy, symlinks/hardlinks/ancestors,
  replay/concurrency, approval/source/revision/daemon binding, все Docker
  selector branches, active-context flip, child inheritance и custom env.
- Проверенные helper/wrappers/runtime bytes совпадают с итоговыми файлами.
  Helper SHA256: `9689e98465c89102859c4e6a10f5c0461fdc8555e624fb74ba5e506675fca4f2`.
  Временные evidence: `/private/tmp/grippo-ops-verification-jidnr51f/verification-report.json`,
  `round6/results.json`, `runtime-results.json` в том же каталоге.
  Независимый reviewer сам прочитал evidence и сверил source hashes.

## Итог

Локальная реализация и review loop завершены; открытых применимых P0/P1/P2
в проверенном объёме нет. Reviewer APPROVE включает повторный просмотр R1,
backup/path исправлений и итоговых instructions. Деплой не разрешён и не выполнен.

## Границы результата

Реальная Docker build/runtime, PostgreSQL restore drill, schema/business smoke
и production configuration не проверены. SSH, реальный dump/deploy/restore,
volume operations не выполнялись. Mocks подтверждают ветви своего стенда,
а не работу Docker engine/PostgreSQL или production readiness.

Existing compatible Compose DB/backend обязательны; external DB, bootstrap,
DB image/topology upgrade и schema changes требуют отдельных планов. Flags
не доказывают human permission или фактическое прекращение всех writers.
Context definition/TLS/config и checkout должны иметь единственного согласованного
writer. Recovery path вне checkout не означает off-host/encrypted/PITR backup.

Во время работы появились параллельные изменения entities/auth/trainings/users/
weight-history и tasks/feature-modules-review.md. Они не относятся к этому
изменению, не исправлялись/не откатывались и не включены в вердикт этого review.
Здесь src scope: AppModule, main, DatabaseService и новый HealthController.

## Повторное ревью и публикация

Новый запрос: ещё раз проверить scripts/Docker, исправить остатки и запушить
все подготовленные изменения. Запрет SSH, подключения к серверу и deployment
сохранён. Предыдущие результаты выше относятся к первому snapshot.

Независимый второй проход нашёл и закрыл:

- **P2: recovery image evidence.** В plan/journal сохраняются прежние immutable
  backend/DB image IDs и прежняя revision label при наличии. До rollout проверяется
  доступность old runnable image; dump-only не блокируется отсутствием image cache.
- **P2: image tag race.** Build tag ограничен Compose project. Сборка проверяется
  по ID/approved revision; up выбирает immutable ID через отдельный env selector.
  Полный config обязан отличаться только backend.image, actual container.Image
  обязан совпасть с выбранным ID. New/old IDs остаются в checkpoint после failure.
- **P2: stalled health subscriptions.** Общий probe теперь включает deadline и
  результат. После timeout новые HTTP checks не подписываются на незавершённый
  raw query; cached 503 снимается после его resolve/reject, затем probe восстановим.

Self-review завершён; scripts и Docker/runtime reviewers независимо дали
APPROVE после повторного просмотра исправлений. Дополнительные независимые
pure-source assertions и 10 offline Compose renders прошли без daemon access.
Инструкции обновлены под image selectors и bounded health probe.

Финальная независимая верификация: **270 CLI +60 runtime +18 health regression
assertions PASS, каждый process exit0**. Включены retag непосредственно внутри
up, selector side effects, missing old/new images, журналы после failure и
многократные health timeouts с recovery. Проверенные source bytes совпали.
Helper SHA256: `219da9dcc1dd63f0e9223f69bf79ca730d63387070f0c0934640af94a66bd369`.
Evidence: `/private/tmp/grippo-ops-verification-jidnr51f/second-review-verification-report.json`,
`round8/results.json`, `runtime-results.json`, `health-regression-results.json`.

Fresh existing Jest: **2 suites /86 tests PASS**, discovery подтверждён.
Python AST, каждый Bash script отдельно, scoped whitespace и kit validator —
PASS. Fresh TypeScript noEmit на полном итоговом дереве — PASS.
Remote GitHub main проверена отдельно; Git push не является deployment.
Публикация включает подготовленные feature fixes после отдельного review,
а не SQL/.env/private/local artifacts. Actual commit/push результат — в Git history
и ответе пользователю; изменений production от этих проверок нет.

Publication review отдельно проверил 20 feature/entity sources и актуальный
feature report. Новая однострочная правка GoalsEntity исправляет metadata default
personalizations; она не является применением DDL к существующей БД. Source
manifest reviewer сохранён в `/private/tmp/grippo-publication-feature-review-manifest.json`.
Результаты native PostgreSQL fixtures принадлежат параллельному feature проходу
и описаны в его отчёте; этот operational проход их сам не запускал.

## Подготовка первого AI deployment

Пользователь разрешил push и подготовку обновления сервера с обязательным
свежим backup, проверкой и локальной копией. Подтверждены
`ubuntu@51.21.57.106:22` и `/home/ubuntu/grippo-backend`; IDE закрыта,
параллельные изменения кода исключены. Конкретный rollout/freeze plan ещё
должен быть разрешён после подготовки и review; этот раздел не заменяет его.

### Фактический read-only preflight

- SSH со строгой проверкой ранее доверенного ED25519 host key успешен.
  В live root нет `.git`; обновление требует точного Git bootstrap после backup,
  обычный `git pull` сейчас неприменим.
- Docker local context `default`, Compose **2.24.0**. Существующие backend/DB
  и named volume идентифицированы; старые immutable image доступны.
  PostgreSQL **15.5** healthy; backend running, но его старый `/health` отвечает
  **404**. Docker health уже был unhealthy до любых действий этой задачи.
- Старый `scripts/deploy.sh` содержит `down -v` и schema import/reset;
  **его запуск исключён**. Старый `scripts/dump.sh` читает `.env` через source,
  передаёт password в host process argv и неатомарно копирует latest.
  Первый backup требует отдельно согласованного узкого legacy bootstrap;
  скрытой замены штатного dump произвольным `pg_dump` нет.
- Actual schema probe выполнялся только в `REPEATABLE READ READ ONLY`:
  **19 entity-таблиц / 134 ожидаемых колонки**, все ожидаемые enum values, 20 FK и 7 logical
  UNIQUE-наборов совместимы. Блокирующих несовместимостей не найдено.
  Старые отличия CHECK/nullability и дополнительная legacy-таблица не меняются
  автоматически. Сравнение metadata не доказывает инварианты пользовательских данных.
- БД около **13 МБ**, доступно около **15 ГБ на диске**; на момент probe не наблюдалось
  сторонних DB clients. Это не заменяет согласование отсутствия внешних writers.
- Старый локальный `scripts/dump.sql` сохранён отдельной mode600 копией вне
  checkout до будущего обновления; свежий серверный backup пока не выполнялся.

### Найден и исправлен реальный дефект preflight

Compose 2.24.0 удваивает каждый `$` в сериализованном `config`, включая JSON;
это не означает изменения фактического password. Первоначальный вывод о
расхождении credentials был опровергнут прямым сопоставлением protocol.
Источники: [Compose 2.24.0 config.go](https://github.com/docker/compose/blob/v2.24.0/cmd/compose/config.go#L132),
[Compose 2.35.1 config.go](https://github.com/docker/compose/blob/v2.35.1/cmd/compose/config.go#L156).

`operations.py` раньше сравнивал сериализованный JSON с raw container env,
из-за чего легитимный literal `$` блокировал backup/deploy. Исправление:
синтетический stdin-only capability probe определяет формат CLI; только при
доказанном doubled protocol снимается ровно один serialization layer.
Plain JSON и Docker inspect не меняются. Initial и immutable rollout config
используют один decoder; protocol включён в identity плана. Неизвестный формат
и непарный `$` в doubled protocol останавливают операцию. Реальное несовпадение
credentials по-прежнему блокирует исполнение.

Независимое code review этого исправления: **APPROVE**. Reviewer отдельно
выполнил проверки plain/doubled/unknown protocol, `$`/`$$`, сохранности inspect
и настоящий offline Compose render без daemon. Root подтвердил protocol
на actual Compose 2.24.0 сервера и совпадение декодированных DB/auth values
нового Compose с работающими контейнерами — без вывода секретов.

Повторные проверки итогового helper: **294 fake operations checks PASS**,
**7 protocol checks PASS** (включая настоящий local Compose render без daemon),
AST и whitespace PASS. Одноразовый backup helper отдельно прошёл
**12 synthetic checks**, затем его реальный `--preflight` на сервере подтвердил
source/image/auth/config без изменения live файлов, journal или контейнеров.
Это не выполнение самого backup или deployment.

Отдельно выявлен обязательный auth precondition: новый `TokenService` требует
непустые разные `JWT_SECRET_KEY` и `JWT_REFRESH_SECRET`; второго имени в старом
runtime нет. Deploy preflight теперь проверяет это до любых mutations;
standalone/emergency dump не зависит от auth configuration. Provisioning нового
refresh secret входит только в явно разрешаемый план после проверенного backup
и restore; access secret сохраняется. Старые refresh-токены потребуют повторного
входа. Сам `/health` такую ошибку auth configuration не выявляет.
Итоговый helper повторно прошёл **294 operations checks**, **49 JWT readiness
checks** и **7 protocol checks**, независимое review — APPROVE.
Actual TTL access/refresh проверены в памяти старого backend на synthetic
payload/secret: оба формата валидны, токены не выводились и не сохранялись.

### Одноразовые процедуры подготовки

В private временном каталоге, вне Git, подготовлены отдельные helpers для:
проверенного штатного legacy backup; импорта exact release с Git metadata
после checksum-verified локальной копии; изолированного restore drill.
Файлы и серверный plan требуют итогового review и конкретного human permission.
Они не являются новым постоянным deployment framework.

Изолированный restore имеет hard RAM/swap limit **192 MiB**, private tmpfs
PGDATA/socket, network none и никаких working mounts/ports. Требует fresh
MemAvailable минимум **320 MiB** после freeze, исходную БД не больше **32 MiB**
и не выполняется одновременно со сборкой. Недостаток RAM/места, import error
или неуспешный cleanup запрещают успешный restore receipt и live update.

Legacy backup требует quote-only нормализации существующего password
с сохранением secret bytes, private копий прежних env/latest, закрытых прав,
подтверждённого freeze и полного exit0/hash/equality/recovery. Неизменённый
старый dump запускается с Bash noclobber; source/password-argv/non-atomic-latest
остаются явно раскрываемыми одноразовыми ограничениями. После update штатные
новые wrappers этих legacy механизмов не используют.

Переход сохраняет DB process/volume; архивирует перезаписываемый старый код,
сохраняет private/untracked файлы и импортирует только exact reviewed revision.
Новый execute обязан заново сделать штатный dump перед build/recreate backend.
При failure/disconnect нет автоматического retry, rollback или restore.

На момент этого preparation snapshot серверные код/`.env`/контейнеры/данные
не менялись; выполнялись только metadata probes и временный private config
render с подтверждённым удалением временных файлов. Deployment не выполнен.

### Дополнительные release gates перед разрешением

Проверка npm advisory подтвердила две известные critical в прежнем runtime
lockfile. Подготовлено узкое совместимое обновление:

- `proxy-addr 2.0.7 → 2.0.8` в разрешённом Express диапазоне `~2.0.7`:
  [upstream advisory](https://github.com/jshttp/proxy-addr/security/advisories/GHSA-jqcg-44mw-7w3h).
- `sha.js 2.4.11 → 2.4.12` в разрешённом TypeORM диапазоне `^2.4.11`:
  [upstream advisory](https://github.com/browserify/sha.js/security/advisories/GHSA-95m3-7q98-8xr5).

`package.json` не меняется. Lockfile содержит необходимую upstream цепочку
`to-buffer`: 18 добавленных helper packages, 10 обновлений вместе с целевыми
двумя и удаление прежнего orphan `has-proto`. Новых/изменённых узлов вне
dependency closure целевых пакетов нет; npm ls не обнаружил missing/invalid,
integrity и требования Node20 проверены.

Независимое dependency review: **APPROVE** и **41 runtime assertion PASS**,
включая обе причины advisory, корректные SHA1/SHA256/SHA512 и TypeORM aliases.
Свежие post-install проверки: noEmit **PASS**, Jest **2/86 PASS**, PostgreSQL
guards **5/5**, реальный PostgreSQL **32/32 + cleanup PASS**, agent-kit и
whitespace **PASS**, `npm run build` **PASS**.

Офлайн сравнение уже полученных advisory с итоговыми версиями подтверждает
устранение двух известных critical. Повторный online audit **NOT_RUN**:
автоматическая проверка разрешений отклонила отправку dependency tree в
registry. Обходов не предпринимали; «свежий audit/0 vulnerabilities» не заявляется.

Resource preflight: сервер около **914 MiB RAM**, swap отсутствует;
backend потребляет около 99 MiB. Local macOS build max RSS около **387 MiB**
превышает ожидаемые около 350 MiB available после freeze. Это не точная модель
Linux/Docker, но запуск без ресурсного плана не считается подготовленным.

Для отдельного явного разрешения подготовлен временный swap **1 GiB** в
private recovery storage: без `fstab`, sysctl, перезапуска DB или cleanup host.
Подтверждены ext4, необходимые tools и noninteractive sudo capability.
Отключение допускается только для собственного файла при достаточной RAM;
иначе он остаётся active с явным pending cleanup. Swap пока не создан/не включён.


## Первый production rollout

Дата: 2026-10-16 Europe/Kiev (2026-10-15 UTC). Пользователь прямо разрешил
одну подготовленную попытку на `ubuntu@51.21.57.106:22`, root
`/home/ubuntu/grippo-backend`, revision
`68465c611e29d01490e136ec14ead573b580934c`. Подтверждены закрытая IDE,
единственный code writer и остановка HTTP clients/других DB writers до отчёта.
Ключ использован по согласованному пути; StrictHostKeyChecking не отключался.

План перед выполнением прошёл self-review и независимое APPROVE. Человеческое
разрешение связано с подготовленным планом SHA256
`26e7df3ed2bdca6463db4825dd9c731f3acfff3917abf86453cdff9581999f1c`;
после импорта точной revision independently сверён фактический runtime plan
`c652b85be5ee0454224f157575d041e5d5dd32daea3575aaa4aaf8cdf87ef01a`.
Bootstrap attempt `72573d17-6261-45a9-95ad-b1d1d3ac2fc1`, deploy attempt
`c2c04283-6b12-4383-b118-0762115a5a08`. Это запись состоявшегося запуска,
не разрешение будущих попыток, повторов, cleanup или recovery.

### Фактический порядок и результат

- На сервере был legacy SFTP checkout без `.git`. До live upload сохранены
  прежние env/latest, остановлен только старый backend; PostgreSQL оставалась
  доступна. Неизменённый старый штатный `scripts/dump.sh` завершился exit 0.
  Его `source .env` и пароль в host argv были явно раскрытым и разрешённым
  одноразовым исключением; проверены literal env и quote-only изменение пароля.
  Старый destructive deploy с `down -v` не запускался. Новый workflow dotenv
  не исполняет и пароль в host argv не передаёт.
- Свежие snapshot/latest/private recovery copy совпали по size/SHA256.
  Backup скачан SFTP, сверен локально и повторно на сервере, сохранён с fsync
  отдельно от checkout; локальный latest заменён атомарно. Прежний local dump
  сохранён независимо, не перезаписан.
- Полный backup восстановлен через `psql --single-transaction` и ON_ERROR_STOP
  в отдельном PG 15.5 container: network none, без опубликованных ports,
  host binds и named volumes, RAM/no-swap limit 192 MiB, tmpfs PGDATA 128 MiB.
  Совпали metadata и counts всех **20 таблиц**, **56 constraints**, **221 enum
  labels**. Собственный test container удалён, cleanup проверен. Source DB
  не импортировалась и не менялась.
- После backup/off-host/restore добавлен новый случайный `JWT_REFRESH_SECRET`.
  Access secret и остальные env values сохранены. Прежние refresh-токены
  требуют повторного входа; access-токены сохраняют прежний expiry.
- Проверенный release archive SHA256
  `856884b4a9138f3dcfe23723ca6da5361b8dbdf2ad7131a99935b4cd1c3bf801`
  содержит 183 tracked файла точной revision. До overwrite сохранены 120
  прежних code files и code archive SHA256
  `aabd3410489292ed83cc4298b1f770d4aa6476ef06eb25d25e7a6a7c0e114eea`.
  Импортирован Git checkout; `.env`, dumps/backups и чужие files сохранены.
- Новый `deploy.sh --execute` сделал **ещё один новый штатный dump**, проверил
  independent recovery copy, построил image и пересоздал только backend.
  Никаких `down`, DB restart/recreate/upgrade, volume removal, SQL import,
  synchronize или migrations не выполнялось. Execute exit 0, status healthy.
- Backend container
  `9a0cb0a147011b8142045abebdbe702e693eca793712cdeded878e57d13add72`
  использует image
  `sha256:54cc1dd7a7abdca5d95a6af801235a90bb99e71ddef6a81bc5b8ccf991ee24ed`
  с label разрешённой revision. Проверены healthy, restartCount 0, OOM false,
  nonroot `node`, init, cap_drop ALL/no-new-privileges, production и schema
  flags false, exact DB endpoint/credentials match без вывода values.
  Git tracked tree после импорта чист. Старый immutable backend image сохранён.
- PostgreSQL container ID/image и `grippo-backend_pgdata` остались прежними;
  DB healthy, restartCount 0. Новые DB-specific hardening settings Compose
  к работающему старому DB container этим backend-only deploy не применялись.
- Actual runtime: Node major 20, `proxy-addr@2.0.8`, `sha.js@2.4.12`.
  Read-only smoke **13/13 PASS**: `/health` HTTP 200; actual TokenService
  выпускает synthetic access/refresh с проверенными signatures/claims/TTL,
  cross-secret verification отклоняется; missing Bearer, отсутствующий synthetic
  user и refresh-as-access возвращают точные 401/error/WWW-Authenticate contracts.
  Секреты/JWT остаются в памяти, user creation/DB writes/provider calls отсутствуют.

### Backup на сервере и ПК

Оба новых dump побайтно совпадают: **4 427 736 bytes**, SHA256
`7f71cb7156b435e3bf1b2748c0d5e67cfe61be52c389d575494f4bbb4298d6d6`.
Именно этот payload прошёл полный isolated restore drill. После execute повторно
проверены three distinct regular private copies, checksum/size и healthy source.
Финальная off-host copy сохранена и локальный latest снова обновлён атомарно:

- `/Users/maxvoitenko/Backups/grippo/predeploy-c2c04283-20261015T223546Z.sql`;
- `/Users/maxvoitenko/Projects/Pet/grippo-backend/scripts/dump.sql`.

Bootstrap copy, прежний local dump, metadata receipts и journals сохранены
независимо. Server recovery directory вне checkout:
`/home/ubuntu/grippo-recovery/72573d17-6261-45a9-95ad-b1d1d3ac2fc1`.
SQL/env payloads в Git и этот отчёт не включены.

### Ресурсы и оставшиеся ограничения

Для сборки был отдельно разрешён один temporary swap 1 GiB: сервер имеет
около 914 MiB RAM без исходного swap; local build достигал 387.4 MiB RSS.
Создание/activation проверены по own inode, pinned host/DB и ext4; fstab/sysctl
не менялись. В конце **cleanup PENDING**, ожидаемый exit 2 без mutation:
MemAvailable 366 141 440 bytes, swap used 233 308 160 bytes; заданный guard
требует used swap + 128 MiB, то есть 367 525 888 bytes. Поэтому swap оставлен
активным, forced swapoff/повторная попытка не выполнялись. Путь:
`/home/ubuntu/grippo-recovery/build-swap-72573d17-6261-45a9-95ad-b1d1d3ac2fc1/build.swap`.
Это отдельный незавершённый шаг безопасной очистки при достаточной памяти,
не неисправность backend/DB и не автоматическое разрешение retry/cleanup.

Read-only guard smoke не доказывает успешный login реального пользователя,
OAuth integrations или business writes; 401 unknown-user также не подтверждает
успешный users SQL lookup. Actual schema compatibility, DB health и isolated
restore проверены отдельно. Исторический schema drift, описанный выше, не
исправлялся миграцией. Свежий external `npm audit` остаётся **NOT_RUN**:
auto-review запретил отправку dependency graph registry; обходов не было.
Два известных critical runtime advisory проверены как исправленные, это не
утверждение об отсутствии остальных уязвимостей.

Operational receipts и sanitized proofs независимо проверены reviewer: APPROVE
rollout/backup/smoke с явно незавершённой очисткой swap. Проверены также файлы
local latest/final/bootstrap/previous backup и четыре независимых inode. После
функционального отчёта о healthy/smoke/final off-host backup разрешено возобновить
HTTP clients; фактическое действие пользователей этим не утверждается.
После успешного runtime rollout обновляются skills и этот report; последующая
публикация документации не меняет server runtime revision и не запускает новый
неразрешённый deployment.


Post-deploy maintenance: обновлены только operations skill/references и этот
report, runtime code не менялся. Repo agent-kit validator — PASS: 7 skills,
8 agents, 625 local links, 135 indexed files; final whitespace — PASS.
Skill-creator `quick_validate.py` — NOT_RUN: PyYAML отсутствует и в системном,
и в bundled Python; зависимости не устанавливались. Frontmatter/links/inventory
проверены проектным validator, поведение и точность — независимым reviewer.
