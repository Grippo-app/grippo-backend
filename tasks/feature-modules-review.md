# Ревью feature-модулей, 2026-10-16

Актуальное продолжение: [реальный PostgreSQL](#третий-проход-реальный-изолированный-postgresql).
Первый changelist и его проверки ниже сохранены как история.

## Цель и границы

Проверить feature-модули Grippo: корректность, ownership, транзакции,
валидацию, запросы, читаемость и контракты. Подготовить локальный changelist
подтверждённых исправлений и отдельно перечислить рекомендации.
Без commit, push, deploy, SSH, подключения к рабочей БД и изменения схемы.
Не добавлять постоянные tests/инфраструктуру.

Исходный tracked diff пуст. Пользовательские untracked `.DS_Store`,
`scripts/.DS_Store`, `scripts/dump.sql` сохраняются; содержимое дампа не читается.

## Ownership и порядок

1. `audit_auth`: auth/services и связанные auth entry points — аудит,
   подтверждённые fixes, offline fixtures, self-review.
2. `audit_trainings_metrics`: trainings, exercise-metrics и entities
   trainings/exercises/iterations — аудит, fixes, fixtures, self-review.
3. `audit_catalog`: exercise-examples, dictionaries, i18n, muscles entity —
   аудит, fixes, fixtures, self-review.
4. Основной агент: users/profile/goals/exclusions, weight-history, push-tokens,
   интеграция и этот документ.
5. Другие reviewers после self-review проверяют актуальный diff и закрывают
   замечания; безопасные проверки повторяются после исправлений.

## Критерии готовности

- Каждый fix связан с подтверждённым сценарием и минимален по scope.
- Сохраняются owner predicates, DI, публичные успешные ответы и схема БД.
- Изменения негативных ответов/валидации явно перечислены.
- Есть свежий type check, существующие изолированные tests и целевые fixtures.
- Проверены финальный diff и независимые review; ограничения указаны честно.

## Исходные проверки

- TypeScript noEmit: PASS.
- Discovery: найдены два существующих spec-файла, без AppModule/БД.
- Jest в sandbox: loopback `listen EPERM`; после разрешения loopback PASS,
  2 suites / 86 tests.

Во время работы появились сторонние operations-изменения Docker/Compose,
scripts, AGENTS/README, operations skill/agent profile и отдельный документ
deployment-hardening. Они сохранены и исключены из этого changelist и его
проверки, включая `src/app.module.ts`, `src/main.ts`,
`src/database/database.service.ts` и новый `src/modules/health`.
Операционные scripts не выполнялись.

Применялись профильные skills `grippo-orchestrator`, `grippo-architecture`,
`grippo-domain-data`, `grippo-identity-api`, `grippo-review`,
`grippo-verification`, а также `code-review-and-quality`,
`incremental-implementation`, `verification-before-completion`.
Участвовали семь делегированных агентов: три автора/аудитора, два независимых
reviewers, архитектор и verifier; интеграцию выполнял основной агент.

## Локальный changelist

Объём этого среза: 17 исходных файлов, +180/−92 строки, плюс этот отчёт.

- Auth: [service](../src/modules/auth/auth.service.ts),
  [tokens](../src/modules/auth/services/token.service.ts),
  [Apple](../src/modules/auth/services/apple-auth.service.ts).
- Trainings: [controller](../src/modules/trainings/trainings.controller.ts),
  [service](../src/modules/trainings/trainings.service.ts),
  [request](../src/modules/trainings/dto/trainings.request.ts).
- Numeric hydration: [iterations](../src/entities/iterations.entity.ts),
  [exercises](../src/entities/exercises.entity.ts),
  [trainings](../src/entities/trainings.entity.ts),
  [muscles](../src/entities/muscles.entity.ts).
- [Metrics service](../src/modules/exercise-metrics/exercise-metrics.service.ts).
- Catalog DTO: [request](../src/modules/exercise-examples/dto/exercise-example.request.ts),
  [components](../src/modules/exercise-examples/dto/exercise-components.dto.ts).
- Users: [service](../src/modules/users/users.service.ts),
  [profile request](../src/modules/users/dto/create-user-profile.request.ts).
- Weight history: [controller](../src/modules/weight-history/weight-history.controller.ts),
  [service](../src/modules/weight-history/weight-history.service.ts).

| Приоритет | Подтверждённая проблема | Исправление |
|---|---|---|
| P1 | Публичный register назначал пароль существующему social-only аккаунту и выдавал JWT без подтверждения владения | Любой занятый email возвращает существующий 400; пароль и аккаунт не изменяются |
| P1 | Отсутствующий refresh secret в установленном JwtService заменялся access secret; access принимался как refresh | Одна проверка непустых различных secrets перед issuance и refresh; неверная конфигурация даёт generic 500 без значений secrets |
| P2 | Refresh доверял форме payload.id до repository lookup | UUID identity проверяется до запроса; неверный payload даёт прежний refresh 401 |
| P2 | TokenService передавал expiresIn:undefined, ломая предусмотренный module fallback | Access TTL использует существующий fallback `1d` |
| P2 | Ошибка/обрыв Apple response stream оставались необработанными или не завершали Promise | Обработаны response error, aborted и close до end для exchange и JWKS |
| P2 | Nullable decimal превращался в NaN; bestWeight сериализовался как null | Восемь transformers iterations/exercises/trainings сохраняют null; формула и схема прежние |
| P2 | Exercises/iterations неверной формы проходили DTO, затем сервис падал с 500 | Required arrays и object elements проверяются до сервиса; пустые arrays допустимы |
| P2 | PUT training без id мог выбрать произвольную свою тренировку и создать orphan children | UUID pipes для PUT query id и GET/DELETE path id |
| P2 | Проверки training/examples внутри transaction выполнялись через внешние repositories | Соответствующие reads переведены на transaction manager |
| P2 | Четыре запроса достижений гидратировали всю подходящую историю ради одной записи | Добавлен LIMIT 1 с сохранением filters/order; joins проверены |
| P2 | Localized value:null приводил к null.trim(); nested arrays проходили вместо объектов каталога/components | Проверка формы objects; null text отклоняется, omitted/empty string сохраняются; nullable branches components сохранены |
| P2 | Muscle numeric size/sensitivity выдавались строками при обещанном number | Null-safe transformers; тип/точность колонок БД прежние |
| P2 | Scalar exclusion IDs при создании профиля доходили до .map(); weight вне DB CHECK доходил до записи | IsArray и те же границы 30–300, что уже заданы БД |
| P2 | Concurrent createProfile проходил проверку отсутствия дважды | Users row блокируется перед проверкой/созданием profile |
| P2 | Exclusion replace терял старый список при ошибке insert; конкурирующие requests могли смешивать списки | Transaction manager для validation/delete/save и общий profile row lock |
| P2 | Два удаления могли убрать последние две weight rows; обычный Error давал 500 | Count/delete под profile lock в одной transaction; последняя запись защищена ошибкой 400; path id проверяется как UUID |

User/profile/weight transactions явно используют `READ COMMITTED`, чтобы
повторное чтение после ожидания row lock не зависело от default isolation среды.
Откаты и ожидание блокировок на настоящем PostgreSQL ещё не проверены.

## Влияние на контракты

- Существующий social-only аккаунт больше нельзя дополнить паролем через
  публичный register; нужен отдельный authenticated linking/reset flow.
- Неверные/одинаковые secrets блокируют issuance/refresh. Значения реальной
  конфигурации не читались и не проверялись.
  Access strategy не менялся: при одинаковых текущих secrets ранее выпущенный
  refresh всё ещё может пройти как access. Token purpose/revocation не добавлены.
- Malformed nested bodies, неверные/пропущенные обязательные UUID, null localized
  text и profile weight вне 30–300 дают 400 раньше обращения к БД.
- Запрет удаления последнего веса теперь возвращает 400 вместо 500.
- Muscle size/sensitivity возвращаются как number|null вместо фактических
  string|null. Доступные backend consumers проверены; mobile/admin source
  в этой задаче не представлен.
- Components Swagger отражает четыре обязательных nullable ключа.
  Существующие successful statuses/body, ownership, DI tokens, SQL column types,
  enum values, training formulas и клиентские aggregates не менялись.

## Отложенные findings и решения

Эти пункты не исправлены в текущем changelist. Они отделены от регрессий diff.

| Приоритет/статус | Источник | Сценарий и следующий шаг |
|---|---|---|
| P1 в исходном HEAD; параллельная operations правка вне этого review | database/database.service.ts:typeOrmConfig | get<boolean> сохранял env string 'false' как truthy; TypeORM мог запустить synchronize вопреки настройке. Production значения неизвестны. Во время ревью другой участник добавил строгий разбор flags; этот чужой fix здесь не оценивался и в наши APPROVE не входит |
| P2 → ограничен для новых регистраций в проходе 2; legacy остаётся | auth/dto/register.request.ts, lib/hash.ts | Разные пароли с одинаковыми первыми 72 UTF-8 bytes эквивалентны для bcrypt. Одобрен registration byte limit, вход старых пользователей сохранён |
| P2 → исправлен код в проходе 2 | users.service.ts:setGoal | Первое сохранение goal сериализуется profile lock в READ COMMITTED; настоящая PostgreSQL конкуренция ещё не проверена |
| P2 → исправлен в проходе 2 | trainings/dto/trainings.request.ts | DTO ограничен диапазонами существующих int32/numeric columns; 0/negative/null semantics сохранены |
| P2 → исправлен в проходе 2 | trainings.service.ts:fetchTrainingsForProfile | Missing/non-string/empty start/end дают прежний 400; stricter ISO/reversed policy не добавлены |
| P2 → исправлен код в проходе 2 | exercise-example.service.ts:deleteExerciseExample | Parent FOR UPDATE перед manager count/delete в READ COMMITTED; training reader использует KEY SHARE. PostgreSQL waits/FK ещё не проверены |
| P2 → исправлен код в проходе 2 | exercise-example.service.ts:create/update, users.service.ts:createProfile | Неизвестные muscle/equipment IDs отклоняются до writes; manager references KEY SHARE удерживаются до commit |
| Требует identity policy | auth.service.ts:loginWithGoogle/loginWithApple | Совпавший email допускается при уже привязанном другом provider sub. Определить правило linking/conflicting identities |
| Условное усиление, exploit не установлен | common/jwt.strategy.ts:validate | Runtime payload.id не проверяется; id:undefined пропускает predicate TypeORM. Текущая issuance выпускает UUID, произвольный payload требует валидной подписи. Добавить identity check только с проверкой точного guard error/header contract |
| Требует history contract | trainings.service.ts:updateTraining | Полная замена пересоздаёт children UUID/createdAt и влияет на recent/first/lastPerformedAt |
| Требует metric contract | exercise-metrics.service.ts:findLifetimeVolume | sessionsCount считает exercises, включая два одинаковых example в одной training; DISTINCT trainings изменит смысл |
| Требует translation policy | exercise-example.service.ts:prepareTranslationInput | Повтор языка перезаписывает record последним значением, baseValue может остаться от первого; определить duplicates policy |
| Требует locale policy | i18n/exercise-example-i18n.service.ts, locale.helper.ts | Quality q игнорируется; регион de-UA может выбрать ua. Уточнить negotiation/fallback, сохранив storage en/ua/ru |
| P3, измерить | catalog/training queries, users admin list, weight list | Большие join-графы и полные выборки: нужны реальные cardinality/EXPLAIN/latency, затем pagination/indexes или разделение запросов |
| P3, отдельная provider policy | auth/services/apple-auth.service.ts | Network timeout/response size limit по-прежнему отсутствуют; endpoint без завершающих событий может ждать неограниченно |
| P3, упрощение DI | database.module.ts, feature *.module.ts | DatabaseModule уже экспортирует repositories; повторные providers в девяти feature modules можно убрать отдельным срезом. Дополнительных DB connections из-за этого сейчас нет |
| P3, упрощение запросов/читаемости | muscles.service.ts, equipments.service.ts | Обратный join элемента на уже загруженную parent group нужен только ради group.id. Можно брать id текущей группы и удалить лишние joins/injections; скорость не измерялась |

Ревью push registry не выявило подтверждённого дефекта в текущем контракте:
token unique глобально и может переноситься другому user, удаление действует
на текущего владельца. Доставка FCM/APNs и JWT revocation отсутствуют и не
добавлялись. Stateless reuse refresh остаётся существующей политикой.

## Проверки и независимое ревью

Целевые harness хранятся вне репозитория; постоянные specs не добавлены:

- `/private/tmp/grippo-auth-review.cjs`: register/login branches, red HEAD / green fix.
- `/private/tmp/grippo-auth-token-review.cjs`: 9 invalid claim shapes,
  9 invalid configs, настоящая offline подпись/verify, TTL/expiry/user existence.
- `/private/tmp/grippo-apple-response-review.cjs`: red HEAD / 14 green
  response/request/abort/close/JSON/status сценариев.
- `/tmp/grippo-trainings-metrics-review.js`: 20 DTO, 21 UUID,
  36 hydration assertions, 6 metric scenarios, 24 generated SQL,
  5 transaction callback сценариев.
- `/tmp/grippo-catalog-review.js`: 47 DTO cases; дополнительно
  8 driver hydration cases и offline Swagger schema.
- `/private/tmp/grippo-feature-review/profiles.cjs`: red HEAD / green fix
  для profile DTO, replace/clear/insert failure, competing weight deletions;
  явный isolation/owner/lock/manager проверяется в подменах.
- `/private/tmp/grippo-final-verification/create-profile.cjs`: competing callbacks,
  user lock до profile lookup, owner/isolation, missing/existing user/profile,
  propagation ошибки сохранения. Это модель scheduling, не реальная БД.
- `/private/tmp/grippo-final-verification/schema-and-contracts.cjs`: сравнение HEAD
  и current TypeORM Table metadata всех 19 таблиц, включая FK/index/check;
  равенство схемы, 8 muscle hydration, Swagger required/null и 7 weight UUID cases.

Независимые `review_data_changes` и `review_auth_catalog`: APPROVE проверенного
diff, применимых открытых P1/P2 в нём не обнаружили. Узкий повторный data review
после явного isolation: APPROVE, зависимость от неизвестного default закрыта.
Архитектор проверил 10 feature modules, 18 repository tokens/17 injections:
missing registrations нет, imports/exports/guards корректны; отдельные старые
риски и P3 предложения перечислены выше.

Финальный verifier независимо получил PASS: fresh TypeScript noEmit,
discovery двух specs, Jest 2 suites/86 tests после разрешения loopback,
шесть исходных harness и две дополнительные проверки выше.
Scoped `git diff HEAD --check` по 17 файлам и проверка report whitespace,
merge markers, scope и secret patterns: PASS. Подготовлен SHA256 snapshot
этих 17 исходников в `/private/tmp/grippo-final-verification/source-hashes.json`.

Нет утверждения о проверке production, настоящих OAuth, SQL execution,
FK/rollback/lock waits/concurrency или внешних клиентов. DataSource в SQL/driver
fixtures не инициализируется; repositories и внешние providers подменены.

## Второй проход: оставшиеся P2

Запрос пользователя: безопасные исправления выполнить, спорные изменения
контрактов сначала показать. Push/deploy по-прежнему запрещены.

Baseline этого прохода — текущий worktree, сохранённый до правок в
`/private/tmp/grippo-p2-1f2lxipk`, а не HEAD. Предыдущий changelist и параллельные
operations-изменения сохраняются. Root владеет этим отчётом; другие writers:

- `p2_identity`: users.service.ts — first-goal race и profile reference checks.
- `p2_catalog`: exercise-example.service.ts — catalog references и delete race.
- `p2_trainings`: trainings request/service — storage bounds, missing dates,
  KEY SHARE на читаемый example в transaction для согласования с delete lock.

Критерии: сохранить successful responses/owner/историю/схему, показать только
разницу относительно этого baseline, проверить отрицательные и граничные
сценарии, выполнить self-review, независимый review и безопасные проверки.
Постоянные specs не добавляются. Живая БД и внешние providers не используются.

### Спорный P2: длина пароля bcrypt — предложение до применения

Предлагаемый минимальный контракт: новая регистрация принимает пароль не более
72 UTF-8 bytes с прежним минимумом 6 символов. Превышение возвращает 400 до
хеширования. Это позволяет до 72 ASCII-символов; многобайтовые символы достигают
предела раньше. Вход в существующие аккаунты и формат hash не меняются.

Это предотвращает создание новых паролей с молча отброшенным suffix, но старые
пароли длиннее 72 bytes по-прежнему сравниваются по правилам bcrypt. Полное
устранение старой неоднозначности требует отдельного reset/migration flow.

Подготовлен проверяемый candidate вне worktree:
`/private/tmp/grippo-p2-1f2lxipk/register.proposed.patch`.
`password-proposal.cjs` рядом: 12 actual ValidationPipe cases PASS, включая
UTF-8 boundaries и malformed Unicode без 500. В рабочий RegisterRequest
изменение до решения пользователя не вносилось.

Пользователь явно одобрил: «Да, ограничить новую регистрацию 72 UTF-8 байтами».
Применён только этот registration limit; LoginRequest/Hash и существующие
учётные данные не менялись. Риск старых длинных паролей остаётся описан выше.

### Changelist второго прохода

Изменены пять source-файлов, +253/−119 строк относительно сохранённого baseline
этого прохода.
Общий git diff включает также первый changelist и чужую operations работу;
это не объём второго прохода. Incremental patch сохранён вне репозитория:
`/private/tmp/grippo-p2-1f2lxipk/p2-current.patch`.

| Файл / срез | Итоговое поведение |
|---|---|
| [users service](../src/modules/users/users.service.ts) | First-goal read/save выполняются после owner-filtered profile FOR UPDATE в READ COMMITTED. Full replacement, defaults, confidence и lastConfirmedAt сохраняются |
| [users service](../src/modules/users/users.service.ts) | createProfile проверяет muscle/equipment до writes. Unknown refs → прежние users exclusion-тексты 404; дубли, регистр UUID, null/omitted/[] не запрещаются |
| [catalog service](../src/modules/exercise-examples/exercise-example.service.ts) | Create/update batch-проверяют refs через manager с KEY SHARE до mutations; unknown refs →400, missing update target →404. Тело запроса не нормализуется/не дедуплицируется |
| [catalog service](../src/modules/exercise-examples/exercise-example.service.ts) | Update/delete берут parent FOR UPDATE; usage count и delete работают в одной READ COMMITTED transaction. Существующие 404/409/success сохранены |
| [trainings service](../src/modules/trainings/trainings.service.ts) | Example existence reads в create/update берут FOR KEY SHARE до commit; отсутствующий после concurrent delete example даёт прежний invalid-example400 |
| [trainings service](../src/modules/trainings/trainings.service.ts) | Отсутствующий/non-string/null/empty диапазон отклоняется до SQL прежним Wrong date format. Date-only, offsets, прежние валидные форматы и reversed semantics не менялись; admin без profile сохраняет [] |
| [trainings DTO](../src/modules/trainings/dto/trainings.request.ts) | Storage bounds + Swagger: signed int32, volume ±999999999.9, intensity ±999.99, iteration weights ±9999.9, multiplier ±99.99. Более строгих доменных positive bounds нет |
| [trainings DTO](../src/modules/trainings/dto/trainings.request.ts) | Локальная precision validation заменяет падающий IsNumber(maxDecimalPlaces): научная запись малых fractions вроде 1e-7 даёт400 вместо TypeError500, точность 1/2 знака сохранена |
| [register DTO](../src/modules/auth/dto/register.request.ts) | Одобренный пользователем максимум 72 UTF-8 bytes до хеширования. Swagger описывает byte limit; прежний minimum6 сохраняется. Buffer.byteLength не падает на malformed Unicode, в отличие от установленного IsByteLength |

Каталожный insert-first сценарий: training держит KEY SHARE, delete ждёт;
следующий count в READ COMMITTED видит committed usage и возвращает409.
Delete-first: training reader ждёт, затем видит отсутствие example и возвращает
invalid-example400. Внешний writer, обходящий service KEY SHARE, может получить
FK failure. Это вывод по SQL/locking-модели, а не результат live PostgreSQL.

### Проверки второго прохода

- Начальный TypeScript noEmit и discovery: PASS; найдены прежние два specs.
- `/private/tmp/grippo-p2-identity.cjs`: red baseline / green working tree;
  goal concurrency model, defaults/lastConfirmedAt, refs-before-writes,
  дубли/case/null/[], manager/isolation/owner и failure propagation.
- `/private/tmp/grippo-p2-identity-sql.cjs`: шесть actual TypeORM SELECT,
  profile FOR UPDATE без joins и dictionary FOR KEY SHARE; без initialize.
- `/private/tmp/grippo-p2-catalog-check.cjs`: baseline 8/18 +10 expected failures
  → current18/18; generated locks/READ COMMITTED/immediate FK metadata,
  unknown refs, 404/409/success и две модельные race schedules.
- `/private/tmp/grippo-p2-trainings-fixtures.cjs current --expect-fixed`:
  193 DTO, 25 date, 4 manager lock, 13 storage metadata, 13 Swagger checks PASS.
  Baseline:85 ожидаемых воспроизведений. До precision replacement проверены
  3 008 462 совпадения с прежним validator и 1930 old TypeError→false.
- `/private/tmp/grippo-p2-1f2lxipk/password-proposal.cjs`: 12 synthetic
  ValidationPipe cases PASS для baseline/proposal/actual после одобрения;
  значения passwords/hashes не выводятся.

Self-review авторов завершены. `p2_review_data` и `p2_review_contracts`
независимо дали APPROVE по snapshot→current; применимых открытых P1/P2 в этом
diff не обнаружили. Contracts reviewer дополнительно проверил 26 Unicode,
byte boundary, whitelist и unchanged-login случаев, а также 1 200 040 сравнений
фактических precision validators без новых отклонений ранее допустимых чисел.

Независимый `p2_verification` повторно выполнил TypeScript noEmit и discovery,
получил 2 suites/86 tests PASS после разрешения loopback и PASS всех пяти
целевых harness выше. Sandbox EPERM до разрешения loopback не является
дефектом исходников. Baseline hashes сохранены, delta ограничен пятью
назначенными source-файлами; LoginRequest и Hash не менялись. Scoped whitespace
checks относительно baseline и HEAD пройдены.

Проверки реальной PostgreSQL concurrency/FK/rollback и внешних клиентов не
выполнялись. `postgres/initdb/pg_ctl/psql` в PATH не обнаружены; приложение,
БД и сетевые интеграции ради этих проверок не запускались. Старые длинные
пароли требуют отдельной политики reset/migration; новые регистрации уже
ограничены согласованными 72 bytes. Commit/push/deploy не выполнялись.

## Третий проход: реальный изолированный PostgreSQL

Пользователь прямо разрешил проверить реальные блокировки, FK и rollback
на изолированном PostgreSQL; рабочую БД, push и deploy исключил.

### Изоляция стенда

- Точный PostgreSQL **15.5 / server_version_num 150005** собран из официального
  исходника во временном каталоге. SHA256 archive проверен:
  `8f53aa95d78eb8e82536ea46b68187793b42bba3b4f65aa342f540b23c9b10a6`.
- Временный root: `/private/tmp/grippo-pg-integration-ay008qsa`.
  Собственные PGDATA, процесс, SCRAM credentials и socket; TCP только
  `127.0.0.1:58274`. Docker, Homebrew install, рабочие env/DB не использованы.
- До CREATE DATABASE common проверяет private runtime file, PID/datadir/port
  из postmaster.pid, затем фактические PostgreSQL version/data_directory/user
  и loopback address. Несовпадение останавливает стенд до создания схемы.
- Каждая suite получает отдельную новую БД с уникальным именем
  `grippo_test_<suite>_<random>`. TypeORM synchronize разрешён только для неё;
  DB удаляется в finally. SQL logging выключен, query/lock/transaction waits
  ограничены timeout. Рабочие AppModule, ConfigModule и database bootstrap
  не загружаются; services используют реальные TypeORM repositories.
- Создаются все 19 таблиц из текущих entities с SnakeNamingStrategy.
  Отличие стенда: UUID default использует встроенный PG15 gen_random_uuid(),
  extension installation отключена; uuid-ossp не собирался. Это не проверка
  установки production UUID extension. Типы колонок, FK/check/unique и
  транзакционные запросы сервисов настоящие.

Агенты: `pg_isolation` владел runtime; `pg_identity_cases` и
`pg_catalog_cases` писали отдельные временные suites; `pg_independent_review`
независимо прочитал стенд/код и повторил проверки. Root владел common,
изменением entity и этим отчётом. Постоянные specs/инфраструктура не добавлены.

### Найден и исправлен новый P2

[GoalsEntity.personalizations](../src/entities/goals.entity.ts) объявлял empty
enum-array default функцией, возвращающей SQL. Установленный TypeORM обрабатывает
enum раньше function-default и экранировал текст функции как строку.
Реальное CREATE TABLE завершалось **SQLSTATE 42601**.

Минимальное исправление: `default: []`. TypeORM использует предусмотренную
ветку array-default и создаёт корректный пустой enum-array. Смысл поля, enum,
nullable и HTTP contract сохраняются. Это единственное изменение source
в третьем проходе: **одна строка** в goals.entity.ts. Рабочая схема не менялась.

Доказательства red/green: metadata DDL ошибки сохранена в schema-error.json;
после исправления свежая схема из 19 таблиц создаётся; настоящая INSERT без
personalizations сохраняет пустой массив с cardinality 0 и гидратируется
TypeORM как `[]`. Независимый reviewer подтвердил причину в установленном
PostgresDriver.normalizeDefault и повторил проверку. Второй schema-builder.log
на созданной схеме: **0 upQueries** в обеих независимых БД.

### Реальные блокировки — 13 сценариев в каждом прогоне

Ожидание проверяется не задержкой, а `pg_stat_activity.wait_event_type=Lock`
и наличием точного holder PID в `pg_blocking_pids(waiter)`. JS-barriers только
останавливают уже выполняющуюся реальную transaction после заданного SQL;
результаты запросов, locks, commit и rollback не подменяются.

| Сценарий | Проверенный результат |
|---|---|
| Два createProfile одного user | Второй ждёт; один success, один400, ровно один profile/initial weight |
| Два первых setGoal | Второй ждёт; оба success, одна goal, сохранены defaults/createdAt |
| Удаление последних двух weights | Второй ждёт; один delete, один400, одна запись остаётся |
| Две замены excluded muscles | Второй ждёт; итог целиком соответствует второму списку |
| Две замены excluded equipments | Та же атомарная замена без смешанного списка |
| Training create → catalog delete | KEY SHARE получен до child/FK insert; delete ждёт и затем409 |
| Catalog delete → training create | Training ждёт, затем400; вся новая training откатывается |
| Training replace → catalog delete | Ожидание и409; ссылки и история согласованы |
| Catalog delete → training replace | Ожидание и400; первоначальная training/children восстановлены rollback |
| Catalog update → delete | Операции сериализуются на parent |
| Catalog delete → update | Update после ожидания404; удалённый parent не создаётся заново |
| Catalog validation → muscle delete | FOR KEY SHARE до save удерживает существующий reference |
| Catalog validation → equipment delete | Та же защита reference до commit |

### FK, ограничения и настоящий rollback

- **15 отрицательных FK-вставок**: 8 identity/profile и 7 catalog/training;
  фактический PostgreSQL SQLSTATE **23503**.
- Два нарушения weight CHECK → **23514**; три нарушения unique constraints
  → **23505**. Проверены фактические FK metadata для десяти catalog/training
  связей, их CASCADE/SET NULL и immediate enforcement.
- Реальное удаление user/profile удаляет связанные записи каскадом; проверено,
  что строки существовали до удаления и несвязанные данные сохраняются.
- Прямой SQL delete catalog обнуляет historical exercise example FK через
  SET NULL, сохраняя саму training/exercise/iterations; catalog children
  удаляются через CASCADE. Service delete отдельно защищает используемый example409.
- **7 поздних SQL-сбоев** внутри настоящих transactions через test-only
  PostgreSQL triggers: 4 identity с P0001 и 3 catalog/training с кодом23514.
  Это управляемые серверные ошибки для проверки отката; отдельные настоящие
  CHECK-нарушения веса проверены выше. Проверены rollback
  exclusions, profile+weight+children, goal, catalog graph, training create
  и replace. Сравнивались исходные IDs, timestamps, порядок, веса/агрегаты
  и все children после отката; строки в outputs/отчёт не выводятся.
- Unknown references отклоняются сервисом с прежними400/404 без частичных writes.

### Результаты и review

- `identity.cjs`: **14/14 сценариев, 112 assertions, exit0**.
- `catalog.cjs`: **18/18 сценариев, exit0**.
- Независимый повтор reviewer на двух новых отдельных БД: ещё **14/14 +18/18**,
  exit0; обе БД удалены finally. Итого32 разных сценария, каждый выполнен дважды.
- `pg_independent_review`: **APPROVE** стенда, проверенного поведения и
  однострочного исправления GoalsEntity; открытых blocking findings нет.
- Fresh TypeScript noEmit: **PASS**. Discovery двух existing specs и
  `npm test -- --runInBand`: **2 suites /86 tests PASS** с разрешённым loopback.
  Scoped `git diff --check` entity: PASS. Остальные проверенные services
  не менялись относительно snapshot начала третьего прохода.

Артефакты вне Git: common.cjs, isolation-smoke.cjs, identity.cjs, catalog.cjs,
isolation-result.json, identity-result.json, catalog-result.json,
native/engine-proof.json в указанном временном root. В них отчётные результаты
содержат только scenario/status/count и metadata, без SQL rows/credentials.

Cleanup **PASS**: перед остановкой 0 тестовых БД и 0 их clients. Остановлен
только собственный процесс; pg_ctl status3, pidfile/socket отсутствуют,
TCP connection refused. Удалены свежий PGDATA и синтетические credentials;
binary/source/harness и обезличенные результаты сохранены. Proof:
`native/cleanup-proof.json` во временном root. Повторный root check подтвердил
отсутствие PGDATA/runtime credentials и неизменность четырёх service-файлов.

Production schema/data, HTTP с настоящими guards, OAuth,
нагрузка, сетевые сбои и все возможные deadlock schedules не проверялись.
Рабочие PostgreSQL/daemon/конфигурация не подключались. Push/deploy не выполнялись.
