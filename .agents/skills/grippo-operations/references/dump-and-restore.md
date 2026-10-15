# SQL artifact и план восстановления

Источники: [dump.sh](../../../../scripts/dump.sh), [operations.py](../../../../scripts/internal/operations.py), [entities](../../../../src/entities/), [DatabaseService](../../../../src/database/database.service.ts). Default latest — `scripts/dump.sql`; точные snapshot/recovery paths берутся из receipt. Открывать SQL целиком для анализа архитектуры не требуется.

Обязательный порядок dump-only и backup-before-every-deploy:
[deployment-policy](deployment-policy.md). Подключение и защищённая copy:
[remote-access](remote-access.md). Этот справочник описывает формат/schema
compatibility, а не выдаёт permission на restore.

## Граница чтения данных

SQL dump содержит данные пользователей и секретные значения наряду с reference catalog. Не выполняй `cat`, `head`, `tail`, широкий `rg` по всему SQL, data `INSERT`/`COPY` extraction, копирование dump в fixture или публикацию строк в отчёте. Для архитектуры нужны только schema/catalog metadata: CREATE TABLE/TYPE/INDEX/EXTENSION, ALTER constraints, безопасные counts и версии.

Line-prefix/regex scan plain SQL **не гарантирует schema-only вывод**:
многострочный строковый literal внутри INSERT может содержать `CREATE TABLE`,
`ALTER TABLE` или комментарий версии в начале строки. Такой scan выдаст
пользовательский текст как metadata. Не используй его для dump с данными.

Для текущей модели получай metadata из entities без initialize. Для конкретного
dump нужен проверенный SQL-aware parser, учитывающий quoted/dollar-quoted
literals, comments и COPY payload, либо заранее выделенный schema-only artifact.
Другой вариант — отдельно разрешённый isolated restore и чтение catalog
metadata там. Если безопасного метода нет, отметь анализ dump schema как NOT_RUN,
не печатай «похожие на DDL» строки. Нужны table/column types, FK пары/onDelete,
constraint types и версии; пользовательские строки не нужны. Не прилагай dump к PR.

## Совместимость schema с entities

Artifact — snapshot конкретной базы, а не постоянный ожидаемый fixture и не
контракт API. Перепроверяй именно выбранную копию; фиксированные исторические
counts из прежнего dump не доказывают его полноту или актуальность.

- Сравни table/column types, nullability/defaults, FK/onDelete, unique/index и
  CHECK constraints с [entity map](../../grippo-domain-data/references/entity-map.md)
  и actual entities. Проверяй также PostgreSQL/pg_dump versions и extensions.
- Старые names вроде `muscle_exercise_bundles`, `users_experience_enum` или
  `exercise_examples_weight_type_enum` могут сохраняться в dump независимо от
  текущего mapping. Их наличие не разрешает удалить table, добавить legacy
  entity или восстановить устаревший API contract.
- Если SQL использует `uuid-ossp`/`uuid_generate_v4()`, target должен поддерживать
  extension и соответствующие права. Deploy отдельно это не проверяет.
- Production запрещает TypeORM synchronize/migrationsRun. Обычный deploy не
  меняет schema и не импортирует dump: совместимость нового backend с текущей
  schema проверяется отдельно. Для schema changes нужен отдельный data plan.

## Что dump сохраняет и чего не подтверждает

`pg_dump --format=p --inserts --no-owner --no-privileges --blobs` сохраняет plain SQL выбранной DB, schema/data и доступные large objects. Helper проверяет SHA256/size snapshot, latest и recovery copy; SQL не шифруется, не сжимается и не исключает private tables. `psql` — importer этого формата; `pg_restore` ожидает archive formats.

Не включены backup cluster roles/globals, другие DB, Docker volume filesystem snapshot, приложение, env/private keys, registry images или server config. Credentials/ACL обеспечиваются отдельно. Independent copy — отдельный private path вне checkout; это не обязательно другой host/disk. Off-host storage, retention и restore drill не автоматизированы. Непустота/hash без полного exit0 и source identity не подтверждают valid backup; restore drill нужен как отдельное доказательство.

## Изолированная restore procedure: предложение, не встроенный script

Применяй только если пользователь действительно запросил backup/restore rehearsal и определена допустимая целевая среда. Запрос на skills/audit такой запуск не подразумевает.

1. Зафиксируй source snapshot, timestamp, checksum и валидность dump exit code. Не выводи payload. Сохрани исходный latest отдельно до эксперимента; не используй target production volume.
2. Выбери disposable DB/Compose project/ports и учётную запись с нужными правами. Убедись, что внешняя/production DB не выбрана через POSTGRES_HOST или container name. Подготовь конфигурацию с отдельными данными; не редактируй production `.env` для удобства.
3. Подними только disposable DB и дождись фактической readiness. Для реального backup предпочитай network none, отсутствие published ports/host bind/named production volumes, bounded memory/CPU/PIDs и собственные labels/ID; заранее проверь RAM и размер данных/WAL для tmpfs. Сверяй фактические isolation flags перед exec и cleanup. OOM/ENOSPC/timeout — FAIL, не частичный PASS. Backend пока не запускай, чтобы исключить запросы одновременно с импортом; schema flags выключены явно.
4. Подготовь чистую schema в выбранной disposable DB; destructive reset разрешён только в этой среде. Импортируй plain SQL через `psql -X --no-password -v ON_ERROR_STOP=1 --single-transaction` с explicit host/port и контролируемыми credentials. Это отдельный restore workflow: deploy.sh SQL не импортирует. Любой schema reset должен входить в отдельно рассмотренную транзакцию/процедуру восстановления.
5. Проверь полный exit0, schema-only inventory, constraints, enum labels и table counts относительно замороженного source без вывода пользовательских строк. Count/schema equality доказывают только эти сравнения, не все бизнес-инварианты или побайтовое равенство данных. Проверки бизнес-инвариантов согласуй с domain owner: сортировка exercises/iterations, profile ownership, goal uniqueness, components, translations.
6. Сравни imported schema с current entities. Для startup используй только disposable DB, явно выключенные synchronize/migrationsRun и управляемые booleans; не обходи production prohibition ради удобства.
7. Если в scope входит старт приложения, проверь `/health` и выбранные API через синтетические данные, без production tokens. Health SELECT 1 не подтверждает полноту schema/данных. Документируй результат; удали только собственные disposable ресурсы по проверенному immutable ID/labels и подтверди их отсутствие. Успех полного drill требует также успешного cleanup; сохраняй нужные артефакты/вывод без чувствительных данных.

## Rollback и восстановление после текущего deploy

- Permission, mandatory fresh dump, окно writes и сохранение good copy после
  failure определяются deployment-policy; отдельный dump не разрешает restore.
- Текущий deploy сохраняет DB/volume и не делает reset/import. Если инцидент
  относится к старому deploy с `down -v` или ручному drop, Git revert не
  восстанавливает удалённые данные. Отдельная import transaction не отменяет
  предшествующий schema drop другого процесса.
- Code rollback может быть несовместим со schema/data и новой конфигурацией. Сохраняй согласованную пару code/image + Compose/env отдельно от SQL. Старый parser мог трактовать строку `"false"` как truthy: новый Compose с этими flags не доказывает безопасность старого image. Не запускай его автоматически; подготовь совместимый recovery plan или согласованный forward fix.
- В репозитории нет automated rollback/point-in-time recovery/WAL archive/retention или restore validation workflow. Не обещай эти возможности и не выдавай deploy health/backup checksum за подтверждённое восстановление.
