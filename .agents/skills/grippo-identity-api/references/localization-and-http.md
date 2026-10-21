# Локализация, DTO и HTTP boundary

## Locale routing

Источники: [i18n.types.ts](../../../../src/i18n/i18n.types.ts), [I18nModule](../../../../src/i18n/i18n.module.ts), [LanguageMiddleware](../../../../src/i18n/language.middleware.ts), [locale.helper.ts](../../../../src/i18n/locale.helper.ts), [Express augmentation](../../../../src/i18n/express.d.ts), [ExerciseExampleI18nService](../../../../src/i18n/exercise-example-i18n.service.ts).

`SUPPORTED_LANGUAGES = ['en','ua','ru','pt-BR','pt-PT']`, default `en`. Это реальные storage/API значения; `uk` — header alias для `ua`, не write ID. I18nModule `@Global`, middleware `forRoutes('*')` читает `Accept-Language` и присваивает `req.locale`. Глобальность DI не переводит все API строки автоматически: user names, muscle/equipment names и exception messages здесь не локализуются.

`resolveLanguage` объединяет array header через comma, разбирает строгий qvalue (default1, 0..1, до3 decimals), игнорирует malformed/unknown/duplicate parameters. Для каждого candidate самое specific совпадение управляет q: explicit pt-region > bare pt > wildcard; primary aliases > wildcard. При одинаковой specificity duplicate q0 доминирует, иначе max q и исходная позиция. Затем max q>0, исходная позиция и порядок allowlist; если кандидатов нет — en без406.

`parseLocaleRange`: trim → underscore-to-hyphen → Intl.Locale structural parse; en/ru и явные ua/uk aliases, без maximize и сопоставления чужого primary по региону. Explicit pt-region PT → pt-PT; прочие pt-регионы → pt-BR; bare pt предлагает BR/PT с приоритетом BR. Wildcard возвращает весь allowlist со specificity 0. Write body использует только canonical codes: `uk`, `pt`, `pt_BR` и `pt-AO` допустимы для нормализации header, но не как `language` в body.

Сценарии, непосредственно следующие из алгоритма:

| Header | Выбор |
|---|---|
| отсутствует | `en` |
| `ru-RU,en;q=0.9` | `ru` |
| `en;q=0,ru;q=1` | `ru` |
| `de-DE,ru;q=0.2` | `ru` |
| `ua` / `uk-UA` | `ua` |
| `pt` / `pt-AO` / `pt_BR` | `pt-BR` |
| `pt-PT` / `pt_PT` | `pt-PT` |
| `pt-BR;q=0,pt;q=1` | `pt-PT` |
| `fr-UA` | `en`, чужой primary не выбирается по региону |

Контроллеры [exercise examples](../../../../src/modules/exercise-examples/exercise-example.controller.ts), [trainings](../../../../src/modules/trainings/trainings.controller.ts), [admin user trainings](../../../../src/modules/admin/admin.controller.ts) используют `req.locale ?? resolveLanguage()`. Translation service вызывается после загрузки translation relations в соответствующих services; middleware сам ничего в entity не подгружает.
Эти пять read handlers append Vary: Accept-Language, сохраняя прежний Vary. Content-Language не задаётся. q управляет requested locale, но en/base fallback остаётся best effort даже при исключении en в header.

## Read fallback и мутация

`translateExample(example,language)`:

1. Null/undefined input возвращается как есть.
2. Поиск direct translation row; если её нет — default en row; если обе отсутствуют — base fields.
3. Если selected row есть, `name = row.name ?? base.name`, `description = row.description ?? base.description`.
4. Удаление `example.translations`, если свойство truthy; загруженная relation — массив, включая `[]`. Возвращается та же ссылка. У вручную созданного объекта `translations:null` проверка falsy и свойство не удаляется.

Это **выбор row**, не независимая chain каждого field. Пример: base name `Base`, en name `English`, ru row `{name:null,description:'Русское'}` → ru result name `Base`, description `Русское`; не English. Пустая строка не null: вручную сохранённый `''` остаётся `''`. `translateExamples` и `translateExercisesCollection` мутируют collection contents на месте. Повторный перевод того же объекта на другой язык после удаления translations не восстанавливает исходные rows. Не кэшируй/переиспользуй такой объект между locale requests и не сохраняй его в persistence.

