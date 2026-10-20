# Задачи: pt-BR и pt-PT

Основание и зафиксированные контракты: [plan.md](plan.md).
Backend-срезы1–4 и7 выполнены локально и проверены. Код/схема production и
переводы в БД не менялись, push/commit не выполнялись. Клиентские срезы5–6 и9–11
переданы отдельными prompts; контент8 подготовлен приватно и проверен offline.
Подробный результат и будущий runbook: [portuguese-rollout.md](portuguese-rollout.md).
Корни: B = grippo-backend, A = ../grippo-admin, M = ../grippo-mobile.
Перед изменением клиента перечитать его AGENTS/CLAUDE и профильные skills.
Один writer у общего файла; catalog.cjs и admin.controller.spec.ts менять последовательно.

## 0. Подготовить проверочную среду

**Описание:** зафиксировать исходный Git state трёх repos и доступные runtimes.

- [x] Предоставлен проверенный native PostgreSQL 15 bin directory для runner;
  используются новые disposable clusters, не рабочая .env/DB/Docker context.
- [ ] Доступны Node20 для целевого Intl matrix и зависимости admin; проверены
  JDK/Android/iOS prerequisites по mobile rulebook без скрытого install/upgrade.
- [ ] Назначены BR/PT редакторы, согласовано private storage dataset и способ его передачи.

**Проверка:** versions; safe typecheck/Jest discovery; npm run test:postgres:guards;
полная npm run test:postgres с --pg-bin, если runtime предоставлен.
**Зависимости:** нет. **Владелец:** verifier/operations. **Файлы:** код не меняется.
Отсутствие PG15 блокирует SQL acceptance, не маскируется другими тестами.

## 1. Backend: canonical locales и negotiation

**Описание:** реализовать полный алгоритм и таблицу выбора из plan.md, без Intl.maximize.

- [x] Пять canonical IDs; pt/PT-region defaults согласованы с mobile values-pt/PT.
- [x] q, wildcard, specificity, duplicates/exclusions/malformed и array headers
  соответствуют матрице; ua/uk aliases работают, fr-UA/fr-BR не выбирают PT/UA.
- [x] Read fallback сохранён; обе региональные строки различимы в synthetic fixtures.

**Проверка:** safe typecheck; одноразовый isolated normalizer/resolver/fallback harness
на Node20 и локальном runtime, без AppModule/БД. Permanent specs не добавлять.
**Зависимости:** нет; Node20 нужен до закрытия acceptance.
**Владелец:** identity. **Файлы B (3):** src/i18n/i18n.types.ts, locale.helper.ts,
exercise-example-i18n.service.ts. Existing DTO/Swagger используют общий allowlist.

## 2. Backend: точная схема и enum transition

**Описание:** отразить actual enumName и UNIQUE и подготовить additive schema script.

- [x] Entity задаёт supported_language_enum и именованный UNIQUE
  uq_exercise_example_translations_language; свежая schema воспроизводит оба.
- [x] SQL расширяет actual enum через ADD VALUE IF NOT EXISTS; DDL COMMIT отдельно,
  перед вставкой BR/PT. Нет synchronize/migration framework/пересоздания live enum.
- [x] Synthetic old en/ua/ru schema → new labels репетирована без synchronize
  перехода; повтор DDL безопасен, старые rows/constraints сохранены.

**Проверка:** metadata/SQLSTATE23505/два языка одного exercise; guards и полная
PostgreSQL suite. Old-schema rehearsal встроить в existing catalog scenarios,
сохраняя ownership runtime. NOT_RUN при отсутствии prerequisite задачи0.
**Зависимости:** 1, 0 для SQL acceptance. **Владелец:** domain/schema.
**Файлы B (3):** translation entity, scripts/sql/add-portuguese-locales.sql (новый),
test/postgres/catalog.cjs; при добавлении cases обновить обе проверки inventory.

## 3. Backend: snapshot revision и защита PUT

