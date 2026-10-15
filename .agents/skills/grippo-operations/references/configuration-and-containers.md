# Конфигурация, Docker и процесс приложения

Источники: [Dockerfile](../../../../Dockerfile), [docker-compose.yml](../../../../docker-compose.yml), [main.ts](../../../../src/main.ts), [AppModule](../../../../src/app.module.ts), [DatabaseService](../../../../src/database/database.service.ts), [DatabaseModule](../../../../src/database/database.module.ts), [database.provider.ts](../../../../src/database/database.provider.ts), [swagger.ts](../../../../src/swagger.ts).

## Поток конфигурации

1. Bash scripts загружают `$ROOT_DIR/.env` через `source` с `set -a` (shell execution, export переменных).
2. Compose интерполирует `${...}` и передаёт `.env` обоим services через `env_file: .env`; service-level `environment` перекрывает перечисленные ключи. `--env-file` в deploy управляет Compose interpolation; путь service `env_file` всё равно задан самим Compose file.
3. `AppModule` вызывает `ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true })`; `DatabaseModule` отдельно вызывает `ConfigModule.forRoot()`. Schema validation/default conversion/validationSchema отсутствуют.
4. Bootstrap берёт `BACKEND_PORT` из ConfigService и требует truthy значение, затем `listen(port, '0.0.0.0')`. Dockerfile/Compose также задают `PORT`, но код bootstrap его не читает.
5. `DatabaseService` передаёт ConfigService values в TypeORM напрямую. `get<number>`/`get<boolean>` — TypeScript generics, не runtime parse. Не предполагай, что строка `.env` `false` превращена в boolean false. Читай фактические options/условия и типы перед изменением flags.

Не выводи `.env`. Для аудита наличия ключей достаточно regex по левой части assignments; полученный набор не доказывает, что значения непустые, безопасные или действующие. Полная `.env` также попадает в окружение **db**, включая auth secrets, потому что env_file применяется к обоим services.

## Реестр ключей по потребителям

Ниже имена и назначение из исходников, без значений среды. При изменении env
перепроверяй все потребители, а не только deploy required list.

