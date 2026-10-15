# Схема, сущности и отношения

Снимок исходников от 2026-10-15. Это карта entity и использующих их сервисов; metadata дополнительно построены локальным `DataSource.buildMetadatas()` без initialize/подключения (`isInitialized:false`, 19 entity, все PK generated UUID). Это не результат инспекции живой БД. Для актуального DDL нужны отдельно разрешенная среда и проверка ее схемы.

Содержание: общие свойства; 19 entity; FK/удаление; repository tokens; enums; места, где TypeScript/DTO не отражают хранение.

## Источники и механизм доступа

- [DatabaseService](../../../../src/database/database.service.ts): PostgreSQL, `entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')]`, `migrations: []`; `POSTGRES_SYNC/LOGS/MIGRATIONS` явно parsed booleans с default false, некорректный ввод отклоняется. В production synchronize/migrationsRun=true запрещены, installExtensions=false; текущий Compose выключает все flags. DB port валидируется как integer 1..65535. Actual remote config здесь не установлен.
- [dataSourceProviders](../../../../src/database/database.provider.ts): async provider `'DATA_SOURCE'` создает `DataSource`, вызывает `initialize()`, возвращает подключенный объект.
- [DatabaseModule](../../../../src/database/database.module.ts): импортирует `ConfigModule.forRoot()`, предоставляет и экспортирует data source и repository providers. Feature-модули импортируют `DatabaseModule` и повторно включают `...repositoryProviders` в `providers`.
- [repositoryProviders](../../../../src/database/repository.providers.ts): `createRepositoryProvider(token, Entity)` → factory `dataSource.getRepository(Entity)`, inject `'DATA_SOURCE'`. Нет `@nestjs/typeorm` или `forFeature`.
- [SnakeNamingStrategy](../../../../src/common/snake-naming.strategy.ts): свойства camelCase становятся SQL snake_case, явно заданные имена сохраняются. Scalar FK и `@JoinColumn` с одинаковым SQL-именем относятся к одному столбцу; не добавляй второй FK из-за разницы имен TS/SQL.

У всех 19 entity `@PrimaryGeneratedColumn('uuid')`. Некоторые сервисы явно задают UUID через `v4()`; другие полагаются на генерацию. У всех есть `createdAt`; у всех кроме `PushTokensEntity` есть `updatedAt`. Общие timestamps — `timestamp without time zone`. Это не `timestamptz`, часовой пояс среды и преобразование Date требуют отдельного внимания.

`default: null` и `nullable: true` — разные опции декоратора, но текущий TypeORM в `ColumnMetadata` при default:null сам выставляет `isNullable=true`, если это не переопределено explicit nullable. Локальное построение metadata подтвердило nullable=true у таких полей каталога, bundles и exclusions. TypeScript `string | null` сам по себе SQL nullable не задает. Совпадающие SQL имена scalar FK и relation совмещаются; фактический DDL живой БД отдельно не проверялся.

## Все 19 entity

### 1. UsersEntity → `users`

Источник: [users.entity.ts](../../../../src/entities/users.entity.ts).

- `email`: string, unique; `password`: nullable, `select: false`.
- `googleId → google_id`, `appleId → apple_id`: nullable, unique.
- `role`: enum `UserRoleEnum`, default `default`.
- `profile`: inverse `OneToOne` к `UserProfilesEntity.user`; FK находится в `user_profiles`.
- Отдельной обратной коллекции push tokens нет. `PushTokensEntity.user` все равно связывает их с user.
- Удаление user через DB FK удаляет profile и push tokens; профиль продолжает каскад к пользовательским данным.

### 2. UserProfilesEntity → `user_profiles`

Источник: [user-profiles.entity.ts](../../../../src/entities/user-profiles.entity.ts).

- `user`: owning `OneToOne`, `@JoinColumn(user_id)`, `onDelete: CASCADE`; отдельного scalar `userId` в классе нет. TypeORM создаёт unique `user_id`, но связь без explicit nullable:false остаётся nullable. Это максимум один профиль на ненулевой user FK, а не DB-требование иметь владельца у каждой строки.
- `name`: string; `height`: integer, сантиметры; `experience`: обязательный `ExperienceEnum`.
- Коллекции `trainings`, `weights`, `excludedMuscles`, `excludedEquipments`: inverse `OneToMany`, `cascade: ['remove']`.
- `goal?`: inverse `OneToOne`, `cascade: ['remove']`.
- Это граница владения тренировками, весом, exclusions и целью. Не подставляй `UsersEntity.id` в `profile_id`.
- [UsersService.createProfile](../../../../src/modules/users/users.service.ts) атомарно создает profile, начальную weight-history и exclusions; повторное создание профиля блокирует.

