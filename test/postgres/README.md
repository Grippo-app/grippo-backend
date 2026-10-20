# PostgreSQL regression tests

Постоянные проверки настоящих services → TypeORM → PostgreSQL. Исходное
покрытие — 47 сценариев: 14 identity и 33 catalog/trainings. Это число можно
увеличивать при добавлении regression cases.

## Запуск

Нужны установленные зависимости проекта и локальные native binaries
PostgreSQL **15**: `postgres`, `initdb`, `pg_ctl`. Runner не устанавливает
PostgreSQL, не скачивает packages и не запускает Docker.

```sh
npm run test:postgres:guards
npm run test:postgres
```

Если binaries не найдены автоматически, укажи их абсолютный каталог:

```sh
npm run test:postgres -- --pg-bin /absolute/path/to/postgresql15/bin
```

Вместо аргумента можно задать `GRIPPO_TEST_PG_BIN`. Это путь к программам,
не к данным PostgreSQL и не к существующей БД. При отсутствии runtime команда
завершается с ошибкой; такой запуск не является PASS.

## Изоляция

Каждый запуск создаёт новый временный cluster, собственного пользователя,
случайный loopback-порт, private PGDATA/socket и синтетические credentials.
Подключение проверяется по принадлежности runtime, PID, data directory,
порту, версии и фактическому серверу до создания схемы. Внутри создаются
отдельные одноразовые БД для двух групп.

Команда не принимает URL/DSN, host/port или PGDATA существующей БД. Рабочие
`.env`, `DATABASE_URL`, `PG*`, TypeORM config и AppModule не используются.
Schema synchronization выполняется только в новых тестовых БД.
Код приложения и production-схема не изменяются.

После PASS, FAIL или прерывания runner освобождает соединения и останавливает
собственный PostgreSQL, удаляет тестовые данные и credentials. Ошибка cleanup
не превращается в успешный результат. Другие PostgreSQL процессы/данные
не останавливаются и не удаляются.

Результаты содержат названия сценариев и статусы, без SQL rows, query parameters
или секретов. UUID создаются встроенной функцией PG15 `gen_random_uuid()`;
установка `uuid-ossp` не проверяется. `synchronize` строит схему из текущих
entities с проектной naming strategy.

## Что проверяется

| Группа | Покрытие |
|---|---|
| Identity — 14 сценариев | Default goal, конкурентное создание profile/goal, удаление последнего веса, обе замены exclusions, поздние rollback, FK/CHECK/UNIQUE, user/profile cascades |
| Catalog/trainings — 33 сценария | Create/replace/delete и реальный lock/FK/rollback, точность training aggregates; old→new language enum/UNIQUE, revision/409 guards, импорты BR/PT, no-op/conflicts/source changes, late rollback, обе очередности importer/PUT, reconciliation потерянного COMMIT |
| Runtime guards — 7 проверок | Отказ от чужого runtime/параметров подключения, safe environment/lifecycle; inert CLI import/args и private backup bytes/hash/permissions/independent copies, без обращения к БД |

В исходных 13 конкурентных сценариях и двух новых importer/PUT ожидание подтверждается `pg_blocking_pids`
с точным PID блокирующей transaction, а не длительностью sleep.
В исходных 7 rollback-сценариях и новом import case test-only SQL triggers создают позднюю серверную ошибку;
после отката сравниваются первоначальные IDs, timestamps, порядок, агрегаты
и дочерние строки. Отдельно проверяются реальные нарушения FK/CHECK/UNIQUE.

Это не проверка существующей production-схемы, HTTP/guards/OAuth, нагрузки,
сетевых сбоев или всех возможных deadlocks. Обычный `npm test` запускает
отдельные Jest tests и не включает эту suite.

## Поддержка

При изменении entities/FK/defaults, сохранения/удаления данных, ownership,
транзакций или блокировок обновляй затронутые fixtures и сценарии в том же
изменении и запускай полную suite. При изменении runner/context/изоляции
запускай также guards. Не ослабляй assertions и не отключай изоляцию ради PASS.

Для нового дефекта добавь regression case; по возможности проверь, что он
падает до исправления и проходит после. Бизнес-ожидания меняются вместе
с согласованным контрактом, а не ради зелёных тестов.

Подробные критерии и границы — в
[verification checks](../../.agents/skills/grippo-verification/references/checks.md).

- [runtime.cjs](runtime.cjs) — создание и защищённое удаление отдельного cluster.
- [run.cjs](run.cjs) — команда запуска и обработка прерывания.
- [context.cjs](context.cjs) — настоящие repositories/services и одноразовые БД.
- [identity.cjs](identity.cjs) и [catalog.cjs](catalog.cjs) — сценарии.
- [runtime.guard.cjs](runtime.guard.cjs) — проверки защиты runner.
