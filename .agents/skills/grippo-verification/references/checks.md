# Проверки и границы покрытия

## Доступная инфраструктура

[package.json](../../../../package.json): Jest 29/ts-jest, rootDir src,
testRegex .*\\.spec\\.ts$, node environment. Текущие узкие проверки:
[DTO](../../../../src/modules/exercise-examples/dto/exercise-example.request.spec.ts)
и [AdminController HTTP](../../../../src/modules/admin/admin.controller.spec.ts).
Они проверяют ValidationPipe/controller/Swagger с подменёнными services/guards,
без AppModule/config/БД; настоящую авторизацию и сохранение данных не покрывают.

Перед задачей повторяй поиск specs и читай их окружение. Отдельного e2e entrypoint
нет. ESLint использует `.eslintrc.cjs` без правил форматирования; Prettier config
и CI workflow в checkout отсутствуют. Это не подтверждает отсутствие внешнего/default CI в GitHub.
Постоянная интеграционная БД не предусмотрена. Настоящие SQL/locks/FK/rollback
проверяет отдельная поддерживаемая suite [test/postgres](../../../../test/postgres/README.md)
на автоматически создаваемом локальном PostgreSQL. Jest её не обнаруживает
и не запускает. Наличие packages не доказывает готовую suite. Поддержка этих
существующих regression tests входит в изменение покрытого поведения;
посторонние постоянные specs/инфраструктура — только в разрешённом scope по AGENTS.

## Команды из корня

| Проверка | Команда | Что не доказывает |
|---|---|---|
| Types/imports/decorators | `./node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.build.json` | Поведение DI/HTTP/SQL/OAuth при выполнении |
| Lint без записи | `npm run lint` | Поведение HTTP/SQL/OAuth при выполнении |
| Поиск specs | `npm test -- --listTests --runInBand` | Пустой список не является успешными тестами |
| Текущие тесты | `npm test -- --runInBand` | Guards/services подменены; HTTP fixture требует loopback listen |
| Настоящие PostgreSQL regression tests | `npm run test:postgres` | Отдельный локальный PostgreSQL 15; не проверяет рабочую схему, HTTP/guards или OAuth |
| PostgreSQL с явно выбранными binaries | `npm run test:postgres -- --pg-bin /absolute/path/to/bin` | Путь к установленным binaries, а не URL/DSN существующей БД |
| PostgreSQL runtime guards | `npm run test:postgres:guards` | Node built-in tests без PostgreSQL; не подтверждают SQL/locks |
| Отдельный существующий spec | `npm test -- --runInBand --runTestsByPath <existing-spec-path>` | Использовать только существующий файл |
| Структура/ссылки/inventory | `python3 scripts/validate-agent-kit.py` | Правильность решений и соблюдение правил агентом |
| Пробелы в diff | `git diff HEAD --check -- <task-paths>` | Новые файлы вне index нужно проверить отдельно; чужие изменения отделяются по исходному состоянию |
| Синтаксис Bash | Loop ниже проверяет каждый script отдельно | Скрипты не выполняются, ветки и побочные эффекты не проверяются |
| ShellCheck, если есть | `shellcheck -x -P SCRIPTDIR scripts/deploy.sh scripts/dump.sh scripts/cleanup.sh scripts/internal/logger.sh` | Проверяет shell, не Python helper/runtime; настоящие секреты для проверки не нужны |
| Python helper syntax | `python3 -c 'import ast,pathlib; ast.parse(pathlib.Path("scripts/internal/operations.py").read_text())'` | Не импортирует helper, не пишет pycache, не проверяет Docker/filesystem behavior |

```sh
for f in scripts/deploy.sh scripts/dump.sh scripts/cleanup.sh scripts/internal/logger.sh; do
  bash -n "$f" || exit
done
```

Валидатор комплекта требует Python 3.11+ (tomllib), Node и существующий js-yaml.
--root <fixture> проверяет изолированную копию. Не устанавливай packages скрыто
ради успешной проверки; отсутствующий инструмент укажи как ограничение.

npm run lint не меняет файлы; lint:fix включает --fix, format — --write. Nest build удаляет/пишет dist
(deleteOutDir), поэтому для проверки типов используй noEmit без incremental.
start:dev transpile-only не доказывает корректность типов. npm ci/build могут
исполнять lifecycle hooks и обращаться в сеть; это не чтение документации.

## Выбор сценариев