### 3. GoalsEntity → `goals`

Источник: [goals.entity.ts](../../../../src/entities/goals.entity.ts).

- `profileId`: UUID, unique; owning `OneToOne` к profile, `onDelete: CASCADE`.
- `primaryGoal`: обязательный enum; `secondaryGoal`: nullable enum. У enum заданные PostgreSQL names `goal_primary_goal_enum`, `goal_secondary_goal_enum`.
- `target`: nullable timestamp; `personalizations`: PostgreSQL enum array `goal_personalization_key_enum[]`, default пустой array.
- `confidence`: decimal(3,2), default 1, transformer `parseFloat`, DB check `0 <= confidence <= 1`.
- `lastConfirmedAt`: nullable timestamp. Текущий `setGoal()` не заполняет его; при сохранении цели принудительно задает confidence 1, заменяет personalizations на переданный массив или `[]`, secondary/target на значение или `null`.
- Goal tags описаны в комментариях как soft signals для AI. В изученных сервисах это хранение/выдача контекста; выполнение AI-планирования из enum не следует.

### 4. WeightHistoryEntity → `weight_history`

Источник: [weight-history.entity.ts](../../../../src/entities/weight-history.entity.ts).

- `weight`: decimal(5,1), transformer `parseFloat`, кг; DB check `30 <= weight <= 300`.
- `profile`: `ManyToOne`, FK `profile_id`, `onDelete: CASCADE`, `orphanedRowAction: delete`; scalar `profileId` в классе не объявлен. Без nullable:false FK допускает null; пользовательский сервис всегда задаёт profile.
- [WeightHistoryService](../../../../src/modules/weight-history/weight-history.service.ts) добавляет записи, читает DESC по createdAt и ограничивает удаление последней записи проверкой количества перед delete; это не DB constraint и не транзакционная гарантия при конкуренции.

### 5. PushTokensEntity → `push_tokens`

Источник: [push-tokens.entity.ts](../../../../src/entities/push-tokens.entity.ts).

- `user`: `ManyToOne` к users, FK `user_id`, `onDelete: CASCADE`; metadata FK nullable, хотя upsert сервиса всегда передаёт user.
- `token`: globally unique string. Из timestamps только `createdAt`.
- [PushTokensService.upsertToken](../../../../src/modules/push-tokens/push-tokens.service.ts) при конфликте token обновляет `user_id`: один token может перейти к другому user, новая строка для каждого user/token не создается.

### 6. TrainingsEntity → `trainings`

Источник: [trainings.entity.ts](../../../../src/entities/trainings.entity.ts).

- `duration`: nullable int (API описывает минуты); `repetitions`: nullable int.
- `volume`: nullable decimal(10,1); `intensity`: nullable decimal(5,2); numeric transformer `parseFloat`.
- `profileId`: nullable UUID, owning `ManyToOne` к profile, `onDelete: CASCADE`, `orphanedRowAction: delete`.
- `createdAt` имеет отдельный `@Index()`. Составных `(profile_id, created_at)` indices в исходнике нет.
- `exercises`: inverse `OneToMany`, `cascade: ['remove']`.
- Агрегаты сохраняются из request, сервер не сверяет их с суммой exercises/iterations.

### 7. ExercisesEntity → `exercises`

Источник: [exercises.entity.ts](../../../../src/entities/exercises.entity.ts).

- `name`: nullable varchar; `volume`: nullable decimal(10,1); `repetitions`: nullable int; `intensity`: nullable decimal(5,2). Decimal transformers — `parseFloat`.
- `trainingId`: nullable UUID, `ManyToOne` к training, `onDelete: CASCADE`, orphan delete.
- `exerciseExampleId`: nullable UUID, `ManyToOne` к example, **`onDelete: SET NULL`**, orphan nullify.
- `orderIndex → order_index`: int default 0; `iterations`: `OneToMany`, cascade remove.
- Сохраненный exercise.name не является автоматически вычисляемым localized catalog name. Локализация затрагивает вложенный `exerciseExample`, не переименовывает историческое поле exercise.name.

### 8. IterationsEntity → `iterations`

Источник: [iterations.entity.ts](../../../../src/entities/iterations.entity.ts).