**Описание:** реализовать update-only token и conditional guards из plan.md.

- [x] Raw GET возвращает content revision с version/id/base/canonical tuples;
  row-order/child IDs hash не меняют, null/empty/text/row addition меняют.
- [x] Под parent lock через manager проверяется любой присланный token; при
  current PT/incoming nonempty PT token обязателен. STALE/INCOMPLETE409 до writes,
  explicit empty strings разрешают clear; create DTO не принимает token.
- [x] Old3/noPT/noToken совместим; stale pre-import snapshot отклоняется;
  base/весь граф неизменны после409. Token не объявляется версией всего графа.

**Проверка:** synthetic hash tests и existing catalog PostgreSQL scenarios:
оба порядка синтетического PT writer/PUT под parent lock, rollback,
stale token даже без PT, malformed/null token,
partial/null input и explicit deletion. Guards + полная suite + typecheck.
**Зависимости:** 1–2, 0 для SQL. **Владелец:** domain/API.
**Файлы B (5):** exercise-example.service.ts; новый dto/exercise-example-update.request.ts;
dto/exercise-example-translations.response.ts; admin.controller.ts (PUT type/Swagger409);
test/postgres/catalog.cjs. Revision извлечь до rest/Object.assign.

## 4. Backend: HTTP cache contract и existing HTTP/DTO проверки

**Описание:** документировать header/409 и проверить настоящее middleware wiring.

- [x] Локализованные catalog list/detail, trainings list/detail, admin user trainings
  добавляют Vary: Accept-Language, сохраняя существующий Vary; Content-Language нет.
- [x] Existing isolated HTTP app использует реальные i18n/middleware, stub services/
  guards, свежие fixtures на locale; header проходит до всех пяти read handlers.
- [x] Canonical write codes/invalid forms, update-only token400/POST rejection,
  raw endpoint и Swagger пяти codes/409 подтверждены; partial/blank fallback не скрыт.

**Проверка:** повтор discovery/isolation → npm test -- --runInBand и safe typecheck.
Existing admin HTTP specs до реализации не проверяли этот путь; fixture расширена.
**Зависимости:** 1,3. **Владелец:** identity/verifier.
**Файлы B (5):** exercise-example.controller.ts, trainings.controller.ts,
admin.controller.ts; existing admin.controller.spec.ts и exercise-example.request.spec.ts.

## Контрольная точка: backend

- [x] Locale/token/schema/HTTP проверки прошли, SQL transition репетирован.
- [x] Self-review и независимое ревью закрыли findings; PostgreSQL15.5 runtime предоставлен.

## 5. Admin: canonical maps и trusted snapshot/payload

**Описание:** обновить domain-часть редактора для пяти языков и server revision.

- [ ] Общий LANGUAGES содержит canonical BR/PT; lowercasing заменён canonical lookup
  в array/raw normalizers, snapshot validator принимает оба новых языка.
- [ ] Оба write arrays содержат все пять explicit string values, включая '';
  null raw→'', EN required сохраняется. Token берётся из trusted raw response,
  передаётся builder отдельно от пользовательского JSON.
- [ ] Raw snapshot rows/base/revision валидируются вместе; fromEntity/fallback
  не создают доверенный token. ExerciseRepository.update сохраняет HTTP status и
  безопасный code409 вместо plain Error; invalid JSON даёт обычную failed-save ошибку.
  Partial/null/deletion и оба409 покрыты synthetic fixtures, auth flow не меняется.

**Проверка:** existing exercises.test.js; npm test (весь набор).
**Зависимости:** 1,3. **Владелец:** admin/domain.
**Файлы A (5):** src/shared/constants/index.js; ExerciseNormalizer.js,
ExerciseTranslations.js и ExerciseRepository.js в src/domain/exercise/;
tests/exercises.test.js.

## 6. Admin: selector, save lifecycle и stale drafts

**Описание:** добавить BR/PT labels/selector и безопасную работу формы со snapshot.

