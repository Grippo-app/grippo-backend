# Проверка эксплуатационных изменений

Общие команды TypeScript/Jest и отчёт:
[grippo-verification/checks](../../grippo-verification/references/checks.md).
Источники: [operations.py](../../../../scripts/internal/operations.py),
[wrappers](../../../../scripts/), [Dockerfile](../../../../Dockerfile),
[Compose](../../../../docker-compose.yml), [.dockerignore](../../../../.dockerignore).

## Без выполнения операций

- `bash -n` проверяй для каждого wrapper/cleanup/logger отдельно. Он не
  исполняет script; `bash -n a b` не проверяет файл b.
- Python helper проверяй через AST parse без import/main и без создания
  `__pycache__`. Python >=3.9 нужен runtime; validator kit требует >=3.11.
- ShellCheck допустим при наличии; не устанавливай tools скрыто и не подставляй
  настоящий secret env ради source analysis.
- YAML/Node healthcheck JSON и JS syntax проверяй локальными parsers. Для
  Compose config используй temp copy, полностью искусственную .env и controlled
  process env; вывод capture/assertions, не полный config. Команда config
  не запускает daemon workload; реальный context/inspect/probe не нужны.
- Проверяй allowlist .dockerignore и explicit Docker COPY на секреты/SQL/Git/
  локальные node_modules. Docker build может запускать lifecycle/network и
  не является обязательной статической проверкой.
- Snippets из изменённых docs проверяй только через bash -n. Наличие команд
  в runbook не разрешает SSH/plan/dump/deploy/restore/cleanup.

## Изолированные behavioral fixtures

Используй временную копию вне checkout и synthetic credentials/data. Подмени
все Docker/Git/subprocess/network commands и source/write paths; actual
`deploy.sh` в production checkout не запускай как тест. Если проверяешь wrapper
в temp копии, child helper и обязательный child dump также остаются в ней.
Fixture должна завершиться до реального Docker/SSH/DB при забытой подмене.

| Область | Сценарии |
|---|---|
| Paths/storage | Relative/absolute selection, unsafe symlink/hardlink/owner/type/mode, missing parent/private recovery, overwrite/collision, full disk/copy/fsync failure |
| Source identity | Wrong daemon/project/labels/volume/network, absent/stopped/ambiguous DB/backend, external DB, credentials mismatch, inherited libpq endpoint overrides |
| Dump | Exit failure/timeout/empty/partial, same-second unique names, recovery fail before latest update, atomic latest, equality/checksum/permissions, no payload in errors |
| Plan | Default read-only, exact full revision/clean tree, same target/config/paths/timeout binding, missing/wrong approval, CLI attestation не считается human permission |
| Lock/attempt | Concurrent dump/deploy rejected, inherited child lock valid, existing attempt blocks replay, failed attempt not implicitly reused |
| Execute order | Actual child dump called every attempt, receipt mismatch blocks build, backup before build, build before backend-only up, no down-v/import/DB recreate |
| Rollout failure | Build/up/health timeout/error, backend missing/unhealthy, DB identity change; no automatic retry/rollback and good backup retained |
| TypeORM/health | Strict flags/defaults/invalid input, production schema flags rejected, DB port bounds; /health SELECT1 success/failure without details |
| Docker health | Node builtin HTTP:200 pass; non200/network/timeout/invalid port fail; no curl requirement |
| Image binding | Old immutable image retained in plan/journal, unavailable old image blocks deploy but not dump-only; distinct project build tags; wrong/missing built image blocks up; immutable selector changes only backend.image; tag changes during up cannot select another image |
| Stalled health | Many checks/timeouts share one raw query/subscription/deadline; cached 503 until raw resolve/reject, then recovery; no accumulating Promise.race reactions |
| Secrets | Raw stderr/config/inspect/build/SQL never relayed; private logs isolated; no secrets in argv/build context/Git |

Сценарии выбирай по изменению; не вводи постоянные specs/инфраструктуру вне
прямого запроса их добавления. Fixture подмены не подтверждают реальные
Compose/version/registry/image, PostgreSQL restore или production topology.

## Runtime проверка как отдельный scope

Реальный build и старт требуют явно выбранной изолированной среды; приложение
не подключают к существующей DB для проверки. Source-safety tests можно делать
на синтетических ConfigService/DATA_SOURCE без AppModule. Реальный restore drill
требует отдельной disposable PostgreSQL, schema/data проверки и разрешения.

Для rollout соблюдай [deployment-policy](deployment-policy.md). Нужны прямое
human permission на attempt, новый штатный backup, реальный writer control и
API smoke после DB-aware health. Ни PASS fixture, ни reviewer APPROVE не
разрешают actual SSH/plan/deploy.

После исправления повтори затронутые проверки и независимое review.
Отчёт: PASS/FAIL/NOT_RUN, actual method/exit, coverage и существенные limitations.
Статический разбор branch не выдавай за выполненный deploy/restore.