- `assistWeight`, `externalWeight`, `extraWeight`, `bodyWeight`: nullable decimal(5,1), `parseFloat`.
- `bodyMultiplier`: nullable decimal(4,2); transformer явно сохраняет `null`, иначе `parseFloat`.
- `repetitions`: nullable int; `exerciseId`: nullable column, owning `ManyToOne` к exercise, FK `exercise_id`, `onDelete: CASCADE`, orphan delete.
- `orderIndex`: int default 0. Это подход/итерация выполненного exercise, не шаблон каталога.
- В entity отсутствуют checks для неотрицательности веса/повторений, bounds bodyMultiplier или взаимного исключения весовых полей. Проверки components каталога сюда автоматически не распространяются.
- Nullable весовые `parseFloat` transformers не сохраняют null: local PostgreSQL driver hydration превращает его в NaN. `bodyMultiplier` transformer null сохраняет. Это отражается на JS metric formula; см. [trainings-and-metrics](trainings-and-metrics.md).

### 9. ExerciseExamplesEntity → `exercise_examples`

Источник: [exercise-examples.entity.ts](../../../../src/entities/exercise-examples.entity.ts).

- `name`, `description`, `imageUrl`: `@Column({default: null})`; явный nullable в декораторе не задан. name/description объявлены `string | null`; imageUrl — `string`.
- Nullable enums `category`, `weightType`, `forceType`, `experience`.
- Коллекции `exerciseExampleBundles`, `exercises`, `equipmentRefs`, `translations`: inverse `OneToMany`, `cascade: ['remove']`.
- `componentsEntity`: inverse `OneToOne`, `cascade: true`.
- `components`: публичное поле с `@ApiProperty`, **не колонка и не relation**. Сервисы строят его из componentsEntity, затем удаляют внутреннее поле перед выдачей.
- Сервисный запрет delete используемого example и `SET NULL` на FK Exercises — разные уровни. `cascade: ['remove']` на inverse relation также не равен SQL delete; учитывай разницу `remove(loaded entity)` и используемого сейчас `delete(criteria)`.

### 10. ExerciseExampleBundlesEntity → `exercise_example_bundles`

Источник: [exercise-example-bundles.entity.ts](../../../../src/entities/exercise-example-bundles.entity.ts).

- `percentage`, `exerciseExampleId`, `muscleId`: columns с `default: null` без explicit nullable.
- `exerciseExample` и `muscle`: `ManyToOne`, FK `exercise_example_id` и `muscle_id`, `onDelete: CASCADE`, orphan delete.
- Это join entity «шаблон упражнения → мышца + процент». Ни unique пары, ни DB check 0..100, ни DB-ограничение суммы процентов 100 не заданы. Текущий [request DTO](../../../../src/modules/exercise-examples/dto/exercise-example.request.ts) проверяет integer percentage 0..100 и сумму массива ровно 100 через `ExerciseMuscleTotalConstraint`; это API validation, не DB invariant. Прямые service/manager writes обходят request pipe; дубликаты muscleId отдельно не запрещены.

### 11. ExerciseExamplesEquipmentsEntity → `exercise_examples_equipments`

Источник: [exercise-examples-equipments.entity.ts](../../../../src/entities/exercise-examples-equipments.entity.ts).

- `equipmentId`, `exerciseExampleId`: columns с `default: null`.
- Обе `ManyToOne` связи имеют `onDelete: CASCADE`, orphan delete, FK `equipment_id`, `exercise_example_id`.
- Это join entity каталога с оборудованием, без unique пары. Поле относится к связи каталога, а не к excluded equipment пользователя.

### 12. ExerciseExampleTranslationEntity → `exercise_example_translations`

Источник: [exercise-example-translation.entity.ts](../../../../src/entities/exercise-example-translation.entity.ts).

- `exerciseExampleId`: UUID; `ManyToOne`, `onDelete: CASCADE`.
- `language`: enum из `SUPPORTED_LANGUAGES`; `name`, `description`: nullable text.
- Unique `(exercise_example_id, language)` в entity нет. Текущий CRUD строит максимум одну строку на язык в рамках request и при update удаляет все прежние translation rows.
- Обычный catalog/training response удаляет `translations` после locale fallback. Admin stored-translations endpoint выдает реально сохраненные строки без fallback.

### 13. ExerciseExampleComponentsEntity → `exercise_example_components`

Источник: [exercise-example-components.entity.ts](../../../../src/entities/exercise-example-components.entity.ts).

- `exerciseExampleId`: обязательный UUID unique, owning `OneToOne`, FK `exercise_example_id`, `onDelete: CASCADE`.
- `externalWeightRequired`, `extraWeightRequired`, `assistWeightRequired`: nullable boolean. `false` — сохраненное значение, не отсутствие компонента; отсутствие обозначается null.
- `bodyWeightMultiplier`: nullable numeric(4,2), transformer `Number` с сохранением null.
- DB checks: multiplier null либо 0.05..2.0; внешний вес и body multiplier одновременно не заполнены; без body multiplier extra/assist равны null; при external weight extra/assist равны null.
- Сервис задает `components.id = exerciseExampleId`. БД требует unique FK, но **не требует равенства PK и FK**; при работе с данными другого происхождения это отдельный инвариант пути сохранения.
- Отдельного repository provider нет; TypeORM все равно обнаруживает entity glob, операции идут через manager.