- [ ] Existing save запрещён без доверенного raw snapshot, включая raw404;
  данные и token относятся к одному чтению. Пять list/detail requests корректно
  обрабатывают loading/error/cancel/unsaved draft; статические three-language notices обновлены.
- [ ] На409 draft сохраняется для сверки, automatic retry с новым token запрещён.
  После204 rows+token перечитываются совместно; failed refetch блокирует следующий save.
  Оба code STALE/INCOMPLETE и обычная failed PUT различаются без повторной отправки.
- [ ] Новый draft/редактирование/null fields/explicit clear/stale до импорта
  проходят реальный synthetic round-trip; старые stored locales продолжают работать.

**Проверка:** существующие async/diagnostics tests; npm test; npm run build;
UI smoke без рабочей DB. Shared/storage assertions обновить по затронутому контракту.
**Зависимости:** 5, backend3–4. **Владелец:** admin/UI.
**Файлы A:** index.html; ExerciseController.js, ExerciseFormView.js;
tests/exerciseAsync.test.js, exerciseDiagnostics.test.js (5 основных).
Дополнительные changed assertions storage/shared и legacy notice в ExerciseTranslations.js
делать отдельным небольшим follow-up с тем же writer, затем повторить весь npm test.

## 7. Importer: dry-run, manifest, конфликтная политика и reconciliation

**Описание:** side-effect-free core и CLI для атомарной загрузки только двух новых языков.

- [x] Dry-run — default; manifest различает code revision, dataset hash, ID set,
  en/base source hashes, expected-before/desired targets. После stable parent locks
  всё повторно проверяется в transaction; production требует реального writer freeze.
- [x] Другой existing target вызывает abort без разрешённого expected replacement;
  совпадение — no-op с сохранением IDs/timestamps. Parameterized writes только BR/PT;
  старые языки/base/refs/history не меняются, поздняя ошибка откатывает всю партию.
- [x] Receipt фиксирует attempt/process/backend PID+backend_start/transaction identity
  и COMMIT phase. При disconnect сначала доказано завершение исходной операции;
  пока running/unconfirmed — UNKNOWN, даже если read-only сверка видит before.
  Затем full-party reconcile различает before/after/mismatch, без automatic retry;
  good backup сохраняется, следующая запись отдельно разрешается.

**Проверка:** existing catalog scenarios вызывают core с owned connection; dry-run/
repeat/conflict/source changed after dry-run/rollback/locks/reconcile. Delayed COMMIT
с наблюдаемым before должен оставаться UNKNOWN до доказанного завершения. Guards + полная
PostgreSQL suite. Здесь повторить оба порядка уже actual importer/PUT;
это интеграционная проверка после задачи3, не её предварительная зависимость.
CLI environment не загружается при import модуля из tests.
**Зависимости:** 2–3; может разрабатываться параллельно admin, применение ждёт5–6.
**Владелец:** domain/data. **Файлы B (3–4):** scripts/import-exercise-translations.cjs
и scripts/internal/exercise-translations.cjs (новые); test/postgres/catalog.cjs;
context.cjs только если требуется узкое разрешение нового source import, без ослабления guard.

## 8. Контент упражнений

**Описание:** две региональные редакции полного актуального каталога, с private manifest.

- [x] Перед переводом повторно прочитан актуальный каталог: 224 UUID × 2 =
  448 полных records/896 значений; ID set и source hashes зафиксированы.
  Перед импортом нужна новая сверка изменений каталога.
- [x] Глоссарий, BR/PT редактура и независимое ревью проверили сохранность смысла
  анатомии, техники, чисел/единиц и вариантов оборудования. В v2 разобраны все
  57 прежних замечаний и дополнительные случаи; уточнена техника 19 упражнений.
  Решения, первоисточники, границы доказательств и точные изменения сохранены приватно.
- [x] В v2 заново прочитаны все 896 полей двух локалей; все 61 изменённое поле
  у 32 упражнений прошло независимую перекрёстную проверку. Итоговая проверка
  закрыла остаточные двусмысленности о положении локтей в обеих локалях.
