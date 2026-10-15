# Локальное исправление deployment и Docker

Актуальное продолжение: «Повторное ревью и публикация» в конце отчёта.

Запрос: исправить scripts/Docker с self-review и независимым review.
SSH, production dump/deploy и реальные Docker runtime операции запрещены.
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
