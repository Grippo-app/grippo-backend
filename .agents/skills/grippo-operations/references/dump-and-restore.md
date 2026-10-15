# SQL artifact и план восстановления

Источники: [dump.sh](../../../../scripts/dump.sh), [deploy.sh](../../../../scripts/deploy.sh), [entities](../../../../src/entities/), [DatabaseService](../../../../src/database/database.service.ts). Artifact path — `scripts/dump.sql`; открывать его целиком для анализа архитектуры не требуется.

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
- TypeORM synchronize может изменить импортированную schema. Перед его разрешением
  нужен schema-only diff на изолированной DB, включая совместимость rollback code.

## Что dump сохраняет и чего не подтверждает

`pg_dump -F p --inserts --no-owner --no-privileges -b` сохраняет plain SQL выбранной DB, schema/data и доступные large objects. Нет `--schema-only`, compression, encryption, checksum или exclusion приватных таблиц. `psql` — правильный importer для этого формата. `pg_restore` ожидает другие archive formats.

Не включены отдельные backup cluster roles/globals, другие DB, Docker volume filesystem snapshot, приложение, env/private keys, registry images или server config. Credentials/ACL нужно обеспечить отдельно, без копирования секретов в repo. Непустой snapshot может быть partial; exit code, последующая latest copy и restore drill нужны как независимые доказательства.

## Изолированная restore procedure: предложение, не встроенный script

Применяй только если пользователь действительно запросил backup/restore rehearsal и определена допустимая целевая среда. Запрос на skills/audit такой запуск не подразумевает.

1. Зафиксируй source snapshot, timestamp, checksum и валидность dump exit code. Не выводи payload. Сохрани исходный latest отдельно до эксперимента; не используй target production volume.
2. Выбери disposable DB/Compose project/ports и учётную запись с нужными правами. Убедись, что внешняя/production DB не выбрана через POSTGRES_HOST или container name. Подготовь конфигурацию с отдельными данными; не редактируй production `.env` для удобства.
3. Подними только DB и дождись фактической readiness. Backend пока не запускай, чтобы избежать synchronize и запросов одновременно с импортом.
4. Подготовь чистую schema в выбранной disposable DB; destructive reset разрешён только в этой среде. Импортируй plain SQL через `psql -v ON_ERROR_STOP=1 --single-transaction` с контролируемыми credentials. Это предлагаемые flags, в текущем deploy import ON_ERROR_STOP отсутствует.
5. Проверь exit code, schema-only inventory, constraints, ожидаемые table counts и referential integrity без вывода пользовательских строк. Проверки бизнес-инвариантов согласуй с domain owner: сортировка exercises/iterations, profile ownership, goal uniqueness, components, translations.
6. Сравни imported schema с current entities перед разрешением synchronize. Если нужно проверить startup, используй только эту disposable DB и явно управляемую конфигурацию; generic ConfigService type не гарантирует boolean parsing.
7. Проверь выбранные API через синтетические данные, без production tokens. `/health` не является существующим smoke route. Документируй реальный результат и затем удали только собственные disposable ресурсы, сохранив нужные артефакты/вывод без чувствительных данных.

## Rollback и восстановление после текущего deploy

- Permission, mandatory fresh dump, окно writes и сохранение good copy после
  failure определяются deployment-policy; отдельный dump не разрешает restore.
- После `down -v` старый named volume удалён. Git checkout/revert не возвращает данные; недостающий или stale dump не восполняет новые записи.
- После отдельного `DROP SCHEMA ...` до import прежняя schema уже не является доступным transaction rollback state. `psql -1` для следующего процесса не охватывает предшествующий drop.
- Code rollback может быть несовместим со schema/data нового приложения. Не запускай старый image автоматически поверх неизвестной схемы; подготовь совместимую пару code+data или согласованный forward fix.
- В репозитории нет automated rollback/point-in-time recovery/WAL archive/retention или restore validation workflow. Не обещай такие возможности и не выдавай текущее «Initialization complete» за подтверждённое восстановление.
