# Каталог упражнений, компоненты и справочники

Источники: [ExerciseExampleController](../../../../src/modules/exercise-examples/exercise-example.controller.ts), [ExerciseExampleService](../../../../src/modules/exercise-examples/exercise-example.service.ts), [request DTO](../../../../src/modules/exercise-examples/dto/exercise-example.request.ts), [components DTO](../../../../src/modules/exercise-examples/dto/exercise-components.dto.ts), [response DTO](../../../../src/modules/exercise-examples/dto/exercise-example.response.ts), [AdminController](../../../../src/modules/admin/admin.controller.ts), [i18n service](../../../../src/i18n/exercise-example-i18n.service.ts).

Содержание: чтение и stats; admin CRUD; null/components; переводы; dictionaries; фактические ограничения.

## Каталог и границы доступа

`GET /exercise-examples` и `GET /exercise-examples/:id` защищены JwtAuthGuard. Оба сначала разрешают profile по user.id. Каталог общий, но без профиля сервис отвечает BadRequest, даже если пользователь аутентифицирован. Для detail ID проходит ParseUUIDPipe; service возвращает null при отсутствии, controller переводит это в NotFound.

Ответ — wrapper `{entity, usageCount, lastUsed}`, а не plain array сущностей. `entity` содержит загруженные bundles→muscle, equipmentRefs→equipment и публичный components; translations и componentsEntity убираются после transform. Названия справочников отдельно через i18n не переводятся.

`getExerciseExamples`:

1. Один query загружает весь каталог с relations; SQL initial order createdAt DESC.
2. Если каталог пустой, возвращает [] без stats queries.
3. Параллельно читает personal `COUNT(ex.id), MAX(ex.createdAt)` с join training и profile filter; global popularity `COUNT(ex.id)` без profile filter.
4. Складывает raw counts в Map с приведением Number.
5. Пересортировывает каталог по **глобальной** popularity DESC, tie example.createdAt DESC.
6. Локализует entities, прикладывает components, создает wrapper с **личными** usageCount/lastUsed (0/null при отсутствии).

`getExerciseExampleById` загружает те же catalog relations и персональную статистику одного example; global popularity в response не возвращается. `lastUsed` берется по createdAt выполненного exercise, не по training date.

В constructor есть injected excluded repositories, но ни один из этих read methods не применяет excludedMuscles/excludedEquipments. Наличие DI не доказывает фильтрацию. Пагинации и фильтров в этих endpoints нет; не добавляй их молча ради общего performance правила.

## Административный CRUD

Все записи каталога идут через `/admin/*` под JwtAuthGuard + AdminOnlyGuard; обычный ExerciseExampleController предоставляет только GET.

| Маршрут | Код | Семантика |
|---|---|---|
| `POST /admin/exercise-examples` | 201 `{id}` | новый example + bundles + equipment refs + components + translations атомарно |
| `PUT /admin/exercise-examples?id=…` | 204 | полный replacement; query id ParseUUIDPipe, miss → 404 |
| `DELETE /admin/exercise-examples/:id` | 204 | UUID pipe; miss → 404; если есть exercises → 409 |
| `GET /admin/exercise-examples/:id/translations` | 200 | stored base text + actual translation rows, без locale fallback, UUID pipe/miss 404 |

### Request

`name`, `description` проверяются как непустые массивы с nested `ExerciseExampleLocalizedTextDto`; weightType/category/experience/forceType — enums; imageUrl — IsString (не IsUrl). У localized arrays нет IsObject(each:true): `name:[[]]` проходит текущий pipe и даёт пустой translation record/baseValue:null. Непустой массив поэтому не гарантирует ни объект-запись, ни непустой текст.

LocalizedText имеет language IsIn(SUPPORTED_LANGUAGES), value optional IsString. `name: [{language:'en'}]` проходит требования array/element без обязательного текста; пустая строка после trim превращается в null. Duplicate language отдельно не запрещен. `IsOptional` также пропускает value:null; фактическая проверка ValidationPipe это подтверждает, но `normalizeTranslationValue` затем вызывает null.trim и выбрасывает TypeError. Этот дефект нельзя принимать за поддерживаемую null-семантику request; явный null относится к storage/response.

`exerciseExampleBundles`: обязательный непустой array через IsArray/ArrayNotEmpty; каждый элемент IsObject + ValidateNested/Type, muscleId UUID, percentage integer с Min(0)/Max(100). `ExerciseMuscleTotalConstraint` дополнительно проверяет array, object rows, integer/bounds и сумму **ровно 100**. Сумму считают по rows, не по уникальным мышцам; дубликаты muscleId не запрещены, zero contribution допустим при общей сумме 100.

