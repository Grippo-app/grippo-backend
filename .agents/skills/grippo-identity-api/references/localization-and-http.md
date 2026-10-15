# Локализация, DTO и HTTP boundary

## Locale routing

Источники: [i18n.types.ts](../../../../src/i18n/i18n.types.ts), [I18nModule](../../../../src/i18n/i18n.module.ts), [LanguageMiddleware](../../../../src/i18n/language.middleware.ts), [locale.helper.ts](../../../../src/i18n/locale.helper.ts), [Express augmentation](../../../../src/i18n/express.d.ts), [ExerciseExampleI18nService](../../../../src/i18n/exercise-example-i18n.service.ts).

`SUPPORTED_LANGUAGES = ['en','ua','ru']`, default `en`. Это реальные storage/API значения; не заменяй `ua` на `uk` как стилистическое исправление. I18nModule `@Global`, middleware `forRoutes('*')` читает `Accept-Language` и присваивает `req.locale`. Глобальность DI не переводит все API строки автоматически: user names, muscle/equipment names и exception messages здесь не локализуются.

`resolveLanguage` объединяет array header через comma, идёт по comma-separated элементам **в исходном порядке**, отбрасывает suffix после `;`, возвращает первый candidate, для которого `tryNormalizeLocale` дал supported value. Нет сортировки `q` и обработки `q=0`; отсутствующий/неподдержанный header → `en`.

`tryNormalizeLocale`: trim → `_` заменяется на `-` → lowercase supported value → `Intl.Locale` → language → maximize language → maximize region, сравнивая каждый с supported list. Поэтому регион может дать `ua`, даже когда primary language не supported. `uk-UA`/`uk` в окружении со стандартным Intl maximization могут разрешиться через регион UA; это поведение environment-dependent, не жёсткий map `uk→ua`. Malformed locale ловится и возвращает undefined. Для примеров/fixtures выбирай явные значения и проверяй фактически нужное окружение.

Сценарии, непосредственно следующие из алгоритма:

| Header | Выбор |
|---|---|
| отсутствует | `en` |
| `ru-RU,en;q=0.9` | `ru` |
| `en;q=0,ru;q=1` | `en`, quality weights игнорируются |
| `de-DE,ru;q=0.2` | `ru`, если de-DE не сопоставился с supported code |
| `ua` | `ua`, direct supported value |

Контроллеры [exercise examples](../../../../src/modules/exercise-examples/exercise-example.controller.ts), [trainings](../../../../src/modules/trainings/trainings.controller.ts), [admin user trainings](../../../../src/modules/admin/admin.controller.ts) используют `req.locale ?? resolveLanguage()`. Translation service вызывается после загрузки translation relations в соответствующих services; middleware сам ничего в entity не подгружает.

## Read fallback и мутация

`translateExample(example,language)`:

1. Null/undefined input возвращается как есть.
2. Поиск direct translation row; если её нет — default en row; если обе отсутствуют — base fields.
3. Если selected row есть, `name = row.name ?? base.name`, `description = row.description ?? base.description`.
4. Удаление `example.translations`, если свойство truthy; загруженная relation — массив, включая `[]`. Возвращается та же ссылка. У вручную созданного объекта `translations:null` проверка falsy и свойство не удаляется.

Это **выбор row**, не независимая chain каждого field. Пример: base name `Base`, en name `English`, ru row `{name:null,description:'Русское'}` → ru result name `Base`, description `Русское`; не English. Пустая строка не null: вручную сохранённый `''` остаётся `''`. `translateExamples` и `translateExercisesCollection` мутируют collection contents на месте. Повторный перевод того же объекта на другой язык после удаления translations не восстанавливает исходные rows. Не кэшируй/переиспользуй такой объект между locale requests и не сохраняй его в persistence.

Admin `GET /admin/exercise-examples/:id/translations` [service](../../../../src/modules/exercise-examples/exercise-example.service.ts) сознательно возвращает `{id,base:{name,description},translations:[{language,name,description}]}` без fallback; rows сортируются порядком SUPPORTED_LANGUAGES. Это edit contract, не обычный localized read contract.

## Write translation contract

[ExerciseExampleRequest](../../../../src/modules/exercise-examples/dto/exercise-example.request.ts) для create/update содержит name и description как nonempty arrays `{language,value?}`. `language: IsIn(SUPPORTED_LANGUAGES)`; `value: IsOptional+IsString`; nested `Type` и validation включены. Изменения живут в [ExerciseExampleService](../../../../src/modules/exercise-examples/exercise-example.service.ts) и [i18n service](../../../../src/i18n/exercise-example-i18n.service.ts).

Проверка формы неполна: на элементах name/description нет IsObject. `name:[[]]` проходит текущий strict ValidationPipe; normalizer пропускает undefined value и возвращает пустой record/baseValue:null. Это существующий дефект проверки входа, не поддерживаемая форма записи. Для bundles/equipmentRefs в том же DTO IsObject(each:true) уже есть; их гарантии не распространяются на localized rows или components.

`prepareTranslationInput` trim-ит values, undefined пропускает, empty string превращает в null, duplicate language перезаписывает record последним значением. Base — en record value если определён, иначе первый непустой обработанный value; firstNonNull не пересчитывается после duplicate overwrite. `buildTranslationEntities` проходит supported languages, игнорирует обе undefined и обе null/empty fields, создаёт row если хотя бы одно непусто. Nullable field заполняется null, строка trim-ится.

Update удаляет **все** старые translation rows и вставляет rows из текущего body в transaction вместе с остальным example graph. Это full replacement; отсутствие языка в новом наборе не сохраняет старый перевод. Entity [ExerciseExampleTranslationEntity](../../../../src/entities/exercise-example-translation.entity.ts) имеет CASCADE exercise example FK и enum language, но в definition нет unique `(exerciseExampleId,language)`. Read `find` выбирает первую matching row, если в БД дубликаты.

**Вывод, известный validator/service mismatch:** `IsOptional` пропускает null, но `normalizeTranslationValue` в ExerciseExampleService вызывает `.trim()` на любом не-undefined value. JSON `{language:'ru',value:null}` может пройти DTO validation и упасть TypeError (500). I18n helper `normalizeInput` умеет null, но это не исправляет более ранний service path. Документируй как риск до исправления, не как поддержку explicit-null удаления. Для обычного удаления текста текущий string path использует empty string. См. domain skill для полного exercise example graph.

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
