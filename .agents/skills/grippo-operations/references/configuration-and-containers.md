# Конфигурация, Docker и запуск

Источники: [Dockerfile](../../../../Dockerfile), [.dockerignore](../../../../.dockerignore),
[Compose](../../../../docker-compose.yml), [operations.py](../../../../scripts/internal/operations.py),
[main.ts](../../../../src/main.ts), [AppModule](../../../../src/app.module.ts),
[DatabaseService](../../../../src/database/database.service.ts).

## Env и границы конфигурации

`dump.sh`/`deploy.sh` передают аргументы Python helper; shell `source .env`
отсутствует. Helper получает effective configuration через Docker Compose,
держит secret values внутри процесса и не печатает полный config/inspect.
`--env-file` выбирает interpolation и runtime env backend: helper устанавливает
reserved selector `GRIPPO_ENV_FILE` в проверенный абсолютный путь, а service
использует `env_file: ${GRIPPO_ENV_FILE:-.env}`. Без helper прямой Compose по
умолчанию берёт `.env`; один Compose `--env-file` сам не меняет service env_file.
Не используй reserved selector как application config или обход helper.

`GRIPPO_RELEASE_IMAGE` — второй reserved selector. Helper оставляет его пустым
при plan/build: default image — `${COMPOSE_PROJECT_NAME}-backend:local`.
Compose предоставляет effective project name для interpolation, поэтому проекты
имеют разные build tags. Только rollout получает проверенный immutable image ID.
Повторный config может отличаться исключительно `backend.image`; тот же ID
проверяется в новом контейнере. Не используй selector в других env полях:
это блокирует rollout, а не расширяет утверждённый plan.

Compose interpolation учитывает environment вызывающего процесса. Не используй
случайные `DOCKER_HOST`, `DOCKER_CONTEXT`, `COMPOSE_PROJECT_NAME` или env overrides:
сверяй effective daemon/project/config с планом. Чтение конфигурации по именам
assignments не доказывает runtime значения. Не выводи `.env`, `printenv`,
`docker inspect`, полный Compose config или tracing с credentials.

Compose `config --format json` в некоторых v2 удваивает каждый `$` при
сериализации, даже когда runtime значение не меняется. Helper определяет
протокол синтетическим stdin-only `config` probe с `--env-file /dev/null` и
фиксированным literal; version string и реальные secrets для этого не нужны.
Только для доказанного doubled protocol decoder снимает ровно один слой `$$`;
настоящий `$$` сохраняется, plain JSON и `docker inspect` не преобразуются.
Initial и immutable rollout config используют один decoder; protocol входит в
plan identity. Неизвестный формат/непарный `$` в doubled output — stop, а не
повод изменить password. Пробы render не запускают daemon workload.

Helper фиксирует исходный Docker selector для всех commands/child dump:
explicit `--context` либо HOST-only `--host` с сохранением TLS environment.
Selector hash связан с планом; active-context pointer больше не выбирается
заново при каждом command. Не меняй context definition/host/TLS в ходе attempt.

Backend получает application secrets через runtime env, а не build args/files.
PostgreSQL получает только `POSTGRES_USER/PASSWORD/DB`, а не всю `.env`.
`AppModule` использует global ConfigModule, DatabaseModule также вызывает
ConfigModule.forRoot; process environment имеет приоритет над dotenv.
Наличие ConfigService generic не выполняет conversion: текущий DatabaseService
отдельно парсит DB port/boolean flags и запрещает schema automation в production,
включая автоматическую установку extensions через TypeORM.

## Ключи по потребителям