`equipmentRefs`: обязательный array через IsArray, каждый элемент IsObject + ValidateNested/Type с equipmentId UUID; `[]` допустим. Явных IsDefined на этих arrays нет, но IsArray отвергает absent/null, а bundles дополнительно требует ArrayNotEmpty/total. Сервис продолжает использовать `.map()` и напрямую не повторяет эти API проверки.

DB entity не содержит bounds/sum/unique-pair constraints для bundles. Вход через direct service/manager/import может обходить request validation. Существование muscle/equipment сервис заранее не проверяет; корректный по формату, но неизвестный UUID может завершиться FK ошибкой persistence вместо аккуратного domain 404/400.

`id?: string` у ExerciseExampleRequest без decorators не разрешает отправлять id при строгом global whitelist. ID обновления передается в query.

### Persistence create/update

Create создает example с v4; base name/description вычисляет из локализованного входа; bundles/equipment refs получают example FK. Связанные entity обычно получают generated PK, components получает PK равный exampleId. В transaction manager последовательно сохраняются parent, bundles, refs, components и nonempty translations.

Update сначала проверяет существование example вне transaction; заново строит parent и все children. В transaction удаляет **все** прежние bundles, equipment refs, translations, сохраняет parent и новые children. Components сохраняет с `id = exerciseExampleId`, ожидая этот service invariant. Unsubmitted translations не сохраняются; partial patch semantics отсутствует. При записи из внешнего импорта проверь существующий components PK/FK: unique FK не гарантирует их равенство.

Delete сначала проверяет existence, затем считает referencing exercises. При usageCount>0 бросает Conflict с количеством. При 0 в transaction удаляет bundles, refs, example. Translations/components удаляет DB CASCADE. Muscles/equipments остаются. Проверка usage вне transaction не исключает конкурентную вставку exercise; DB FK тогда следует `SET NULL`, а не сервисному 409. Это риск гонки, не утверждение о подтвержденном инциденте.

## Components: допустимые формы и хранение

Документированная форма — четыре ключа externalWeight, bodyWeight, extraWeight, assistWeight с объектом либо null. Каждый ключ обязателен, если сам `components` передан объектом: DTO использует IsDefined + ValidateIf(value !== null) + ValidateNested; `ApiPropertyOptional` в Swagger неверно описывает их как необязательные.

**Пробел в проверке формы:** у `components` и его ветвей нет IsObject. ValidateNested допускает массивы; например, `externalWeight:[]` при остальных null проходит текущий ValidationPipe и сервис превращает эту ветвь в `externalWeightRequired:null`. Пустой массив в extraWeight/assistWeight при допустимом body также теряет значение. `bodyWeight:[]` проходит DTO, затем отклоняется сервисной проверкой required. Поэтому таблица ниже описывает штатный контракт, а не все значения, фактически пропускаемые DTO. Это существующий дефект, не разрешение использовать массив вместо компонента.

На самом `ExerciseExampleRequest.components` нет IsDefined: отсутствие компонента проходит DTO, затем сервис отвечает 400 `Components are required`. Это отличается от обязательности четырёх ключей внутри переданного объекта.

`null` означает отсутствующую ветвь, `{required:false}` — существующую ветвь с false. Сервис сравнивает с null, а не truthiness, поэтому не сливай эти состояния.

| Ветвь | DTO | Persistence |
|---|---|---|
| externalWeight | `{required:boolean}` либо null | externalWeightRequired boolean/null |
| bodyWeight | `{required:true,multiplier:number}` либо null; multiplier 0.05..2.0 | bodyWeightMultiplier numeric(4,2)/null |
| extraWeight | `{required:boolean}` либо null | extraWeightRequired boolean/null |
| assistWeight | `{required:boolean}` либо null | assistWeightRequired boolean/null |

DTO проверяет boolean required и числовой multiplier; сервис проверяет сочетания ветвей, body.required=true и диапазон multiplier. DB checks повторяют ограничения на сохранённые nullable columns: external/body взаимоисключены, extra/assist требуют body, multiplier 0.05..2.0. Поля body.required в БД нет. Допустимы все четыре null и body+extra+assist одновременно. Ни DTO, ни сервис не ограничивают multiplier двумя десятичными знаками, хотя DB scale=2: точность входа и хранения отличаются.

Пример внешнего веса:

```json
{"externalWeight":{"required":true},"bodyWeight":null,"extraWeight":null,"assistWeight":null}
```

Пример собственного веса с optional extra и assist:

```json
{"externalWeight":null,"bodyWeight":{"required":true,"multiplier":0.75},"extraWeight":{"required":false},"assistWeight":{"required":false}}
```

Read helper строит эти object/null по entity, body.required всегда true. Нет componentsEntity → BadRequest; для списка достаточно одного такого example, чтобы весь read завершился ошибкой. Helper есть и в TrainingsService; актуализируй оба при разрешенном изменении контракта.

## Переводы: запись, fallback, выдача

Storage languages `en`, `ua`, `ru`, default en из [i18n.types.ts](../../../../src/i18n/i18n.types.ts). Middleware и нормализация locale описаны в [identity/API reference](../../grippo-identity-api/references/localization-and-http.md); каталог использует `req.locale`/service.

`prepareTranslationInput` отдельно для name и description:

- undefined value пропускает; строку trim; empty → null.
- record[language] перезаписывается последним встретившимся элементом этого языка.
- baseValue: если record[en] определен, использует его **включая null**; иначе первую non-null строку по входному порядку.
- i18n builder проходит SUPPORTED_LANGUAGES; создает row, когда хотя бы name/description для языка non-null, иначе строку не создает.

При чтении i18n выбирает целую row: direct translation, иначе en row, иначе base. Поля selected row с null откатываются к **base** соответствующего поля; при наличии direct row ее null description не берет автоматически description из en row. Затем сервис удаляет translations с entity.

Admin stored endpoint возвращает `{id, base:{name,description}, translations:[{language,name,description}]}`. Absent language не синтезируется, строки сортируются по SUPPORTED_LANGUAGES. Это правильный путь для редактора; localized обычный response теряет сведения о fallback и отсутствующих значениях.

## Справочники muscles/equipments

Источники: [MusclesService](../../../../src/modules/muscles/muscles.service.ts), [MusclesController](../../../../src/modules/muscles/muscles.controller.ts), [muscle DTO](../../../../src/modules/muscles/dto/muscle-response.ts), [EquipmentsService](../../../../src/modules/equipments/equipments.service.ts), [EquipmentsController](../../../../src/modules/equipments/equipments.controller.ts), [equipment DTO](../../../../src/modules/equipments/dto/equipment-response.ts).

`GET /muscles`, `GET /equipments` **публичные**, guards отсутствуют. Ответы — массивы групп с вложенными items, explicit DTO mapping, никакой profile/exclusion filter. Оба сервиса query groups → items → обратная group relation и строят scalar groupId из нее. Пустые группы остаются с [] items; сортировки не задаются.

MuscleResponse: id/name/type/muscleGroupId/recovery/size/sensitivity/createdAt/updatedAt. Group: id/name/type/muscles/timestamps. EquipmentResponse: id/name/type/equipmentGroupId/timestamps. Group: id/name/type/equipments/timestamps.

При отсутствующей relation group mapping бросает raw Error; это фактический стиль старого кода, не рекомендуемый Nest domain error. Muscle numeric size/sensitivity не имеют TypeORM transformer, в отличие от многих weight/volume полей: TS number и Swagger Number недостаточно для гарантии JSON number.

В этих feature-модулях отсутствует CRUD для групп/мышц/оборудования, seed/migration workflow или локализация словарей. Не выдумывай их при просьбе «добавить оборудование»; сначала определи разрешенный механизм изменения данных.

## Существующее целевое покрытие каталога

- [exercise-example.request.spec.ts](../../../../src/modules/exercise-examples/dto/exercise-example.request.spec.ts) проверяет DTO через actual ValidationPipe: required arrays/row objects, percentages bounds/total, допустимые distributions и пустой equipment array, nested UUID/extra fields, whitelist и отсутствие мутации input. Это подходящая точка для regression-проверок request validation.
- [admin.controller.spec.ts](../../../../src/modules/admin/admin.controller.spec.ts) поднимает изолированный Nest controller с fake services и overridden JWT/admin guards, проверяет POST/PUT validation, статусы, передачу body и Swagger shape. Это подходящая точка для HTTP-boundary/документирования входа; она не подтверждает реальную authorization, DB constraints, transaction rollback или import.

Оба файла входят в Jest discovery по текущим `rootDir: src` и `*.spec.ts`. Наличие specs не означает их прохождение: указывай отдельный фактический вывод запуска. Для validation-правки выбирай эти specs, для persistence/ownership/SQL потребуются другие релевантные доказательства.