| Ключи | Кто использует | Существенное поведение |
|---|---|---|
| `APP_ENV` | Compose backend environment | Переносится в `NODE_ENV`; собственного парсинга режимов нет |
| `NODE_ENV` | Dockerfile default, Compose override, swagger.ts | В Swagger влияет на подпись PROD/DEV, не выключает docs |
| `BACKEND_PORT` | deploy required; Compose build arg/ports/PORT; main.ts listen | Должен согласовывать host port, container port и фактический listen |
| `BACKEND_HOST` | Только deploy required | Bind/Compose hostname не настраивает |
| `BACKEND_CONTAINER` | Compose container_name | Это container name; service называется `backend` |
| `BACKEND_BUILD_CONTEXT`, `BACKEND_DOCKERFILE` | Compose build | Выбор build source/file; влияют на содержимое context |
| `PORT` | Dockerfile ENV, Compose backend | Используется Docker HEALTHCHECK; bootstrap читает другой ключ `BACKEND_PORT` |
| `POSTGRES_HOST` | Compose backend, DatabaseService | Для связи services по default network ожидается service hostname `db`; реальное значение не предполагается |
| `POSTGRES_PORT` | deploy required; Compose DB host mapping и backend connection | Container DB слушает 5432, mapping `${POSTGRES_PORT}:5432`. Для backend тот же ключ используется как remote DB port: custom host port может сломать внутреннее подключение к `db` |
| `POSTGRES_USERNAME` | deploy/dump, Compose DB `POSTGRES_USER`, backend/TypeORM | Bootstrap DB username и psql/pg_dump user |
| `POSTGRES_PASSWORD` | deploy/dump, Compose DB/backend, TypeORM | Secret. В dump/schema-drop передаётся через `docker exec -e PGPASSWORD`; import password явно не передаёт |
| `POSTGRES_DATABASE` | deploy/dump, Compose DB `POSTGRES_DB`, TypeORM | Dump filename включает имя БД; не публикуй реальные paths с чувствительными именами |
| `POSTGRES_CONTAINER_NAME` | Compose DB container_name; deploy/dump exec | Не заменяет Compose service `db` в `compose logs` |
| `POSTGRES_SYNC`, `POSTGRES_LOGS`, `POSTGRES_MIGRATIONS` | DatabaseService | Прямо передаются в `synchronize`, `logging`, `migrationsRun`; migrations list пуст. Нет явного boolean parse/default |
| `PGHOST`, `PGHOSTADDR`, `PGPORT`, `PGSERVICE`, `PGSERVICEFILE` | libpq tools pg_dump/psql внутри container, если заданы средой | Source scripts не задают явные -h/-p; эти ключи могут изменить фактическую DB. Не считать container name доказательством endpoint. Значения/наличие production env не предполагаются |
| `JWT_SECRET_KEY`, `JWT_EXPIRATION_TIME` | JWT module, token.service, strategy | Secret/TTL доступа; module имеет fallback TTL `'1d'`, TokenService.sign uses value напрямую |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION_TIME` | token.service, auth.service | Отдельный refresh secret и TTL; Compose environment явно не перечисляет secret, но env_file способен передать |
| `GOOGLE_CLIENT_ID_IOS`, `GOOGLE_CLIENT_ID_ANDROID`, `GOOGLE_CLIENT_ID_WEB` | google-auth.service | Audience allowlist; не подменяй одним случайным ID |
| `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_BUNDLE_ID`, `APPLE_PRIVATE_KEY_B64` | apple-auth.service | Apple authorization-code exchange, client-secret JWT, JWKS и ID-token verification; revoke flow отсутствует. B64 private key — secret |
| `DB_DUMP_FILE` | deploy/dump paths | Default `scripts/dump.sql`; вычисляется до source .env. Это относительный путь под ROOT_DIR, текущая реализация absolute path не поддерживает корректно |
| `DROP_SCHEMA_BEFORE_IMPORT` | deploy only | Только точная строка `true` запускает `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` |
| `DOCKER_COMPOSE_FILE` | deploy only | Default `docker-compose.yml`; вычисляется до source .env; bare timeout compose logs этот выбор теряет |
| `LOG_MAX_SIZE`, `LOG_MAX_FILE` | Compose logging options обоих services | Ротация json-file logging driver; shell logger с ними не связан |

Потребители auth: [token.service.ts](../../../../src/modules/auth/services/token.service.ts), [auth.module.ts](../../../../src/modules/auth/auth.module.ts), [auth.service.ts](../../../../src/modules/auth/auth.service.ts), [Google](../../../../src/modules/auth/services/google-auth.service.ts), [Apple](../../../../src/modules/auth/services/apple-auth.service.ts), [JwtStrategy](../../../../src/common/jwt.strategy.ts).

## Compose topology

| Объект | Текущее описание |
|---|---|
| Service `db` | `postgres:15.5`, name `${POSTGRES_CONTAINER_NAME}`, DB env mapping, port `${POSTGRES_PORT}:5432` без bind IP restriction |
| Persistent data | Named volume `pgdata` → `/var/lib/postgresql/data`; фактическое Docker volume name получает Compose project prefix |
| Service `backend` | Build `${BACKEND_BUILD_CONTEXT}` + `${BACKEND_DOCKERFILE}`, arg `APP_PORT=${BACKEND_PORT}`, name `${BACKEND_CONTAINER}` |
| Backend port | `${BACKEND_PORT}:${BACKEND_PORT}` без bind IP restriction |
| Startup ordering | `backend.depends_on.db.condition: service_healthy` |
| DB healthcheck | `pg_isready -U ${POSTGRES_USERNAME}`, interval 10s, timeout 5s, retries 5; не проверяет данные/схему/приложение |
| Restart | Оба `unless-stopped` |
| Logs | Оба `json-file`, max-size/max-file из env |
| Network | Custom networks не объявлены; Compose создаёт default network |

Нет отдельного restore service, migration job, reverse proxy, TLS termination, secrets object, backup service, resource limits, backend volume или явного backend healthcheck override. Deployment target, reverse proxy, public domain, CI secrets и server provisioning из файлов не определяются.

Ни эти runtime файлы, ни `.env` не определяют подтверждённый SSH target.
Локальные ignored IDE hints и предварительное сообщение пользователя отдельно
описаны в [remote-access.md](remote-access.md), с уровнем подтверждения. SFTP/IDE
auto-upload не является разрешением на server writes или deployment. Для любых
реальных rollout действует [deployment-policy.md](deployment-policy.md).

## Dockerfile по стадиям

1. Builder: `FROM node:20`, `WORKDIR /app`, copy `package*.json`, `npm ci`, `COPY . .`, `npm run build`.
2. Runtime: `FROM node:20-slim`, `ARG APP_PORT=3010`, `NODE_ENV=production`, `PORT=$APP_PORT`, `WORKDIR /app`, создаёт system group/user `appuser`.
3. Копирует из builder `dist`, **весь** `node_modules` и `package.json` с ownership appuser. `npm prune --omit=dev` или production-only install отсутствует, dev dependencies входят в image.
4. `USER appuser`, `EXPOSE $PORT`, healthcheck каждые 30s, timeout 5s, start-period 10s, retries 3: `curl --fail http://localhost:$PORT/health || exit 1`.
5. `CMD ["node", "dist/main"]`. Node tags не закреплены digest; Docker build outcome зависит от полученных tags/registry/cache. Версия Docker runtime Node 20 задана tag, локальная версия не закреплена `.nvmrc`/engines.

