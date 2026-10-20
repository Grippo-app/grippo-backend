# План: португальский pt-BR и pt-PT в Grippo

Дата: 2026-10-20. Версия: второй проход по backend, admin и mobile.
Статус: backend локально реализован и проверен; mobile/admin переданы отдельными
prompts. Переводы упражнений v2 подготовлены приватно, неоднозначности разобраны
и обе локали повторно проверены offline; запись
контента и production выпуск отложены. Push/commit не выполнялись.
Фактические результаты: [portuguese-rollout.md](portuguese-rollout.md).
Задачи, зависимости и проверки: [todo.md](todo.md).

## Границы и рабочие решения

Пользователь подтвердил оба варианта португальского. План покрывает backend,
редактирование пяти языков в admin и полный португальский UI mobile.
Admin interface остаётся английским; переключатель там выбирает язык контента.
Новый language picker, настройка locale профиля, перевод исторических имён и
новые таблицы переводов справочников не требуются.

Для исполнимости фиксируются следующие рабочие defaults. Это решения плана,
а не утверждение, что пользователь отдельно выбирал каждое правило:

- Storage/write IDs: `en`, `ua`, `ru`, `pt-BR`, `pt-PT`; DEFAULT_LANGUAGE = en.
- `pt-PT` — европейский вариант; bare pt и остальные pt-регионы — бразильский.
  Это согласуется с двумя mobile resource sets: Brazilian `values-pt`,
  European `values-pt-rPT`. Отдельный третий generic-перевод не нужен.
- Header negotiation учитывает q; row/field fallback остаётся нынешним best effort.
- Backend защищает новые переводы от старых PUT и устаревших форм через revision
  текстового снимка; скрытого merge отсутствующих полей не вводится.
- Mobile хранит один каталог: при смене языка refetch с защитой от старых ответов.
  Offline сохраняет последний успешный каталог, который может быть на прежнем
  языке. Многоязычный offline cache/Room migration в этот выпуск не входят.

## Что действительно проверено

Backend HEAD `6529cacf2cac9ba16d23a33074ab584c3bb03784`; до подготовки плана
tracked/untracked diff был пуст. Собственные изменения после реализации: backend код, инструменты, existing tests и документация.

После прямого подтверждения пользователя прочитана production БД проекта
`/home/ubuntu/grippo-backend`. SSH использовал существующий ключ и строгую
проверку known_hosts с совпавшим fingerprint. Production checkout:
`1e62040fe1191511c8512f7fdc439a9ee6f469d2`, tracked diff пуст. Разница этих
backend revisions относится к документации/инструментам диагностики; четыре
проверенных source hashes Compose/DatabaseService/i18n.types/translation entity
совпали. Это не attestation всех файлов работающего image.