- [ ] Dataset проходит задачу7 dry-run и disposable import; исходные SQL тексты,
  dataset и per-row manifest не попадают в Git/fixtures/отчёт.

**Проверка:** completeness/duplicates/format/source report + BR/PT language review.
Offline подготовка v2 завершена 2026-10-20: все 448 записей прошли инертный
validateDataset, повторное language review и отдельную проверку итоговой сборки.
Это адресная проверка перевода и отмеченных cues, не полный научный аудит каталога.
Live DB dry-run ещё не выполнен: production enum пока содержит только en/ua/ru.
Набор не импортировался ни в рабочую, ни в одноразовую БД по поручению «без записи».
Постоянный private pack и границы проверки описаны в
[portuguese-rollout.md](portuguese-rollout.md).
**Зависимости:** 1 для codes, 7 для финального dry-run; подготовка параллельна2–6.
**Владелец:** localization/editors. **Файлы:** private datasets/glossary, партии по семействам.

## Контрольная точка: данные и редактор

- [ ] Upgraded admin корректно работает с token и пятью языками.
- [ ] Importer прошёл SQL rehearsal; private dataset/manifest принят dry-run и редакторами.
- [ ] Stale draft до импорта воспроизводимо получает409 без изменения данных.

## 9. Mobile: effective locale и pinned cache writes

**Описание:** согласовать Android locale и прикрепить locale к каждому catalog request.

- [ ] Android current()/composable выбирают primary per-app tag с единым приоритетом;
  HTTP не продолжает брать system locale при выбранном другом app locale.
- [ ] List/detail захватывают effective locale перед запросом и передают explicit
  override единожды в Accept-Language. Обе Room write chains под одним repo Mutex
  проверяют актуальность captured locale; устаревшие ответы не меняют каталог/поиск.
- [ ] Existing Home/detail/training flows сохраняются; nested training DTO не
  перезаписывает каталог отдельным незащищённым writer. Room schema не меняется.

**Проверка:** permitted Android/iOS builds и deterministic delayed-response harness;
per-app/system BR/PT и list↔detail race. Проверить cancellation перед cache commit.
**Зависимости:** 1. **Владелец:** mobile/network+data.
**Файлы M (5):** toolkit/localization/.../AppLocale.android.kt;
data-services/backend/.../client/BackendClient.kt и .../GrippoApi.kt;
data-features/exercise-examples/.../data/ExerciseExampleRepositoryImpl.kt;
data-features/exercise-examples/build.gradle.kts (existing toolkit.localization dependency).

## 10. Mobile: refresh на locale/lifecycle

**Описание:** retained root VM инициирует refresh после auth, на locale change и foreground.

- [ ] Existing LaunchedEffect(systemLocaleTag) и lifecycle onResume сообщают effective
  locale retained VM; callbacks снимаются при destroy. Предыдущая root refresh job отменяется.
- [ ] Desired/successfully-loaded locale и pending refresh ведутся согласованно;
  failed/offline refresh сохраняет cache и допускает retry, после success обновлён поиск.
- [ ] EN→BR→PT→EN, relaunch/foreground/auth transition и тёплый/пустой cache проверены;
  offline старый каталог допускается явно, история/drafts/state/analytics не ломаются.

**Проверка:** Android/iOS lifecycle/cache smoke, delayed responses и cancellation;
никаких новых analytics events или admin-sync действий автоматически не добавлять.
**Зависимости:** 9. **Владелец:** mobile/root.
**Файлы M (2):** shared/.../root/RootComponent.kt и RootViewModel.kt.

## 11. Mobile: две локализации UI

**Описание:** Brazilian values-pt, European values-pt-rPT и platform declarations.

- [ ] Полный актуальный key set (baseline786), placeholder types/order, escaping,
  XML/markup/newlines совпадают; обе редакции просмотрены в интерфейсе.