| Изменение | Предметные проверки |
|---|---|
| DTO | Минимальный допустимый ввод; missing/null/empty/wrong type/unknown field, nested arrays, UUID/query limits |
| User CRUD/admin | Свой/чужой user, отсутствие profile/id, повтор запроса; 401/403 и целевой user |
| Замена training | Rollback при ошибке children, новые FK/IDs/order, nullable example, история |
| Catalog/метрики | Components/translations, формулы/numeric hydration/уровень count/ties/dates/profile filter |
| Auth/provider | Secret/type/expiry, missing/deleted user, email/provider linking, claims/cache/network errors |
| I18n | Все текущие SUPPORTED_LANGUAGES, обе PT локали, region/alias/q0/unsupported, null/blank/missing translation, изменение relations |
| Weight/push | Bounds/order/гонка последней записи; unique token reassignment, DELETE /push-tokens без JWT revocation |
| Schema/SQL | Metadata/FK/index/default/null/enum и характерные существующие данные на изолированном PostgreSQL |
| Scripts/kit | Синтаксис, изолированные подмены внешних команд/негативные fixtures и независимая проверка решений |

Это выбор по изменению, а не обязательный полный набор для любой задачи.
Подробные ожидания находятся в профильных references. Не закрепляй известную
ошибку как желаемую бизнес-норму в regression test.

## Постоянные PostgreSQL regression tests

Код и сценарии — [test/postgres](../../../../test/postgres/README.md), запуск —
`npm run test:postgres`. Требуется локальный native PostgreSQL 15; каталог
binaries можно указать абсолютным `--pg-bin` или `GRIPPO_TEST_PG_BIN`.
Команда не устанавливает PostgreSQL и не использует рабочую `.env`,
`DATABASE_URL`, production bootstrap или AppModule. Отсутствующий/неподходящий
runtime — NOT_RUN с ненулевым exit, а не PASS и не основание подключать другую БД.

Защиту runner проверяет `npm run test:postgres:guards` без PostgreSQL.
При изменении runtime/context/изоляции или самих scenarios выполни guards
и полную PostgreSQL suite; README-only изменения требуют проверки ссылок,
а не запуска БД.

Runner создаёт новый временный cluster/процесс и отдельные тестовые БД,
проверяет принадлежность runtime и фактическое подключение до создания схемы.
Он не принимает URL/DSN/host/port существующей БД; защиту изоляции нельзя
отключать или обходить. Внутри только синтетические данные, текущие entities,
реальные TypeORM repositories и сервисы. SQL logging выключен; строки данных,
credentials и параметры запросов в отчёт не выводятся. Создание свежей тестовой
схемы не означает разрешение synchronize рабочей БД.

