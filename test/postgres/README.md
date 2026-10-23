# PostgreSQL regression tests

Постоянные проверки настоящих services → TypeORM → PostgreSQL. Объявленный
inventory — 146 сценариев: 17 identity и 129 catalog/trainings. Это число можно
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
| Identity — 17 сценариев | Default goal, конкурентное создание profile/goal, удаление последнего веса, обе замены exclusions, set-семантика IDs и границы роста, поздние rollback, FK/CHECK/UNIQUE, user/profile cascades |
| Catalog/trainings — 129 сценариев | Create/replace/delete и реальный lock/FK/rollback, точность training aggregates, отказ при повторных references и публичный response; old→new language enum/UNIQUE, revision/409 guards, импорты BR/PT, no-op/conflicts/source changes, late rollback, обе очередности importer/PUT, reconciliation потерянного COMMIT; additive equipment enum/catalog SQL, idempotency/conflicts, concurrent publication lock, required equipment response fields and independent UUID exclusions; kettlebell и assisted pull-up/dip metadata preflight, explicit stored name, preserved existing UUID/timestamps, normalized name conflicts and concurrent same/different-name publication; assisted equipment сохранность турника/брусьев/butterfly/butterfly_forearm/kettlebells, separate UUID exclusions, direct/array enum consumers; plate-loaded row metadata guards, unresolved-name preflight, row_cable/row_bench preservation and independent exclusions; belt squat metadata/preflight, required explicit name, exact UUID/timestamp reuse, same/different-name publication locks, preservation of squat equipment and neighboring additions with independent exclusions; plate-loaded seated dip metadata/preflight, explicit stored name, exact UUID/timestamp reuse, publication locks, сохранение triceps_machines/dip_bars/assisted_pull_up_dip и предыдущих добавлений, independent exclusions; ankle cuff quoted metadata/preflight, omitted-name status and explicit data name, UUID/timestamp reuse, same/different-name publication locks, сохранение cord_handles/refs и independent UUID exclusions после свежего чтения user/service; plate-loaded incline chest press metadata и guards трёх legacy labels, явное stored name, exact UUID/timestamp reuse, публикация с locks при одинаковом/разном name, сохранение chest_press_machines/incline_bench_with_rack/shoulder_press_machines и предыдущих additions, response и независимые persisted exclusions; vertical leg press metadata и guards четырёх legacy labels, явное stored name, exact UUID/timestamp reuse, одинаковые/конфликтующие публикации с locks, сохранение leg_press_machine/hack_squat_machines/smith_machines/squat_rack и прежних additions, response и independent persisted exclusions после свежих user/service reads; landmine metadata и guards barbell/plate_loaded_row, явное stored name, exact UUID/timestamp reuse, same/different-name publication locks, сохранение всех прежних additions, free_weight parent и independent persisted exclusions после свежих user/service reads; decline chest press — сценарии metadata/трёх legacy guards, обязательного явного name input при синтетических fixtures, UUID/timestamp reuse, locks/conflicts, сохранения chest_press_machines/decline_bench/decline_bench_with_rack и всех additions, public response/independent exclusions |
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
- [equipments.cjs](equipments.cjs) — equipment SQL и service-сценарии внутри catalog suite.
- [kettlebells.cjs](kettlebells.cjs) — preflight/schema/data SQL гирь, конфликты, блокировки и сохранность UUID/связей.
- [assisted-pull-up-dip.cjs](assisted-pull-up-dip.cjs) — preflight/schema/data SQL гравитрона с подтверждённым name `Assisted Pull-Up / Dip`, конфликты, блокировки, сохранность старого оборудования/refs и независимые exclusions.
- [plate-loaded-row.cjs](plate-loaded-row.cjs) — девять preflight/schema/data-сценариев рычажной тяги: обязательное согласованное name, quoted metadata, конфликты/locks, сохранение row_cable/row_bench и независимые exclusions.
- [belt-squat.cjs](belt-squat.cjs) — девять preflight/schema/data-сценариев Belt Squat: обязательное согласованное name, quoted metadata, конфликты/locks, сохранение squat_rack/smith_machines/hack_squat_machines и соседних добавлений, публичный response и независимые exclusions.
- [plate-loaded-seated-dip.cjs](plate-loaded-seated-dip.cjs) — девять preflight/schema/data-сценариев Plate-Loaded Seated Dip: явное name, quoted metadata, конфликты/locks, сохранение triceps_machines/dip_bars/assisted_pull_up_dip и соседних добавлений, публичный response и независимые exclusions.
- [ankle-cuff.cjs](ankle-cuff.cjs) — девять preflight/schema/data-сценариев Ankle Cuff: явное name, quoted metadata, конфликты/locks, отдельная UUID identity в cable_machines, сохранение cord_handles и всех старых refs/exclusions, публичный response и независимые persisted exclusions после свежего чтения user/service. Использует исторические SQL-ресурсы из [fixtures/equipment-publication](fixtures/equipment-publication/) в изолированной suite.
- [plate-loaded-incline-chest-press.cjs](plate-loaded-incline-chest-press.cjs) — девять preflight/schema/data-сценариев Plate-Loaded Incline Chest Press: явное name, quoted metadata и три legacy label guards, конфликты/locks, собственная UUID identity в machines; сохранение chest_press_machines, incline_bench_with_rack, shoulder_press_machines и предыдущих additions, всех старых refs/exclusions; public response и независимые general chest/incline exclusions после свежего чтения user/service. Использует исторические SQL-ресурсы из [fixtures/equipment-publication](fixtures/equipment-publication/) в изолированной suite.
- [vertical-leg-press.cjs](vertical-leg-press.cjs) — девять preflight/schema/data-сценариев Vertical Leg Press: явное name, quoted metadata и четыре legacy label guards, конфликты/locks, собственная UUID identity в machines; сохранение leg_press_machine, hack_squat_machines, smith_machines, squat_rack и прежних additions, всех старых refs/exclusions; public response и независимые old leg/vertical exclusions после свежего чтения user/service. Использует исторические SQL-ресурсы из [fixtures/equipment-publication](fixtures/equipment-publication/) в изолированной suite.
- [landmine.cjs](landmine.cjs) — девять preflight/schema/data-сценариев Landmine: явное name, quoted metadata и два legacy label guards, конфликты/locks, собственная UUID identity в free_weight; сохранение barbell, plate_loaded_row и прежних additions, всех старых refs/exclusions; public response и независимые Barbell/Landmine exclusions после свежего чтения user/service. Использует исторические SQL-ресурсы из [fixtures/equipment-publication](fixtures/equipment-publication/) в изолированной suite.
- [plate-loaded-decline-chest-press.cjs](plate-loaded-decline-chest-press.cjs) — девять preflight/schema/data-сценариев decline chest press: синтетические fixture names, quoted metadata и три legacy label guards, конфликты/locks, собственная UUID identity в machines; сохранение chest_press_machines, decline_bench, decline_bench_with_rack, прежних additions и всех refs/exclusions; public response и independent chest/decline exclusions после свежего user/service чтения. Использует исторические SQL-ресурсы из [fixtures/equipment-publication](fixtures/equipment-publication/) в изолированной suite.
- [fixtures/equipment-publication/](fixtures/equipment-publication/) — опубликованные preflight/schema/data SQL для equipment regression tests.
- [runtime.guard.cjs](runtime.guard.cjs) — проверки защиты runner.