Admin `GET /admin/exercise-examples/:id/translations` [service](../../../../src/modules/exercise-examples/exercise-example.service.ts) сознательно возвращает `{id,translationsRevision,base:{name,description},translations:[{language,name,description}]}` без fallback; rows сортируются порядком SUPPORTED_LANGUAGES. Revision — SHA256 versioned tuple id/base/exact sorted text, без child IDs/timestamps. Это edit contract, не обычный localized read contract.

## Write translation contract

[ExerciseExampleRequest](../../../../src/modules/exercise-examples/dto/exercise-example.request.ts) для create/update содержит name и description как nonempty arrays `{language,value?}`. `language: IsIn(SUPPORTED_LANGUAGES)`; `value: ValidateIf(value !== undefined) + IsString`; nested `Type` и validation включены. Изменения живут в [ExerciseExampleService](../../../../src/modules/exercise-examples/exercise-example.service.ts) и [i18n service](../../../../src/i18n/exercise-example-i18n.service.ts).

Элементы name/description проверяются IsObject(each:true): `name:[[]]` отвергается strict ValidationPipe. Отсутствующий value допускается; непустой массив поэтому не гарантирует непустой текст. В том же DTO components обязателен и проверяется как object с четырьмя обязательными object/null ветвями; IsObject не разрешает массивы вместо объектов.

`prepareTranslationInput` trim-ит values, undefined пропускает, empty string превращает в null, duplicate language перезаписывает record последним значением. Base — en record value если определён, иначе первый непустой обработанный value; firstNonNull не пересчитывается после duplicate overwrite. `buildTranslationEntities` проходит supported languages, игнорирует обе undefined и обе null/empty fields, создаёт row если хотя бы одно непусто. Nullable field заполняется null, строка trim-ится.

Update удаляет **все** старые translation rows и вставляет rows из текущего body в transaction вместе с остальным example graph. До любых writes после parent lock проверяется conditional revision через fresh manager rows: любой присланный token сравнивается, current PT/новый непустой PT требует matching token (409 STALE), current PT требует обоих explicit string entries (409 INCOMPLETE). Два empty values разрешают clear. Update-only DTO валидирует hex64; POST поле не принимает. Entity [ExerciseExampleTranslationEntity](../../../../src/entities/exercise-example-translation.entity.ts) задаёт CASCADE, supported_language_enum и именованный UNIQUE `(exerciseExampleId,language)`. Это защита текстов, не версия всего графа.

Явный `{language:'ru',value:null}` отвергается API: ValidateIf пропускает проверку только для undefined, IsString отклоняет null. Nullable storage/response не разрешает explicit-null удаление в request. Для удаления текста string path использует empty string; для current PT отсутствие entries отвергается защитой выше. Legacy full replacement остальных языков сохраняется. Прямой вызов сервиса обходит DTO и отдельно требует допустимой формы. См. domain skill для полного exercise example graph.

## Отдельные schema/import операции переводов

Runtime поддержка локалей не обновляет существующую БД автоматически.
[Schema SQL](../../../../scripts/sql/add-portuguese-locales.sql) — отдельная
разрешённая операция через `psql -v ON_ERROR_STOP=1`: проверяет форму enum,
единственного потребителя и именованный UNIQUE, блокирует translation table,
добавляет `pt-BR`/`pt-PT` и делает COMMIT. Запись новых enum values допускается
только после этого COMMIT. Не пересоздавай enum и не включай synchronize.

[Importer CLI](../../../../scripts/import-exercise-translations.cjs) и
[его core](../../../../scripts/internal/exercise-translations.cjs) не читают
`.env` и не запускают приложение. Dataset имеет форму
`{version:1,records:[{exerciseExampleId,language,name,description}]}`:
точный текущий набор catalog IDs, обе PT локали для каждого ID, уникальные пары
и непустые строковые тексты. Частичная или устаревшая выборка отвергается.
Dataset/connection/manifest/approval/receipt хранятся вне checkout: private
regular files в собственном закрытом каталоге, без symlinks и вывода payload.

По умолчанию CLI выполняет read-only dry-run и создаёт новый manifest,
связывающий dataset, текущую commit revision, tool hashes, DB identity,
source texts и before/desired target hashes. Существующий отличный PT текст
требует точного разрешения replacement; совпадающие записи остаются no-op.
Доступные flags и шаблон вызова: `node scripts/import-exercise-translations.cjs --help`.
Сам dry-run подключается к явно выбранной БД и требует разрешённого scope.