Текущая suite содержит 146 сценариев (17 identity, 129 catalog/training/equipment):
конкурентное создание профиля/goal, замена exclusions, защита последнего веса,
конкурентные catalog CRUD/training create/replace, FK/CHECK/UNIQUE,
CASCADE/SET NULL и полный rollback после поздней серверной ошибки. Regression
cases также проверяют set-семантику exclusions, границы роста, отказ при повторных
catalog references и сохранность публичного catalog/training response.
В исходных 13 конкурентных сценариях ожидание доказывает `pg_blocking_pids` с точным
PID блокирующей transaction; задержка сама по себе не доказательство.
В исходных 7 rollback-сценариях ошибка возникает в настоящей PostgreSQL transaction,
а после отката сравниваются прежние IDs, timestamps, порядок, агрегаты и children.
Число сценариев — текущее покрытие, не ограничение на расширение suite.
Португальский срез дополнительно проверяет enum transition/UNIQUE, revision guards,
импорт/no-op/conflicts, поздний rollback, обе очередности importer/PUT с реальным
ожиданием lock и reconciliation потерянного COMMIT. Runtime guards также проверяют
inert import CLI и три независимых private backup artifacts; рабочие SQL rows не нужны.
Шесть equipment cases в [equipments.cjs](../../../../test/postgres/equipments.cjs)
проверяют additive enum/catalog SQL, повтор с сохранением UUID/timestamps,
конфликты, реальный lock конкурентной публикации, explicit schema/enum guards,
обязательные поля response и независимые UUID exclusions.
Восемь kettlebell cases в [kettlebells.cjs](../../../../test/postgres/kettlebells.cjs)
проверяют read-only preflight, обязательное согласованное name, сохранность
существующего UUID/timestamps, нормализованные конфликты имён, обе конкурентные
публикации с одинаковым/разным name, response/exclusions/refs.
Восемь assisted pull-up/dip cases в [assisted-pull-up-dip.cjs](../../../../test/postgres/assisted-pull-up-dip.cjs)
проверяют metadata-discovered enum/schema, preflight с фиксированным name,
сохранение UUID/timestamps, конфликты и direct/array enum consumers, обе
конкурентные записи с одинаковым/конфликтующим name после lock wait при
repeatable-read default, public response и независимые exclusions с сохранением турника/брусьев/butterfly/
butterfly_forearm/kettlebells и exercise refs.
Девять plate-loaded row cases в [plate-loaded-row.cjs](../../../../test/postgres/plate-loaded-row.cjs)
проверяют read-only preflight с несогласованным name, обязательное name в data,
фактический enum/schema, негативные metadata, direct/array consumers, сохранение
UUID/timestamps, конфликты и обе конкурентные публикации с доказанным ожиданием,
прежний response и независимые exclusions для новой тяги, row_cable и row_bench.
Девять Belt Squat cases в [belt-squat.cjs](../../../../test/postgres/belt-squat.cjs)
проверяют preflight с необязательным name и статус уже опубликованной строки,
обязательное согласованное name в data step, metadata/schema/enum consumers,
повтор с сохранением UUID/timestamps, конфликты и обе конкурентные публикации
с реальным ожиданием lock. Сохраняются прежний response, parent group ID,
старые squat/соседние equipment и exercise refs, независимые UUID exclusions.
Девять Plate-Loaded Seated Dip cases в [plate-loaded-seated-dip.cjs](../../../../test/postgres/plate-loaded-seated-dip.cjs)
проверяют read-only preflight, metadata/enum consumers, явное stored name,
сохранение UUID/timestamps, конфликты и обе конкурентные публикации с реальным
ожиданием lock. Сохраняются response/group ID, triceps_machines/dip_bars/
assisted_pull_up_dip и прежние additions, exercise refs и независимые exclusions.
Девять Ankle Cuff cases в [ankle-cuff.cjs](../../../../test/postgres/ankle-cuff.cjs)
проверяют preflight/schema/data SQL из regression fixtures, metadata/enum consumers,
обязательное явное name, повтор с сохранением UUID/timestamps, конфликты и обе
конкурентные публикации с доказанным ожиданием lock. Сохраняются cord_handles,
соседнее оборудование/refs, публичный response и независимые сохранённые UUID exclusions.
Девять Plate-Loaded Incline Chest Press cases в [plate-loaded-incline-chest-press.cjs](../../../../test/postgres/plate-loaded-incline-chest-press.cjs)
проверяют metadata/preflight/schema/data SQL из regression fixtures, явное name,
повтор с сохранением UUID/timestamps, конфликты и конкурентные публикации
с доказанным ожиданием lock. Сохраняются chest_press_machines,
incline_bench_with_rack, shoulder_press_machines и прежние additions/refs/exclusions;
проверяются group/response и независимые incline/chest press exclusions
после свежего чтения user/service, без изменения exclusions других профилей.
Девять Vertical Leg Press cases в [vertical-leg-press.cjs](../../../../test/postgres/vertical-leg-press.cjs)
проверяют metadata/preflight/schema/data SQL из regression fixtures, четыре legacy
label guards, явное name, UUID/timestamp reuse, конфликты и обе конкурентные
публикации с доказанным ожиданием lock. Сохраняются leg_press_machine,
hack_squat_machines, smith_machines, squat_rack, предыдущие additions/refs/exclusions;
проверяются group/response и независимые old-leg/vertical exclusions через
свежие user/service reads, без изменения exclusions других профилей.
Девять Landmine cases в [landmine.cjs](../../../../test/postgres/landmine.cjs)
проверяют metadata/preflight/schema/data SQL из regression fixtures, barbell/plate_loaded_row
label guards, явное name, UUID/timestamp reuse, конфликты и обе конкурентные
публикации с доказанным ожиданием lock. Сохраняются barbell, plate_loaded_row,
предыдущие additions/refs/exclusions; проверяются free_weight parent/response
и независимые Barbell/Landmine exclusions через свежие user/service reads,
без изменения exclusions других профилей.
Девять Plate-Loaded Decline Chest Press cases в [plate-loaded-decline-chest-press.cjs](../../../../test/postgres/plate-loaded-decline-chest-press.cjs)
проверяют metadata/preflight/schema/data SQL, три legacy label guards, обязательное
явное name с синтетическими fixture names,
UUID/timestamp reuse, conflicts/locks, сохранения chest_press_machines,
decline_bench, decline_bench_with_rack и предыдущих additions/refs/exclusions,
response и независимые chest/decline exclusions. Объявленный inventory не является
результатом запуска; при затрагивающих его изменениях требуется полная PostgreSQL suite.