- [ ] pt/BR/AO выбирают Brazilian, PT/Latn-PT — European; iOS declarations содержат
  pt-BR/PT. Фактический resource selection проверен, unused localeTag не считается proof.
- [ ] Все77 справочных titles, hints, ошибки/onboarding/goals и search diacritics
  корректны; server dictionary names/IDs/type и historical Exercise.name сохраняются.

**Проверка:** XML/key/placeholder parity, BR/PT language review, полные Android/iOS
resource builds + OS locale smoke. Для UI ресурсов нет private SQL dataset.
**Зависимости:** 1 (согласованные defaults); параллельно9–10.
**Владелец:** mobile/resources+localization. **Файлы M (3):**
design-system/resources/provider/src/commonMain/composeResources/values-pt/strings.xml
и values-pt-rPT/strings.xml (новые); iosApp/iosApp/Info.plist.

## 12. Итоговая регрессия и независимое ревью трёх repos

**Описание:** сверить контракт/code/data/client paths после всех локальных изменений.

- [x] Backend typecheck, Jest, guards, полная PG suite/old-schema/import/token cases
  проходят с cleanup; Node20 Intl matrix подтверждена. NOT_RUN остаётся blocker.
- [ ] Admin npm test/build и UI round-trip прошли; mobile Android APK и полный
  iOS XCFramework собраны, locale/cache/foreground/offline scenarios пройдены.
- [ ] Авторский self-review и другой reviewer проверили итоговые diffs относительно
  исходного состояния каждого repo, source/content hashes и закрытие findings.

**Проверка B:** ./node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.build.json;
Jest discovery/isolation → npm test -- --runInBand;
npm run test:postgres:guards; npm run test:postgres -- --pg-bin <absolute-directory>.
**Проверка A:** npm test; npm run build.
**Проверка M:** ./gradlew :androidApp:assembleDebug --console=plain;
./gradlew :shared:assembleSharedDebugXCFramework --console=plain;
permitted-check gate и runtime smoke по mobile rulebook.
**Зависимости:** 0–11; проверки срезов выполнять и до этого этапа.
**Владелец:** verifier + независимые reviewers. **Файлы:** только затронутые existing tests/
records; новая постоянная backend test infrastructure не вводится.

## 13. Подготовить выпуск и выполнить только отдельно разрешённые шаги

**Описание:** заполнить конкретные runtime artifacts и применить порядок из plan.md.

- [ ] Exact target/root/revisions/images/schema/source/content hashes, ресурсы,
  writer control, timeout/storage/recovery commands подготовлены и проверены.
- [ ] Freeze → новый pre-schema dump/recovery → отдельный schema commit → разрешённый
  upload/deploy со своим новым dump → совместимый admin → разрешённый import → smoke.
  Good pre-schema copy не заменяется последующими snapshots.
- [ ] По каждому из пяти языков полные реальные rows (baseline224×5=1120), прежние
  языки/base сохранены, zero duplicates/orphans; реальные fallback не маскируют
  отсутствие BR/PT. Снятие freeze/mobile enablement — только после smoke.

**Проверка:** fresh read-only preflight и backup receipts; отдельно разрешённые
schema/data/deploy attempts; SQL/API/client smoke; явный unknown-commit reconcile.
**Зависимости:** 12 и прямое human permission на конкретные production действия.
**Владелец:** operations + domain + владельцы клиентов. **Файлы:** новый runbook/receipt
в tasks/ без секретов/SQL rows. Revision/attempt/hash заполняются после готового кода;
это намеренный release gate, а не неизвестность архитектуры.

## Критерий завершения

- [ ] Все локальные срезы и независимые reviews завершены, полные проверки актуальны.
- [ ] Контент принят, клиентские ресурсы/редактор/кэш работают по зафиксированному контракту.
- [ ] Production действия отдельно разрешены и подтверждены runtime checks;
  ограничения offline и любые незавершённые gates названы явно.
