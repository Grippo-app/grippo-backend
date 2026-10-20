# Португальские локали: backend handoff и выпуск

Дата: 2026-10-20. Подготовлено локально; push, production DDL, deploy и загрузка
реальных переводов в этой задаче не выполнялись. Mobile/admin передаются отдельным
запускам: [mobile prompt](portuguese-mobile-prompt.txt), [admin prompt](portuguese-admin-prompt.txt).

## Что готово

- en/ua/ru/pt-BR/pt-PT, полноценная negotiation и Vary на пяти read paths.
- Canonical write IDs строгие; headers нормализуются. Явный pt-region PT → PT,
  прочие pt/bare pt → BR. DEFAULT_LANGUAGE=en, прежний en/base fallback сохранён.
- Raw admin snapshot с translationsRevision; update-only DTO и атомарные
  EXERCISE_TRANSLATIONS_STALE/INCOMPLETE409 guards. POST token не принимает.
- Entity описывает actual supported_language_enum и именованный UNIQUE;
  отдельный additive schema script с preconditions/COMMIT.
- Read-only dry-run, private manifest, exact replacement/no-op, receipt и
  reconciliation в [CLI](../scripts/import-exercise-translations.cjs).

Подробный контракт token/fallback/клиентов: [план](plan.md). Код backend готов
к интеграции клиентов; отсутствие BR/PT контента пока даёт ожидаемый en/base fallback.

## Фактические проверки

Node20.20.2: TypeScript noEmit PASS; existing Jest 233/233 в двух suites PASS;
existing PostgreSQL guards расширены до7/7 PASS. Полная suite на новом disposable
PostgreSQL15.5: 47/47 PASS (14identity +33catalog/training), cleanup подтверждён.
Повтор после review включает ошибочный/частичный enum order, actual import/PUT
обе очередности, истинный no-op, поздний rollback и delayed/lost-COMMIT visibility.

Реальные DB rows не использовались в fixtures. Проверки не подтверждают live
rollout/реальные auth guards/OAuth/клиентские builds. Два независимых reviewer
одобрили API/i18n и tooling/schema/guards после исправления findings.

Native PG15.5 собран в /private/tmp/grippo-portuguese-runtime-8hrdrfsp/postgres/bin;
Node20 в /private/tmp/grippo-portuguese-runtime-8hrdrfsp/node-v20.20.2-darwin-arm64/bin.
Это временные проверочные runtimes, не системная установка и не server deployment.
PG source/archive SHA проверен по официальному checksum, Node по official SHASUMS.
Project package/lockfile не менялись.

Структурный `python3 scripts/validate-agent-kit.py` остаётся FAIL: 14 прежних
ссылок выходят за границы repo в неизменённом tasks/exercise-catalog-audit-validation.md.
В изменённых документах новых ошибок валидатора нет; этот прежний дефект не
исправлялся в рамках локалей.

## Граница выпуска

### Переводы подготовлены offline

2026-10-20 каталог ещё раз прочитан с подтверждённой production-цели:
REPEATABLE READ READ ONLY и ROLLBACK, 224 упражнения / 672 исходных en/ua/ru rows.
Все base/en/ua/ru тексты и UUID совпали с исходником v1; актуальные статические
иллюстрации использованы для уточнения setup, без выводов о динамике по одному кадру.
Подготовлены 224 pt-BR и 224 pt-PT записи — 896 полей name/description.

Версия v2 закрывает 57 прежних замечаний к исходникам и дополнительные случаи.
Уточнена техника 19 упражнений; отдельные обобщённые обещания результата заменены
нейтральными формулировками. Для неоднозначного упражнения на запястье явно выбран
редакционный канон радиального отклонения; это выбор согласованной инструкции,
а не доказательство прежнего движения по статическому изображению. Исходные
en/ua/ru и base остаются неизменёнными; утверждённые английские редакционные
ориентиры сохранены отдельно и не выдаются за актуальные DB rows.

Оба редактора заново прочитали все названия и описания своих локалей. Все 61
изменённое поле у 32 упражнений проверено другим редактором; финальная независимая
проверка закрыла остаточные двусмысленности о положении локтей. Набор проходит
инертный validateDataset, полноту UUID/пар локалей, schema, непустые поля,
дубликаты и Unicode. Единственное изменение чисел относительно v1 — удаление
неопределённого угла из двух переводов одного упражнения; прежние три преобразования
единиц сохранены. HTML проверен структурно и на семи сценариях поиска.

Актуальный постоянный private pack v2:
`/Users/maxvoitenko/.grippo-private/portuguese-exercises-2026-10-20-v2-k1b6o20w`.
Внутри: JSON для импортера, HTML EN/BR/PT с редакционными уточнениями и точными
изменениями, оба source snapshots, решения/evidence, авторские и независимые
протоколы, offline QA и content manifest. Dataset file SHA256:
`4cec836959b41ce4862bafe138246e2b458424caf7573f68d52f4f5d1853b376`.
Directory mode0700, files0600; тексты/UUID map в Git не добавлены. Прежний pack v1
`/Users/maxvoitenko/.grippo-private/portuguese-exercises-2026-10-20-d_zqve4g`
сохранён без изменений.