### 14. MuscleGroupsEntity → `muscle_groups`

Источник: [muscle-groups.entity.ts](../../../../src/entities/muscle-groups.entity.ts).

- `name`: string; `type`: nullable `MuscleGroupEnum`.
- `muscles`: inverse `OneToMany`, cascade remove. Уникальность name/type не объявлена.

### 15. MusclesEntity → `muscles`

Источник: [muscles.entity.ts](../../../../src/entities/muscles.entity.ts).

- `name`: string; `type`: nullable `MuscleEnum`; `recovery`: nullable integer, DB check null либо >= 0.
- `size`, `sensitivity`: nullable numeric(5,2), **без transformer**, хотя TS и response DTO объявляют number. Проверяй фактические типы `pg` при изменении ответов.
- `muscleGroup`: `ManyToOne`, FK `muscle_group_id`, cascade delete/orphan delete. Scalar muscleGroupId в entity нет, response строит его из relation.
- `exerciseExampleBundles`, `excludedMuscles`: inverse коллекции, cascade remove.

### 16. EquipmentGroupsEntity → `equipment_groups`

Источник: [equipment-groups.entity.ts](../../../../src/entities/equipment-groups.entity.ts).

- `name`: string; `type`: nullable `EquipmentGroupEnum`; `equipments`: inverse collection, cascade remove.
- Уникальность name/type не объявлена.

### 17. EquipmentsEntity → `equipments`

Источник: [equipments.entity.ts](../../../../src/entities/equipments.entity.ts).

- `name`: string; `type`: nullable `EquipmentEnum`.
- `equipmentGroup`: `ManyToOne`, FK `equipment_group_id`, cascade delete/orphan delete. Scalar equipmentGroupId в entity нет, response получает его из relation.
- `excludedEquipments`, `exerciseExampleRefs`: inverse коллекции, cascade remove.

### 18. ExcludedMusclesEntity → `excluded_muscles`

Источник: [excluded-muscles.entity.ts](../../../../src/entities/excluded-muscles.entity.ts).

- `muscleId`, `profileId → profile_id`: columns с `default: null`.
- Связи к muscle и profile: `ManyToOne`, FK `muscle_id`, `profile_id`, cascade delete/orphan delete.
- Unique `(profile_id, muscle_id)` не задана. Текущий users update проверяет валидность списка и заменяет rows; catalog service эти rows не использует для фильтра.

### 19. ExcludedEquipmentsEntity → `excluded_equipments`

Источник: [excluded-equipments.entity.ts](../../../../src/entities/excluded-equipments.entity.ts).

- `equipmentId`, `profileId → profile_id`: columns с `default: null`.
- Связи к equipment и profile: `ManyToOne`, cascade delete/orphan delete.
- Unique пары не задана. Не путай с `exercise_examples_equipments`: первое — пользовательский выбор, второе — описание каталога.

## Граф внешних ключей и удаления

Стрелка идет от родителя к зависимой таблице; `CASCADE` ниже означает именно `onDelete` на owning relation.

```text
users
├─ CASCADE → user_profiles (OneToOne)
│  ├─ CASCADE → trainings → CASCADE exercises → CASCADE iterations
│  ├─ CASCADE → goals (OneToOne)
│  ├─ CASCADE → weight_history
│  ├─ CASCADE → excluded_muscles ← CASCADE muscles ← CASCADE muscle_groups
│  └─ CASCADE → excluded_equipments ← CASCADE equipments ← CASCADE equipment_groups
└─ CASCADE → push_tokens

exercise_examples
├─ CASCADE → exercise_example_bundles ← CASCADE muscles
├─ CASCADE → exercise_examples_equipments ← CASCADE equipments
├─ CASCADE → exercise_example_translations
├─ CASCADE → exercise_example_components (OneToOne, unique FK)
└─ SET NULL → exercises.exercise_example_id
```

`repository.delete()`/`manager.delete()` работают через DB FK и не загружают коллекции для ORM remove cascade. Не заключай из одной `cascade` option, что удаление справочника удалит исторические тренировки. Не меняй поведение удаления упражнений без проверки и schema metadata, и service guard.

## Repository tokens

Все 18 записей из [repository.providers.ts](../../../../src/database/repository.providers.ts):