### Context и health ограничения

- `.dockerignore` в исследованном checkout отсутствует. При context `.` и `COPY . .` `.env`, `.git`, SQL dump, `backups` и локальный `node_modules` доступны builder context/stage, несмотря на `.gitignore`. Локальный node_modules может накладываться на результат `npm ci` при COPY. Runtime копирует только перечисленные каталоги, но это не исключает sensitive content из builder/cache/context.
- Dockerfile не устанавливает curl. Статическое чтение не подтверждает его наличие в полученном `node:20-slim`. Даже при доступном curl route `/health` в текущем `src` не определён.
- Docker healthcheck и процесс отдельно: статус unhealthy сам по себе не означает, что Docker restart policy перезапустит работающий процесс. Deploy не ждёт healthy backend.
- `EXPOSE` документирует порт; публикация определяется Compose `ports`. Для Nest bind используется `BACKEND_PORT`, для healthcheck `PORT`: разные ключи должны совпадать фактически.

## Boot и логирование

- В AppModule импортируется DB connection provider. `new DataSource(...).initialize()` ожидается до завершения bootstrap; недоступность DB блокирует старт приложения. Это не lazy connection.
- CORS включён через `NestFactory.create(..., { cors: true })`; explicit allowlist нет. Global prefix закомментирован: routes без `/api`.
- Global ValidationPipe: `transform`, `whitelist`, `forbidNonWhitelisted` — true. Global LoggingInterceptor регистрируется напрямую через `new LoggingInterceptor()`.
- Swagger `/docs`, JSON link `/docs-json`, custom script `/swagger-custom.js`; PROD mode не отключает docs. Возможность `tryItOutEnabled` включена.
- Bootstrap требует `BACKEND_PORT`; проверка находится вне try вокруг `listen`. `bootstrap()` вызывается без top-level catch. `listen` failure логируется и даёт exit 1.
- После listen обработчики SIGINT/SIGTERM вызывают `app.close()`, затем exit 0. Shutdown hooks TypeORM/явный `DataSource.destroy()` в provider не объявлены; не обещай подтверждённое graceful DB close.
- [LoggingInterceptor](../../../../src/common/logging.interceptor.ts) в текущем checkout берёт `path = url.split(/[?#]/, 1)[0]` и пишет method/path/status/uid/duration; ошибки получают HttpException status либо 500. Query/fragment и err.message в этих сообщениях не выводятся, но path и uid могут быть sensitive; не пересылай необработанные production logs в docs/reviews. Morgan есть в dependencies, но его подключение в source отсутствует. При изменении interceptor перепроверяй фактический формат.

## Артефакты и Git hygiene

[.gitignore](../../../../.gitignore) исключает `.env`, `node_modules`, `dist`, `coverage`, `*.tsbuildinfo`, `backups/`, `grippo-key.pem`, `.idea/`. SQL target `scripts/dump.sql`, `.DS_Store` и иные private keys glob не исключены. Не добавляй sensitive dump в Git; перед commit проверяй конкретные staged paths. `.gitignore` не является Docker context filter, механизмом шифрования или защитой уже отслеживаемого файла.

Предлагаемые `.dockerignore`, разделение DB ports, env validation/boolean parsing, health route/curl, production pruning, narrowed env propagation — отдельные изменения, которые требуют собственных проверок; в текущем skill они документированы как пробелы, а не выполненные исправления.