При изменении entities/FK/constraints/schema/defaults, ownership, CRUD
users/profile/goals/exclusions/weight, каталога/тренировок, transaction manager
или режима/порядка блокировок:

1. Найди затронутые сценарии, актуализируй их fixtures и ожидаемое поведение
   в том же изменении. При новом дефекте добавь regression case; по возможности
   подтверди, что он падает на прежнем коде, затем проходит после исправления.
2. Для нового FK/default/каскада проверь фактическую схему и SQL-ошибку;
   для гонки — оба существенных порядка операций и реальное ожидание lock;
   для атомарности — поздний сбой и сохранность первоначального состояния.
   Не закрепляй прежний баг как требование.
3. Не удаляй и не ослабляй сценарии/изоляцию ради зелёного результата.
   Изменение бизнес-контракта требует основания в запросе пользователя;
   обновление expected само по себе таким основанием не является.
4. После итогового изменения запусти полную suite, включая обе группы.
   Сохранение и актуализация существующей suite уже разрешены в рамках
   соответствующей работы; несвязанные документы и код не требуют её запуска.
5. PASS требует успешных сценариев и cleanup собственного runtime/данных.
   Проверь результат cleanup также при FAIL/interrupt. Ошибку cleanup сообщи
   отдельно; существующие PostgreSQL процессы/данные не останавливай и не удаляй.

Записывай command, фактическую версию PostgreSQL, результаты по группам,
число выполненных сценариев и cleanup. Частичный запуск, отсутствие runtime
или отказ sandbox — NOT_RUN/частичное покрытие; Jest/type check не заменяют SQL.
Это проверка текущих entities/services на свежей схеме. Она не доказывает
совпадение production schema/data, реальную HTTP authorization/OAuth,
нагрузку или все возможные deadlock schedules.
Локальный disposable запуск не является dump/deploy/restore и не требует
повторного согласования уже разрешённого тестирования; правила эксплуатации
рабочей инфраструктуры остаются прежними.

## Изоляция

AppModule включает async DATA_SOURCE.initialize; рабочая .env может направить
его в существующую БД. Production запрещает schema automation, но nonproduction
config может включать synchronize, а initialize само по себе не является
изолированным probe. Для unit/service/controller fixtures
предпочитай отдельный тестовый module с подменёнными providers, без AppModule.

AppModule допустим только в назначенном runtime-сценарии, входящем в исходный
объём задачи. **До import/bootstrap** исключи подхват рабочей .env и наследуемой
конфигурации, способной выбрать существующую БД или настоящую внешнюю интеграцию.
Проверь весь путь providers: DATA_SOURCE полностью подменён без реального
initialize либо направлен в отдельную disposable PostgreSQL DB/volume.
Внешние OAuth/provider вызовы подменены. Если изоляция не установлена, запуск
не выполняется; существующая авторизация не требует повторного согласования
того же уже разрешённого сценария.

Подмены не подтверждают SQL/FK/transactions. PostgreSQL-specific cases требуют
отдельной disposable DB/volume и согласованного объёма, а не SQLite для похожести.
OAuth fixtures используют синтетические claims/keys и подмену network/clock;
реальные tokens и обращения к providers не нужны.

Shell/Python harness — изолированная копия с заменой всех внешних команд и путей
source/write. Забытый docker/sudo/rm/reboot нарушает изоляцию. Подробные scenarios,
synthetic Compose parsing и ограничения: [operations verification](../../grippo-operations/references/verification.md).
Не используй tracing с env/secret values. `--plan` читает actual Docker daemon,
поэтому не запускается при запрете server access, включая remote context.

Статический review не разрешает SSH/dump/deploy. Проверка эксплуатационных
решений сверяет [deployment-policy](../../grippo-operations/references/deployment-policy.md)
без выполнения действий: прямое разрешение каждой попытки, новый штатный dump,
dump-only stop, неизвестный источник/failed backup и запрет автоматического retry.

## Отчёт о проверке

Укажи command/method, exit/result (PASS/FAIL/NOT_RUN/NO_TESTS), существенный вывод,
покрытие и неизвестное. Прочитай полный результат. После исправления повторяй
затронутые проверки; не запускай весь набор без новых оснований.
Перед финалом проверь последний diff. Отсутствие инфраструктуры не считается PASS.