Контент готов к последующим шагам импорта; незакрытых переводческих замечаний нет.
Проверка адресная: полный научный аудит всех упражнений и отдельная редактура
человеком — носителем языка не выполнялись. Content manifest не заменяет live
import manifest/approval. Production enum при чтении всё ещё содержит en/ua/ru;
actual DB dry-run/import не запускались даже на одноразовой БД. Перед будущим
импортом заново проверить sources/ID set, schema и target и пройти gates ниже.
Запись БД, commit, push и deploy этим результатом подготовки не разрешены.

### Code и production gates

Текущий рабочий diff не закоммичен и не отправлен. Перед actual CLI --apply
необходима локально committed ревизия src/scripts и tool paths; push сам инструмент
не требует. Commit/push/release в эту задачу не включены.

Production шаги ниже — runbook, не разрешение. Human approval обязателен для
конкретных host/environment/root/revision/команд/последствий. Все DB writers
включая внешние клиенты останавливаются до первого snapshot и остаются
остановленными до согласованного smoke; PostgreSQL доступна.

До выбора runner проверить Node20, Git и доступность pg из этого checkout.
Наличие этих инструментов на production host или в slim runtime image не
предполагается. Private artifact paths должны быть доступны именно runner:
если backup перенесён, отдельно сохранить original receipt, transfer checksums
и согласованное сопоставление storage paths/source identity.

Порядок:

1. Полный preflight текущей цели: fingerprint, revision/image/schema/DB identity,
   ресурсы/disk, private recovery storage и writer control. Сверить actual DB
   с выбранным SQL connection и rendered Compose; неизвестный target — stop.
2. После согласованного freeze выполнить новый штатный scripts/dump.sh старой
   системы ДО DDL/live upload. Сохранить exact JSON receipt в private directory,
   проверить exit0, snapshot/latest/recovery size+SHA и независимую good copy.
3. Отдельно разрешить и выполнить [schema SQL](../scripts/sql/add-portuguese-locales.sql)
   через psql -X -v ON_ERROR_STOP=1 с явным согласованным private connection selector.
   Script сам выполняет BEGIN/COMMIT. Не оборачивать его во внешнюю transaction и
   не вставлять PT в ту же transaction; подтвердить COMMIT и canonical five labels.
4. Разрешённый live upload/backend deploy по штатной policy, с СОБСТВЕННЫМ новым
   dump внутри каждой deploy attempt. Сохранить исходную pre-schema good copy.
   Никакого synchronize/reset/volume recreation/import внутри обычного deploy.
5. Обновить admin по новому token контракту и проверить synthetic round-trip.
   Старые drafts требуют reload/reconcile; missing/unknown snapshot блокирует save.
6. Сверить подготовленный BR/PT dataset с актуальным каталогом, обновить тексты
   при изменении sources/IDs и пройти actual DB dry-run ниже.
   Если редактура длится долго, не держать freeze всё это время: подготовить
   новый согласованный import window с новым backup/source preflight перед apply.
7. После отдельного разрешения — exact apply, data/API smoke, затем согласованно
   снять freeze и выпускать mobile. Проверить актуальный catalog count ×5,
   реальные полные rows каждого языка и сохранность старых языков/base/истории.

[Deployment policy](../.agents/skills/grippo-operations/references/deployment-policy.md)
имеет приоритет над краткими примерами. Код/schema rollback, restore и retry
после сбоя требуют отдельного разрешения; enum labels автоматически не удаляются.

## Private dataset и connection

Создать согласованный private directory вне checkout/build context, mode0700;
JSON files mode0600, regular/non-symlink, без hardlinks. Не помещать их в Git.
Connection JSON содержит явные host,port,database,user,password,ssl; ssl задаётся
явно false/true либо {rejectUnauthorized:true,ca:...}. .env/PG* defaults не используются.
Секреты не указывать в argv, логах, prompts или этом документе.

Dataset JSON: {version:1,records:[...]}.
Каждая record имеет ровно exerciseExampleId,language,name,description.
ID — lowercase UUID; language — только pt-BR/pt-PT; оба текста непустые Unicode
строки без NUL (до100000 UTF8 bytes на поле). Все актуальные упражнения должны
иметь обе records; duplicates/неполный каталог/неизвестные IDs отвергаются.
Исходные английские тексты/ID map получать только в разрешённом private workflow,
не через stdout SQL rows. Baseline каталога224 означает448records, но count
нужно пересчитать. Глоссарий/редактура относятся к оставшейся контентной работе.