| Token | Entity |
|---|---|
| `USERS_REPOSITORY` | UsersEntity |
| `USER_PROFILES_REPOSITORY` | UserProfilesEntity |
| `GOALS_REPOSITORY` | GoalsEntity |
| `WEIGHT_HISTORY_REPOSITORY` | WeightHistoryEntity |
| `EXERCISES_REPOSITORY` | ExercisesEntity |
| `ITERATIONS_REPOSITORY` | IterationsEntity |
| `TRAININGS_REPOSITORY` | TrainingsEntity |
| `MUSCLES_REPOSITORY` | MusclesEntity |
| `MUSCLE_GROUPS_REPOSITORY` | MuscleGroupsEntity |
| `EXCLUDED_MUSCLES_REPOSITORY` | ExcludedMusclesEntity |
| `EXCLUDED_EQUIPMENTS_REPOSITORY` | ExcludedEquipmentsEntity |
| `EQUIPMENTS_REPOSITORY` | EquipmentsEntity |
| `EQUIPMENT_GROUPS_REPOSITORY` | EquipmentGroupsEntity |
| `EXERCISE_EXAMPLES_REPOSITORY` | ExerciseExamplesEntity |
| `EXERCISE_EXAMPLE_BUNDLES_REPOSITORY` | ExerciseExampleBundlesEntity |
| `EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY` | ExerciseExamplesEquipmentsEntity |
| `EXERCISE_EXAMPLE_TRANSLATIONS_REPOSITORY` | ExerciseExampleTranslationEntity |
| `PUSH_TOKENS_REPOSITORY` | PushTokensEntity |

## Enum-контракты

Не выводи значения enum из английского отображаемого имени. Имена ключей и значения отличаются, регистр ключей неоднороден; перенос значения затрагивает DB enum и клиентов.

| Файл | Сохраненные значения / назначение |
|---|---|
| [experience.enum.ts](../../../../src/lib/experience.enum.ts) | `beginner`, `intermediate`, `advanced`, `pro`; профиль и catalog |
| [exercise-category.enum.ts](../../../../src/lib/exercise-category.enum.ts) | `compound`, `isolation` |
| [weight-type.enum.ts](../../../../src/lib/weight-type.enum.ts) | `free`, `fixed`, `body_weight`; это классификация, не замена components |
| [force-type.enum.ts](../../../../src/lib/force-type.enum.ts) | `push`, `pull`, `hinge` |
| [user-role.enum.ts](../../../../src/lib/user-role.enum.ts) | `default`, `admin` |
| [muscle-load.enum.ts](../../../../src/lib/muscle-load.enum.ts) | `low`, `medium`, `high`; в изученном `src` нет потребителя кроме объявления |
| [muscle-group.enum.ts](../../../../src/lib/muscle-group.enum.ts) | `chest_muscles`, `back_muscles`, `abdominal_muscles`, `legs`, `arms_and_forearms`, `shoulder_muscles` |
| [muscle.enum.ts](../../../../src/lib/muscle.enum.ts) | 21 тип мышц: 3 pectoralis; 4 back; rectus_abdominis/obliques; calf/gluteal/hamstrings/quadriceps/adductors/abductors; 3 deltoids; biceps/triceps/forearm |
| [equipment-group.enum.ts](../../../../src/lib/equipment-group.enum.ts) | `free_weight`, `machines`, `cable_machines`, `body_weight`, `benches_and_racks` |
| [equipment.enum.ts](../../../../src/lib/equipment.enum.ts) | Конкретное оборудование, сгруппированное комментариями. Сохраняй точные legacy values, в том числе `romain_chair`, `cord_handles`, неоднородные singular/plural |
| [goal.enum.ts](../../../../src/lib/goal.enum.ts) | Primary: build_muscle/get_stronger/lose_fat/return_to_training/maintain/general_fitness; secondary добавляет consistency; personalization — расписание, длительность, lifestyle/recovery/care/health/restrictions, sport, focus, qualities, program/routine/method/equipment preferences, phase |
| [i18n.types.ts](../../../../src/i18n/i18n.types.ts) | Отдельный string union/array `['en','ua','ru']`, default `en`; `uk` в storage enum отсутствует |

## Изменение схемы: что проверить

Сначала определи, является ли изменение только DTO/service или меняет metadata. Для нового поля проверь actual nullable/default, существующие rows, transformer, FK/unique/check/index, каскад и SQL имя. Для нового отношения проверь owning side и scalar FK. Для enum проверь все consumers и сохраненные значения. Регистрация сущности glob и DI token решают разные задачи. `migrationsRun` при пустом migrations array не доказывает наличие migration workflow; не придумывай migration files или команды.