Подтверждено совпадение endpoint, database/role/credentials и Compose project
между backend и DB containers. PostgreSQL 15.5; принудительный read-only и
ROLLBACK. Production synchronize/migrationsRun отключены. Значения секретов,
тексты SQL rows и пользовательские данные не выводились; dump/deploy/import/
restart не выполнялись. Это metadata-проверка этапа планирования. Для подготовки
offline переводов 2026-10-20 каталог отдельно повторно прочитан в READ ONLY с
ROLLBACK; source hashes и результат описаны в
[контентном разделе отчёта](portuguese-rollout.md#переводы-подготовлены-offline).

| Production данные на момент чтения | Количество |
|---|---:|
| Упражнения с непустыми base name/description | 224 |
| Полные строки en / ua / ru | 224 / 224 / 224 |
| Переводы всего | 672 |
| Duplicate pairs / orphan rows / упражнения без переводов | 0 / 0 / 0 |
| Мышцы / группы мышц | 21 / 6 |
| Оборудование / группы оборудования | 45 / 5 |

Actual language type: `public.supported_language_enum` с en/ua/ru.
Единственный найденный table-column consumer — translations.language.
Actual UNIQUE: `uq_exercise_example_translations_language(exercise_example_id, language)`.
До реализации [entity](../src/entities/exercise-example-translation.entity.ts) не
описывала этот enumName и UNIQUE. Сейчас оба заданы явно; production не менялась.

Дополнительно read-only исследованы:

- `/Users/maxvoitenko/Projects/Pet/grippo-admin`: HEAD `7627a9148a0fc5673d0b218958beb060ca3f4c6d`,
  исходно `?? tasks/`; чужие файлы не менялись.
- `/Users/maxvoitenko/Projects/Pet/grippo-mobile`: HEAD `c9fe8f1192d21ccc61d59cbe49fc957ca28e581e`, clean.
  Compose/resources 1.12.1, Kotlin 2.4.20, AGP 9.3.3 по version catalog.

## Уточнённый объём контента

- Упражнения: **448 новых rows**, по name/description в каждой — **896 значений**.
  При неизменном каталоге итог — 1120 rows. Перед импортом пересчитать ID set.
- Mobile: текущие values/values-uk/values-ru содержат по **786 одинаковых string keys**.
  Два португальских набора — **1572 значения**, включая все 77 справочных названий,
  equipment hints, onboarding, ошибки, goals и прочий UI. Это baseline key count:
  перед переводом проверить актуальные keys/placeholders.
- Mobile берёт справочные titles по `type → Res.string`, а не из server name.
  Новые DB tables/154 отдельных DB labels для этих справочников не нужны.
- Перевод — две региональные редакции с глоссарием и языковым ревью. Исходные
  тексты БД и private datasets не помещать в Git, fixtures и отчёт. В Git допустимы
  новые mobile UI resources; это не копии SQL rows.

## Backend: точный контракт языка

[Текущий путь](../src/i18n/exercise-example-i18n.service.ts): Accept-Language →
[LanguageMiddleware](../src/i18n/language.middleware.ts) → req.locale → чтение
каталога/тренировок. До реализации простое расширение allowlist не распознавало
mixed-case pt-BR/PT; helper также выбирал язык по чужому региону (fr-UA → ua).
Реализованы явные language aliases без Intl.maximize и следующий контракт.

1. Array header объединяется запятыми. Locale: trim, `_ → -`, case-insensitive
   lookup, структурный разбор Intl.Locale. en-* → en; ru-* → ru; ua-*/uk-* → ua.
   Другой primary language никогда не выбирается по региону.
2. Bare pt/pt-script — range BR/PT с предпочтением BR. Явный регион PT → PT;
   любой другой явный pt-region → BR. Extension subtags не меняют этот выбор.
3. q отсутствует → 1; q case-insensitive, строгий 0..1 с максимум тремя decimals.
   Malformed member, invalid/duplicate q или неизвестный parameter пропускается
   целиком без HTTP 400. Пустые members пропускаются.
4. Для каждого candidate выбирается самое specific совпадение: explicit pt-region
   > bare pt > wildcard; primary aliases en/ru/ua/uk > wildcard. При одинаковой
   specificity duplicate q=0 доминирует, иначе max q, затем исходная позиция.
5. Среди candidates с q>0 выбрать max q, затем позицию governing range, затем
   стабильный порядок allowlist. `*` соответствует всем пяти языкам.
   Если кандидатов нет — en, без нового 406.
6. Это алгоритм Grippo, не буквальная реализация RFC lookup. q=0 ограничивает
   выбор requested locale; последующий en/base fallback может его не учитывать.
   Переводчик по-прежнему получает один выбранный locale.

| Header | Requested locale |
|---|---|
| empty / malformed / unsupported / fr-BR / fr-UA | en |
| pt-BR / pt-br / pt_BR / pt-Latn-BR / pt / pt-Latn / pt-AO | pt-BR |
| pt-PT / pt_PT / pt-Latn-PT | pt-PT |
| uk / uk-UA / ua-UA | ua |
| ru-Cyrl-UA | ru |
| pt-BR;q=0.3,pt-PT;q=0.8 | pt-PT |
| pt-PT;q=0.8,pt-BR;q=0.8 | pt-PT |
| pt-BR;q=0,pt;q=1 | pt-PT |
| pt;q=0,pt-BR;q=1 | pt-BR |
| en;q=0,*;q=1 | ua |
| *;q=0,pt-PT;q=0.5 | pt-PT |
| *;q=0 | en, deliberate fallback |
| pt-BR;q=bad,pt-PT;q=0.8 | pt-PT |
| pt-BR;q=0,pt-BR;q=1,ru;q=0.5 | ru |

Write API остаётся строгим: pt-BR/PT допустимы, pt/pt-br/pt_BR/uk → 400.
Сохраняются row fallback direct → en → base и field fallback: null direct field
берётся из base; пустая строка при чтении сохраняется. Соседний вариант PT/BR
автоматически не подставляется. Raw admin GET отдаёт сохранённые rows без fallback.

Для пяти локализованных read paths добавить `Vary: Accept-Language` с сохранением
существующего Vary: catalog list/detail, trainings list/detail, admin user trainings.
Content-Language не вводить: ответ может содержать смешанный fallback/user text.
HTTP fixtures подключают реальные middleware/i18n и stub feature services.
До реализации admin specs проверяли body/Swagger; теперь они покрывают все пять
локализованных read paths.

## Защита admin PUT от потери новых переводов

[Backend PUT](../src/modules/exercise-examples/exercise-example.service.ts)
полностью заменяет translations/refs/bundles и заново вычисляет base из en/первого
текста. Нынешний admin с работающим raw endpoint **отклоняет неизвестные языки**;
он может заблокировать редактирование после импорта. Старые версии, открытые
drafts и legacy 404 fallback остаются риском потери/подмены текстов.

Фиксируется узкая conditional optimistic concurrency без DB version column:

- Raw GET возвращает `translationsRevision`: SHA256 UTF-8 JSON tuple
  `["grippo.exercise-translations.v1", exampleId, [baseName,baseDescription], rows]`,
  где rows — отсортированные по canonical language tuples `[language,name,description]`.
  Различать null/empty/missing row; не trim/normalize и не включать IDs/timestamps
  дочерних rows/порядок загрузки. Один ответ содержит и тексты, и revision.
- Новый update-only DTO наследует create fields и принимает optional lowercase
  hex64 revision. Null/empty/non-string/malformed → 400; POST это поле отклоняет.
  Извлечь revision до Object.assign(rest) в service.
- После parent FOR UPDATE читать свежие base/rows через transaction manager.
  Любой переданный token сравнивается. Если в БД уже есть BR/PT либо вход задаёт
  непустой BR/PT текст, matching revision обязателен. Missing/mismatch → HTTP 409,
  JSON code `EXERCISE_TRANSLATIONS_STALE`, до любых writes.
- Для каждой существующей BR/PT row оба массива обязаны содержать canonical
  entry с explicit string value. Отсутствие/undefined → 409
  `EXERCISE_TRANSLATIONS_INCOMPLETE`. Два explicit empty values означают
  намеренное удаление языка. HTTP guards/DTO validation идут до service:
  malformed token400 может предшествовать404. В service порядок — 404 → STALE → INCOMPLETE.
- Старый three-language PUT без token совместим, пока PT rows/нового PT текста нет.
  Появление новых локалей осознанно требует безопасного редактора.
- Admin нормализует codes без потери case, отправляет все пять `{language,value}`
  entries с explicit `''`, пересылает token исходного raw snapshot. Existing save
  блокируется без доверенного raw ответа, включая 404 fallback.
- На 409 сохранить draft, выполнить сверку с новым snapshot; не подменять только
  token и не повторять старый body автоматически. После 204 применить свежие
  rows+token вместе; при ошибке refetch повторный save заблокирован.
- Admin ExerciseRepository.update сейчас бросает plain Error и теряет status/code.
  Сохранить HTTP status и безопасный JSON code для STALE/INCOMPLETE; malformed error
  body обрабатывается как обычная ошибка сохранения. ApiClient/auth не перерабатывать.

Token защищает текстовое состояние, не весь граф упражнения. Импорт сохраняет
base неизменным; обычный PUT сохраняет прежнюю semantics вычисления base —
не обещать его побайтовую неизменность при synthetic base ≠ en.

## Import и PostgreSQL

Явно описать enumName/именованный UNIQUE в entity. Schema script расширяет
существующий enum через ADD VALUE IF NOT EXISTS в отдельной DDL transaction;
подтвердить COMMIT до использования новых labels. Не запускать synchronize рабочей
БД и не вводить migration framework. Fresh suite не доказывает old → new переход.
До DDL проверить actual type/labels/column/UNIQUE; неизвестная схема другой среды
останавливает script до записи и требует отдельного согласованного преобразования.

Importer: default dry-run, side-effect-free core с переданной connection/manager,
CLI environment loading только при непосредственном запуске. В manifest отдельно:
code revision, dataset SHA256, полный sorted catalog ID set, exact en/base source
hash каждого упражнения, expected-before/desired BR/PT hashes. Content/token hashes
не заменять Git SHA. Dataset валидирует UUID, canonical codes, duplicates, полноту,
строки/формат; одинаковые тексты BR/PT допустимы, различие обязательно только в fixtures.

Под writer freeze и в одной transaction: parent locks всех IDs в стабильном порядке,
повторная сверка ID set/source/expected target, затем только BR/PT parameterized
upsert. Existing другой текст → conflict/abort, если точная замена не предусмотрена
manifest. Совпадение → настоящий no-op с сохранением id/created_at/updated_at.
Импорт не меняет base, en/ua/ru, refs/components/исторические/user данные.
Проверить поздний rollback и оба порядка import/PUT под тем же parent lock.

До writes сохранять private receipt с attempt UUID, identity процесса/DB session
(backend PID + backend_start, transaction identity) и фазой COMMIT. При disconnect
сначала доказать завершение исходной операции/transaction по этой identity.
Пока она running либо завершение не подтверждено, outcome остаётся UNKNOWN:
немедленная read-only сверка может видеть before у ещё не завершённого COMMIT.
Только после доказанного завершения read-only reconciliation всей партии по
expected-before/desired hashes/counts классифицирует before, after либо mismatch.
Проверить synthetic delayed COMMIT: до завершения даже before считается UNKNOWN.
Ошибку клиента не считать откатом, blind retry запрещён. Good backup сохраняется;
новая production запись требует отдельно разрешённой попытки.

## Mobile: ресурсы, effective locale и кэш

`grippo-mobile/data-services/backend/.../client/BackendClient.kt`
уже передаёт полный OS tag. Android composable учитывает per-app/config locale,
а HTTP current() пока читает Locale.getDefault: объединить источник effective
locale, не добавляя новый picker. На iOS учитывать foreground/active.

Добавить values-pt и values-pt-rPT с полным key/placeholder parity и iOS declarations
pt-BR/PT. Эти qualifiers/fallback проверены по cached Compose resources 1.12.1.
`AppTheme(localeTag)` сам ресурсы не переключает: параметр ResourceProvider unused;
проверить фактический OS/per-app resource selection на Android/iOS.

Room хранит один name/description по ID. На старте/foreground/смене effective locale
каталог должен считаться stale и обновляться целиком. Зафиксировать locale/refresh
поколения перед запросом; header и cache tag должны относиться к одному значению.
Устаревший ответ после EN→BR→PT не записывает snapshot и не перестраивает поиск.
Offline/failed refresh сохраняет последний успешный каталог и оставляет refresh
pending. Смена locale на пустом/существующем cache, relaunch и оба порядка ответов
входят в acceptance. Historical Exercise.name не переписывать; проверить nested
exerciseExample.name в карточках и завершённых тренировках.

## Выпуск и recovery: порядок неизменяемых gates

1. Актуальный preflight: target/root/revisions/images/schema/source hashes,
   ресурсы host, private storage, согласованная остановка всех writers/clients.
2. Новый успешный штатный scripts/dump.sh **старой системы до первого DDL и live
   upload**; snapshot/latest/recovery copy непустые и совпадают по checksum/size.
   Сохранить эту pre-schema good copy независимо от последующих backups.
3. Отдельно разрешённый additive schema change и подтверждённый COMMIT.
4. Разрешённый live upload/backend deploy. Каждый deploy attempt требует своего
   human permission и собственного нового dump внутри deploy helper.
5. Совместимый admin с token flow → разрешённый private import → data/API smoke →
   снятие freeze по согласованному шагу → включение mobile клиента/проверка ресурсов.

Прежний mobile уже посылает системный pt-tag: после включения backend/content он
сможет получить португальский каталог при ещё прежнем UI. Полный португальский UI
требует обновления mobile; атомарное обновление всех установленных клиентов
не обещается, дополнительный version/feature flag в этот план не включён.

Production data/schema operations не входят в обычный deploy. Конкретные revision,
команды, backup paths, content hashes и attempt IDs заполняются после реализации,
до запроса финального разрешения. Сейчас ничего из этого не выполняется.
Rollback/restore/retry отдельно разрешаются; enum labels автоматически не удалять,
новый backup изменённой/повреждённой БД не заменяет good pre-schema copy.
[Обязательная deployment policy](../.agents/skills/grippo-operations/references/deployment-policy.md).

## Проверки и готовность

Baseline backend ДО реализации на 2026-10-20: safe typecheck PASS; discovery 2 specs; Jest 86/86
PASS после разрешённого loopback запуска (первый sandbox запуск дал listen EPERM);
PostgreSQL guards 5/5 PASS. Полная `npm run test:postgres` — NOT_RUN: executable
postgres/initdb/pg_ctl major 15 отсутствуют, команда завершилась exit 1 до создания
кластера. Ничего не устанавливалось и к чужой DB suite не подключалась.

После реализации: Node20.20.2 typecheck/Jest233 PASS, PG15.5 suite47/47 PASS с cleanup,
guards7/7 PASS; native runtimes предоставлены временно вне checkout. API/i18n и
tooling/schema/guards одобрены разными независимыми reviewers.
Для повторов SQL suite использовать проверенный native PG15 directory через --pg-bin.
После changes — safe typecheck, existing Jest, guards и полная PostgreSQL suite,
отдельные synthetic old-schema/import/token/concurrency cases, cleanup. Установить
также результат Intl matrix на целевом Node20, а не только local Node22/ICU78.
Admin: existing npm test/build и synthetic UI round-trip. Mobile: разрешённые
Gradle Android/iOS checks по его rulebook и OS/per-app/cache smoke.
Клиентские builds/tests в этой задаче не запускались. Новая постоянная backend
spec/инфраструктура не добавляется: расширяются существующие tests/scenarios.

Backend и клиенты имеют отдельные срезы/ревью; после изменения общего контракта
проверить всех трёх потребителей. Backend-часть этого плана выполнена локально;
production готовность требует фактических code/content/test artifacts и отдельного
разрешения. Повторное language review обеих локалей и независимая проверка всех
изменённых полей выполнены агентами; отдельное участие носителя языка не заявляется.

## Первичные внешние справочники

- [HTTP language preferences и Vary](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5).
- [Language lookup](https://www.rfc-editor.org/rfc/rfc4647.html#section-3.4):
  проектные alias/region/duplicate defaults выше задаются отдельно.
- [PostgreSQL 15 ALTER TYPE](https://www.postgresql.org/docs/15/sql-altertype.html):
  новые enum labels используются после завершения добавляющей transaction.