CLI не требует искусственного различия BR/PT текстов, не trim-ит сохранённый
контент. Manifest фиксирует exact bytes/hashes, изменения sources/IDs/targets
после dry-run приводят к отказу до записи. Code revision и content hashes —
разные поля. Для точной замены существующего PT дополнительно перед dry-run
нужен private replacements JSON array из exerciseExampleId,language,
expectedBeforeSha256,desiredSha256; лишнее/неточное разрешение отвергается.

## CLI команды

Все paths ниже — заполнить согласованными ABS private paths; FULL_SHA — ревизией
проверенного checkout. Каждая запись ниже отдельно разрешается, команды сейчас
не запускались на рабочей DB. --help безопасен без конфигов и подключения.

```sh
node scripts/import-exercise-translations.cjs --help
```

Dry-run создаёт НОВЫЙ manifest и открывает read-only transaction:

```sh
node scripts/import-exercise-translations.cjs \
  --connection '<ABS_PRIVATE_CONNECTION_JSON>' \
  --dataset '<ABS_PRIVATE_DATASET_JSON>' \
  --manifest '<ABS_NEW_PRIVATE_MANIFEST_JSON>' \
  --code-revision '<FULL_SHA>'
```

CLI печатает только mode/counts/hashes. Manifest содержит codeRevision,
content datasetSha256, toolSha256, catalogIds, exact en/base source hashes,
expected-before/desired PT hashes и actual SQL target identity.

Перед apply создать private approval JSON с полями:

- attemptId: новый UUIDv4; targetLabel и approvalReference: понятная ссылка
  на конкретное человеческое разрешение (никаких credentials).
- manifestSha256 = core.hash(parsed manifest); toolSha256 = manifest.toolSha256;
  target = manifest.target; writersFrozen = true.
- backupReceipt: ABS path оригинального/проверенно перенесённого dump receipt;
  backupReceiptSha256: SHA256 ЕГО FILE BYTES;
  backupSourceSha256 = core.hash(parsed receipt.source).
- backupDatabaseIdentity = manifest.target; backupSourceVerified = true только
  после actual Docker/dump → SQL DB mapping preflight. Flag не доказывает этот факт.

core.hash — SHA256(JSON.stringify(value)), экспортирован из inert
scripts/internal/exercise-translations.cjs; копировать parsed objects без
изменения key order. Нельзя путать object hash и byte hash receipt.
CLI проверяет реальные три backup artifacts: size/checksum/private regular files,
независимые inodes, recovery вне checkout. Он не доказывает восстановимость
и не заменяет human permission/source mapping/фактический freeze.

```sh
node scripts/import-exercise-translations.cjs \
  --connection '<ABS_PRIVATE_CONNECTION_JSON>' \
  --dataset '<ABS_PRIVATE_DATASET_JSON>' \
  --manifest '<ABS_APPROVED_PRIVATE_MANIFEST_JSON>' \
  --code-revision '<FULL_SHA>' \
  --apply --approval '<ABS_PRIVATE_APPROVAL_JSON>' \
  --receipt '<ABS_NEW_PRIVATE_ATTEMPT_JSONL>'
```

Receipt создаётся эксклюзивно, append+fsync; attempt нельзя переиспользовать
или удалить ради обхода. Manifest/core проводят recheck под parent locks в
стабильном порядке, затем атомарно меняют только BR/PT. Совпадение — no-op
с сохранением IDs/created_at/updated_at. Implicit replacement не выполняется.

## Сбой и reconciliation

После disconnect не предполагать rollback, не повторять apply и сохранять good
backup. Observer connection отдельная и exclusive, к той же DB/role/instance,
которые зафиксированы в manifest. --reconcile сначала проверяет
identity и завершение исходной session/transaction, затем открывает новый RR
snapshot; до подтверждённого завершения before-state означает UNKNOWN.

```sh
node scripts/import-exercise-translations.cjs \
  --connection '<ABS_PRIVATE_OBSERVER_CONNECTION_JSON>' \
  --dataset '<ABS_SAME_PRIVATE_DATASET_JSON>' \
  --manifest '<ABS_SAME_PRIVATE_MANIFEST_JSON>' \
  --code-revision '<SAME_FULL_SHA>' \
  --reconcile --receipt '<ABS_EXISTING_PRIVATE_ATTEMPT_JSONL>'
```

APPLIED/NOT_APPLIED/NO_CHANGE — после доказанного завершения и full-party сверки;
UNKNOWN/MISMATCH возвращают exit2 и требуют диагностики. Невозможность проверить
identity после server restart не разрешает объявлять before или повторять запись.
Любой новый write attempt/recovery — новое конкретное human permission.

## Отступление при проверке данных

Один слишком широкий локальный поиск независимого reviewer вывел catalog
translation rows/DDL из существующего дампа. Поиск прекращён, далее использовались
только точные source paths; по видимому результату users/auth rows не затронуты.
Содержимое не повторяется и в changelist/fixtures/этот документ не переносилось.