| Ключи | Текущее назначение |
|---|---|
| `BACKEND_PORT` | Фактический listen, Docker healthcheck, container/host port и build arg APP_PORT; должен быть допустимым TCP port |
| `PORT` | Совместимый runtime env, но bootstrap/healthcheck используют BACKEND_PORT |
| `BACKEND_CONTAINER` | Обязательное имя container backend; Compose service называется `backend` |
| `NODE_ENV` | Docker/Compose устанавливают production; DatabaseService запрещает sync/migrations, Swagger меняет подпись |
| `APP_ENV` | Production Compose больше не использует; не переключает режим контейнера |
| `BACKEND_BUILD_CONTEXT`, `BACKEND_DOCKERFILE` | Production Compose больше не использует: context `.`, Dockerfile `Dockerfile` |
| `BACKEND_HOST` | Не задаёт listen/hostname и не нужен новому deploy |
| `BACKEND_BIND_ADDRESS` | Host bind опубликованного backend port, default `0.0.0.0`; это не настройка TLS/proxy |
| `POSTGRES_HOST` | В общем DatabaseService задаёт endpoint; этот Compose принудительно использует `db` |
| `POSTGRES_PORT` | В этом Compose задаёт только опубликованный host port DB; backend env принудительно `5432` |
| `POSTGRES_BIND_ADDRESS` | Host bind DB port, default `127.0.0.1`; при необходимости внешнего доступа нужен отдельный согласованный выбор |
| `POSTGRES_CONTAINER_NAME` | Обязательное имя DB container; service называется `db` |
| `POSTGRES_USERNAME/PASSWORD/DATABASE` | DB credentials/name, backend connection и dump source; значения не публикуются |
| `POSTGRES_SYNC/POSTGRES_MIGRATIONS` | Явно parsed booleans; production запрещает true, Compose принудительно false; migrations list пуст |
| `POSTGRES_LOGS` | Явно parsed DB logging boolean; production Compose принудительно false |
| `LOG_MAX_SIZE/LOG_MAX_FILE` | json-file rotation обоих services, default `10m`/`3` |
| `DB_DUMP_FILE` | Legacy process fallback для latest path; предпочтителен явный `--latest-file` |
| `DOCKER_COMPOSE_FILE` | Legacy process fallback для Compose path; предпочтителен явный `--compose-file` |
| `GRIPPO_ENV_FILE` | Reserved selector helper для выбранного backend env_file; перекрывается helper, не произвольный application override |
| `GRIPPO_RELEASE_IMAGE` | Reserved immutable image selector только для rollout; plan/build используют project-scoped local tag |
| `DROP_SCHEMA_BEFORE_IMPORT` | Удалён из deploy workflow: SQL import/reset отсутствуют, не пытайся включить их env flag |
| `PGHOST/PGHOSTADDR/PGPORT/PGSERVICE/PGSERVICEFILE` | Не должны перенаправлять dump: helper использует explicit local PostgreSQL endpoint и проверяет actual source |
| `JWT_SECRET_KEY/JWT_EXPIRATION_TIME` | Access JWT; JwtModule имеет fallback TTL, TokenService читает config напрямую |
| `JWT_REFRESH_SECRET/JWT_REFRESH_EXPIRATION_TIME` | Отдельные refresh credentials/TTL |
| `GOOGLE_CLIENT_ID_IOS/ANDROID/WEB` | Audience allowlist Google; не своди к одному случайному ID |
| `APPLE_TEAM_ID/KEY_ID/BUNDLE_ID/PRIVATE_KEY_B64` | Apple code exchange и verification; private key — secret, не build input |

Auth source: [token.service](../../../../src/modules/auth/services/token.service.ts),
[auth.module](../../../../src/modules/auth/auth.module.ts),
[Google](../../../../src/modules/auth/services/google-auth.service.ts),
[Apple](../../../../src/modules/auth/services/apple-auth.service.ts).
Не считай эту таблицу validation schema всех application env: helper проверяет
нужные ему runtime invariants, а не каждый auth credential/TTL.
Deploy preflight требует непустые, различные `JWT_SECRET_KEY` и
`JWT_REFRESH_SECRET`, с тем же presence check, что `String.trim()` в TokenService;
сравниваются исходные значения. Dump-only этот auth gate не применяет, чтобы
ошибка auth не блокировала аварийный backup. `/health` не обнаруживает такую
ошибку и не проверяет TTL. В согласованном smoke проверяй TokenService с actual
config и синтетическим payload в памяти, без вывода/сохранения tokens.
Provision/rotation refresh secret требует оценки sessions и согласования:
ранее выданные refresh tokens могут перестать приниматься и потребовать входа;
сохраняй access secret, если его изменение отдельно не предусмотрено планом.

