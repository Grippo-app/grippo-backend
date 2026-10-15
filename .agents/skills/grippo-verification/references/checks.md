# Проверки и границы покрытия

## Доступная инфраструктура

[package.json](../../../../package.json): Jest 29/ts-jest, rootDir src,
testRegex .*\\.spec\\.ts$, node environment. Текущие узкие проверки:
[DTO](../../../../src/modules/exercise-examples/dto/exercise-example.request.spec.ts)
и [AdminController HTTP](../../../../src/modules/admin/admin.controller.spec.ts).
Они проверяют ValidationPipe/controller/Swagger с подменёнными services/guards,
без AppModule/config/БД; настоящую авторизацию и сохранение данных не покрывают.

Перед задачей повторяй поиск specs и читай их окружение. test:e2e ссылается
на отсутствующий test/jest-e2e.json. ESLint/Prettier config, CI workflow и
настроенная интеграционная БД не обнаружены. Наличие packages не доказывает
готовую suite. Новые постоянные specs/инфраструктура — только при явном запросе
их добавления по AGENTS.

## Команды из корня

| Проверка | Команда | Что не доказывает |
|---|---|---|
| Types/imports/decorators | `./node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.build.json` | Поведение DI/HTTP/SQL/OAuth при выполнении |
| Поиск specs | `npm test -- --listTests --runInBand` | Пустой список не является успешными тестами |
| Текущие тесты | `npm test -- --runInBand` | Guards/services подменены; HTTP fixture требует loopback listen |
| Отдельный существующий spec | `npm test -- --runInBand --runTestsByPath <existing-spec-path>` | Использовать только существующий файл |
| Структура/ссылки/inventory | `python3 scripts/validate-agent-kit.py` | Правильность решений и соблюдение правил агентом |
| Пробелы в diff | `git diff HEAD --check -- <task-paths>` | Новые файлы вне index нужно проверить отдельно; чужие изменения отделяются по исходному состоянию |
| Синтаксис Bash | Loop ниже проверяет каждый script отдельно | Скрипты не выполняются, ветки и побочные эффекты не проверяются |
| ShellCheck, если есть | `shellcheck -x -P SCRIPTDIR scripts/deploy.sh scripts/dump.sh scripts/cleanup.sh scripts/internal/logger.sh` | Dynamic .env source может дать SC1090; настоящие секреты для проверки не нужны |

```sh
for f in scripts/deploy.sh scripts/dump.sh scripts/cleanup.sh scripts/internal/logger.sh; do
  bash -n "$f" || exit
done
```

Валидатор комплекта требует Python 3.11+ (tomllib), Node и существующий js-yaml.
--root <fixture> проверяет изолированную копию. Не устанавливай packages скрыто
ради успешной проверки; отсутствующий инструмент укажи как ограничение.

npm run lint включает --fix, format — --write. Nest build удаляет/пишет dist
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
| I18n | en/ua/ru/region/unsupported, null/blank/missing translation, изменение relations |
| Weight/push | Bounds/order/гонка последней записи; unique token reassignment, DELETE /push-tokens без JWT revocation |
| Schema/SQL | Metadata/FK/index/default/null/enum и характерные существующие данные на изолированном PostgreSQL |
| Scripts/kit | Синтаксис, изолированные подмены внешних команд/негативные fixtures и независимая проверка решений |

Это выбор по изменению, а не обязательный полный набор для любой задачи.
Подробные ожидания находятся в профильных references. Не закрепляй известную
ошибку как желаемую бизнес-норму в regression test.

## Изоляция

AppModule включает async DATA_SOURCE.initialize; рабочая .env может направить
его в существующую БД с synchronize. Для unit/service/controller fixtures
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

Shell harness — изолированная копия с заменой всех внешних команд и путей
source/write. Забытый docker/sudo/rm/reboot нарушает изоляцию.
bash -x с .env раскрывает секреты.

Статический review не разрешает SSH/dump/deploy. Проверка эксплуатационных
решений сверяет [deployment-policy](../../grippo-operations/references/deployment-policy.md)
без выполнения действий: прямое разрешение каждой попытки, новый штатный dump,
dump-only stop, неизвестный источник/failed backup и запрет автоматического retry.

## Отчёт о проверке

Укажи command/method, exit/result (PASS/FAIL/NOT_RUN/NO_TESTS), существенный вывод,
покрытие и неизвестное. Прочитай полный результат. После исправления повторяй
затронутые проверки; не запускай весь набор без новых оснований.
Перед финалом проверь последний diff. Отсутствие инфраструктуры не считается PASS.