`--apply` отдельно требует committed tools, clean `src`/`scripts`, согласованный
manifest/approval, свежий проверенный штатный dump и реально остановленных
writers. Approval file/flags не заменяют разрешение человека и writer control.
Importer в transaction блокирует parent rows и повторно проверяет identity,
полный набор IDs и тексты до записей. Меняет только PT rows; durable receipt
фиксирует фазы до COMMIT. После disconnect/UNKNOWN используй read-only
`--reconcile` с прежними manifest/receipt; автоматический retry запрещён.
Смена DB identity или незавершённая исходная transaction оставляет UNKNOWN.

Schema/import не входят в обычный backend deploy. Согласование и backup gates —
[deployment-policy](../../grippo-operations/references/deployment-policy.md),
регрессии и пределы локального доказательства —
[PostgreSQL suite](../../../../test/postgres/README.md).

## Global DTO pipeline

[main.ts](../../../../src/main.ts): `ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true})`. `AppModule` использует `ConfigModule.forRoot({envFilePath:'.env',isGlobal:true})` без validation schema. `.env` values не нужны для понимания контрактов.

- Class-based body проходит class-validator. Неизвестные поля с этим DTO вызывают 400; `@ApiProperty`, `@Expose`, TypeScript declaration не являются validation whitelist decorators.
- Scalar `@Body('refreshToken')`, `@Param('id')`, `@Query('start')` без DTO/pipe не получают свойства whole-object DTO validation по умолчанию. `@ApiQuery(required:true)` — документация, не runtime validator.
- `transform:true` сам по себе не включает `enableImplicitConversion`. Numeric body должен проверяться по действительным decorators/`@Type`; не обещай, что строка `"175"` всегда приведётся в number.
- `IsOptional` пропускает undefined **и null**; service должен осознанно определить null semantics. `IsString` без Length/IsNotEmpty не запрещает empty. `IsInt` не задаёт positive bounds. `each:true` не равнозначно `IsArray`.
- Response DTOs не сериализуют автоматически и не валидируются request pipe. `password select:false` не защищает произвольный `addSelect` + entity return; ручные response mappings в UsersService имеют значение.

Наблюдаемая реализация неоднородна: auth/user/admin используют response classes; weight возвращает TypeORM entities/DeleteResult. Улучшение typed Request/Response или class DTO — отдельное направленное изменение контракта, а не повод массово форматировать проект.

## Bootstrap и logging

[main.ts](../../../../src/main.ts): Nest ExpressAdapter, CORS true, global ValidationPipe, global LoggingInterceptor, setupSwagger, `BACKEND_PORT` required, bind `0.0.0.0`. Нет активного global prefix. Shutdown listeners SIGINT/SIGTERM вызывают app.close и process.exit. Bootstrap сам вызывает `bootstrap()`: импортировать main ради проверки metadata означает запуск приложения и его providers.

[LoggingInterceptor](../../../../src/common/logging.interceptor.ts) снимает method/url/user в intercept, отделяет path через `url.split(/[?#]/,1)[0]`, пишет duration+status и optional uid. На handler error пишет status через `HttpException.getStatus()` либо 500, затем rethrows; body/headers/query/fragment/error message в текущем working tree в HTTP log не выводятся. Guard errors происходят до handler interceptor; interceptor нельзя считать полным audit trail всех отклонённых запросов. Логи auth сервиса отдельные: login failure включает email, warnings provider verification в текущем working tree generic, без исходного error message. Не добавляй JWT/code/token/password в logs при отладке.

## Swagger surface

[swagger.ts](../../../../src/swagger.ts): title Grippo API, version `1.0.0`, server `/`, bearer scheme **`access-token`**, `ignoreGlobalPrefix:false`. `NODE_ENV==='production'` меняет title suffix PROD/DEV; условного отключения docs в production в этом файле нет.

`SwaggerModule.setup('docs',...)` включает persistAuthorization, collapsed operations, durations, deep links, alpha sort и tryItOut. Custom route `/swagger-custom.js` отдаёт script, добавляющий ссылку `/docs-json`. Express используется в main, но helper имеет branch для fastify. `/docs` и JSON документ не защищены application JWT guard в setup.

Поддерживай `@ApiTags`, `@ApiBearerAuth('access-token')` для protected controllers, body/response models и expected error codes. Не переименовывай bearer scheme или docs path без проверки consumers. Для проверки schema предпочти isolated app metadata с stubbed providers/DB; вызов полного bootstrap может подключить DB и затронуть schema через DataSource.