## Compose topology и совместимость

- `db`: postgres:15.5, persistent named `pgdata:/var/lib/postgresql/data`,
  `restart: unless-stopped`, stop grace 60s.
- DB healthcheck: explicit loopback:5432, configured user/database, interval 10s,
  timeout 5s, start 20s, retries 6. Это accepting-connections probe, не schema check.
- `backend`: fixed reviewed context/Dockerfile, dependency db healthy,
  init, restart unless-stopped, stop grace 30s, no-new-privileges и cap_drop ALL.
- Backend идёт по default Compose network к `db:5432`; нестандартный host
  published port не меняет внутреннее соединение.
- У services json-file rotation; custom proxy/TLS/network/backup service нет.
- Deploy обновляет только backend и не применяет изменения DB service:
  новая настройка DB bind/health/env/image не пересоздаёт работающую DB сама.
  Изменение DB topology или upgrade образа требует отдельного плана.

Этот production Compose больше не сохраняет прежнюю возможность выбора
external DB через POSTGRES_HOST, произвольного build context или APP_ENV.
Preflight обязан обнаружить несовпадение существующего backend и new config и
остановиться. Нельзя пересоздать backend с новым `db` endpoint поверх другой
пустой базы для «исправления» проверки.

## Build и runtime

1. `node:20-bookworm`: lockfile install через npm ci, explicit copy package,
   nest/tsconfig и src; build, затем prune devDependencies.
2. `node:20-bookworm-slim`: только dist, pruned node_modules и package.json,
   root-owned files, runtime USER node. Label org.opencontainers.image.revision
   получает RELEASE_SHA; deploy проверяет approved SHA и построенный immutable
   image ID до rollout, затем тот же ID в контейнере. Прежний image ID сохраняется
   в plan/journal и проверяется до mutation. Application code не принадлежит
   запускающему процессу; backend bind mounts в этом Compose не объявлены.
3. Allowlist `.dockerignore` не допускает root secrets/backups/Git/agent/task
   artifacts/local node_modules/dist и повторно исключает secret/data patterns
   внутри src. `COPY . .` отсутствует. При добавлении runtime assets обнови
   explicit COPY и allowlist после проверки содержимого.
4. Node builtin HTTP healthcheck обращается к `127.0.0.1:BACKEND_PORT/health`,
   требует HTTP 200, timeout 4s; Docker interval 10s/timeout 5s/start 30s/retries 6.
   curl и отдельные packages не нужны. Health endpoint проверяет DB через SELECT 1,
   возвращает sanitized failure; не доказывает schema/auth/business correctness.
   Один общий probe включает timeout/result: HTTP checks не добавляют подписки
   к зависшему raw query. Timeout остаётся cached до его завершения; после
   resolve/reject возможна новая проверка.
5. Base Node/PostgreSQL image tags не закреплены digest. Build/pull/npm могут зависеть от registry,
   cache/platform и lockfile; статические проверки не подтверждают готовый image.
   Не объявляй production dependencies безопасными только из-за prune.

## Bootstrap и сигналы

Bootstrap валидирует BACKEND_PORT, bind `0.0.0.0`, CORS и global ValidationPipe;
LoggingInterceptor пишет request metadata без query/fragment/error payload.
Swagger `/docs` и `/docs-json` остаётся доступен в production, prefix `/api` нет.
DATA_SOURCE.initialize выполняется до ready HTTP. SIGINT/SIGTERM закрывают app;
явный DataSource.destroy hook в shared provider не объявлен. Docker unhealthy
сам по себе не гарантирует restart: deploy отдельно ждёт и проверяет health.

`.gitignore` не заменяет `.dockerignore` и не защищает уже отслеживаемые файлы.
Перед commit проверяй конкретные staged paths; SQL/.env/keys не публикуются.
Compose описывает желаемую конфигурацию, а не доказывает actual состояние
существующего DB container. На каждой разрешённой попытке повторно проверяй
actual identity/config по [remote preflight](remote-access.md), включая DB
ports, mounts и security settings; source config не доказывает их применение.
