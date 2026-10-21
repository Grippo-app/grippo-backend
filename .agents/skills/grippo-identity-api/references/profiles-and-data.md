# Profile, персональные данные и push registry

## Модель ownership

| Entity / таблица | Связь и назначение | Источник |
|---|---|---|
| `UsersEntity / users` | identity, email/provider IDs/password/role; profile optional | [entity](../../../../src/entities/users.entity.ts) |
| `UserProfilesEntity / user_profiles` | отдельный UUID, owning 1:1 `user_id`, name/height/experience | [entity](../../../../src/entities/user-profiles.entity.ts) |
| `WeightHistoryEntity / weight_history` | many-to-one `profile_id`; хронология массы | [entity](../../../../src/entities/weight-history.entity.ts) |
| `GoalsEntity / goals` | owning 1:1 unique `profile_id`; одна текущая цель | [entity](../../../../src/entities/goals.entity.ts) |
| `ExcludedMusclesEntity / excluded_muscles` | profile ↔ muscle; персональное исключение | [entity](../../../../src/entities/excluded-muscles.entity.ts) |
| `ExcludedEquipmentsEntity / excluded_equipments` | profile ↔ equipment; персональное исключение | [entity](../../../../src/entities/excluded-equipments.entity.ts) |
| `PushTokensEntity / push_tokens` | many-to-one `user_id`, глобально unique token; profile не требуется | [entity](../../../../src/entities/push-tokens.entity.ts) |

Trainings также привязаны к profile. `usersRepository.delete({id})` не загружает entity graph: каскадное удаление опирается на FK `onDelete:'CASCADE'`, не на выполнение TypeORM cascade remove для предварительно загруженных children. Profile owning FK, weight, goal, exclusions и push FK имеют CASCADE в definitions; фактическую схему среды надо проверять отдельно при schema task.

Обязательность владельца в сервисе и SQL NOT NULL различаются: построенные без подключения metadata показывают nullable `user_profiles.user_id`, `weight_history.profile_id` и `push_tokens.user_id`; профильный `user_id` при этом unique. `goals.profile_id` объявлен отдельной UUID column, metadata — nonnull и unique. Не объявляй всю цепочку user → profile → goal обязательной: user может существовать без profile, profile без goal, а прямой импорт может создать profile с null user FK. API создания профиля всегда задаёт user и первой записи веса — profile.

Repository tokens задаются централизованно в [repository.providers.ts](../../../../src/database/repository.providers.ts): `USERS_REPOSITORY`, `USER_PROFILES_REPOSITORY`, `GOALS_REPOSITORY`, `WEIGHT_HISTORY_REPOSITORY`, `EXCLUDED_MUSCLES_REPOSITORY`, `MUSCLES_REPOSITORY`, `EXCLUDED_EQUIPMENTS_REPOSITORY`, `EQUIPMENTS_REPOSITORY`, `PUSH_TOKENS_REPOSITORY`. Источники бизнес-логики: [UsersService](../../../../src/modules/users/users.service.ts), [WeightHistoryService](../../../../src/modules/weight-history/weight-history.service.ts), [PushTokensService](../../../../src/modules/push-tokens/push-tokens.service.ts).

## Создание profile

`createProfile(userId,dto)` начинает READ COMMITTED transaction; внутри берёт через transaction manager users/profiles/weights/exclusions repos. Последовательность:

1. Найти и заблокировать user по ID через pessimistic_write → 404 если нет.
2. Проверить profile по user relation → 400 `User profile already created`, если есть.
3. Проверить непустые exclusion списки через manager с for_key_share; один lowercase/deduplicated список используется и для поиска, и для записи. Неизвестные references → 404 до создания profile. Создать и сохранить profile с `name,height,experience`.
4. Создать первый weight с profile ID и `dto.weight`.
5. Очистить exclusions для нового profile, затем при непустых input списках сохранить rows с `muscleId`/`equipmentId`.
6. Commit; после transaction `getUser(userId)` собирает response.

Все write actions в этой transaction используют manager-derived repositories. Не переноси последующий read response внутрь другого injected repo как будто он автоматически видит uncommitted transaction.

Profile creation и replacement methods нормализуют exclusions как множество: lowercase UUID, без повторов, порядок первого появления сохранён. Unique пары profile/reference в entities нет; прямые writers могут обойти сервис. DTO профиля имеет IsArray для exclusions, bounds 30–300 для веса и positive int4 bounds 1–2147483647 для роста; см. [API map](api-map.md).

User row lock сериализует concurrent createProfile для одного user в этом сервисном пути; второй вызов перечитывает profile после lock. Relation uniqueness остаётся отдельной защитой; прямые writers не обязаны следовать сервисному протоколу.

## Чтение и update profile

`getUser` выполняет user/profile query с explicit projection. User без profile возвращается с `profile:null`, `stats` со всеми нулями. Если profile есть, в `Promise.all`:

- Последний вес: select только weight, filter `weights.profile_id`, order `weights.createdAt DESC`, limit 1. При отсутствии записи `weight:null`; дополнительного tie-breaker для одинакового createdAt нет.
- Stats: `COUNT(trainings.id)`, `COALESCE(SUM(duration|volume|repetitions),0)` по profile ID, преобразование PostgreSQL aggregate strings к number/float.

Duration берётся в единице сохранённого `training.duration`; response DTO сознательно не конвертирует её. Не вводи пересчёт volume/repetitions из exercises в рамках изменения profile response.

`updateExperience` и `updateHeight`: `requireProfile(userId)` → изменить/save только если значение отличается → `getUser`. Оба HTTP DTO роста проверяют integer 1–2147483647; это положительное значение в диапазоне storage, без более узких антропометрических правил. В сервисе дополнительной DTO-валидации нет. Empty-name limit не задан. Отсутствующий profile → 400.

## Exclusions

Get methods сначала требуют profile; загружают reference + group и возвращают ручные `MuscleResponse[]`/`EquipmentResponse[]`. Это персональный список исключённых сущностей, не фильтрация глобального каталога внутри этих методов.

Replacement methods:

1. Require profile.
2. Открыть READ COMMITTED transaction, через manager заблокировать profile pessimistic_write; при его отсутствии → 400.
3. Привести IDs к lowercase, убрать повторы и через manager выполнить `referenceRepository.findBy({id:In(normalizedIds)})`.
4. Если число найденных сущностей отличается от длины normalized списка → 404 `One or more muscle/equipment IDs are invalid`.
5. Тем же manager удалить все exclusions profile и создать/save rows на каждый normalized ID. После commit вернуть `{ids:normalizedIds}`.

`[]` очищает список. Повтор одного валидного ID схлопывается; неизвестный ID по-прежнему даёт 404. Delete/save атомарны; ошибка insert откатывает прежний список. Profile lock сериализует эти replacement methods для одного profile. Это не гарантия для прямых SQL writers, не соблюдающих протокол lock.

## Goal

`setGoal` требует profile и ищет по unique `profileId`. Это создание/полная замена набора полей текущей цели, а не PATCH:

- `primaryGoal` берётся из обязательного DTO.
- `secondaryGoal = dto.secondaryGoal ?? null`.
- `target = dto.target ? new Date(dto.target) : null`; запрос до этого проходит `IsDateString`.
- `personalizations = dto.personalizations ?? []`.
- `confidence = 1.0` как при создании, так и обновлении.
- `lastConfirmedAt` не изменяется этим методом.

`confidence` — `decimal(3,2)` с transformer и check 0–1, но клиент не может задать его через DTO. `lastConfirmedAt` nullable хранится, подтверждение отдельным endpoint в изученном API не реализовано. Target — timestamp without timezone, это не numeric target weight.

`getGoal` у текущего user: profile обязателен; нет goal → null. `getGoalByUserId` у admin: сначала user existence (404), нет profile/goal → null. Controllers явно `res.json(goal)` с passthrough для буквального JSON null; замена на обычный `return null` может поменять body контракта.

[Goal enum](../../../../src/lib/goal.enum.ts) задаёт primary: `build_muscle,get_stronger,lose_fat,return_to_training,maintain,general_fitness`; secondary включает ещё `consistency`. `GoalPersonalizationKeyEnum` содержит schedule/duration/lifestyle/recovery/care/health/movement/sport/focus/preferences/phase tags. Комментарии описывают их как soft AI context, но отдельного AI generation consumer/интеграции в рассматриваемом коде нет: текущий функционал сохраняет/выдаёт enum array. Не объявляй эти tags реально работающим hard safety filter или generated-training logic. DTO не проверяет противоречащие tags, повторы или отличие primary/secondary.

## Weight history

Таблица: UUID, `weight decimal(5,1)` (transformer `parseFloat`), createdAt/updatedAt timestamp without timezone, CASCADE profile FK, DB check 30–300. Дата записи определяется DB created timestamp; client date в DTO не принимается.

- Current-user list/add требуют profile, нет profile → 400.
- Admin `getWeightHistoryByUserId`: нет profile → `[]`, существование user отдельно не проверяется.
- List целиком, без pagination/range, сортировка только createdAt DESC.
- Add сохраняет новую row; не обновляет scalar в profile. `GET /users.profile.weight` определяется последней row.
- Add DTO 30–300 без `maxDecimalPlaces`; input precision не равно storage precision. Profile DTO также требует 30–300 и дополнительно одно decimal place.
- Delete: после requireProfile открывает READ COMMITTED transaction, блокирует profile pessimistic_write, считает weights владельца; `count <= 1` → BadRequestException. Затем тем же manager удаляет по **id и profile_id**; возвращает `DeleteResult`.

**Выводы по коду:** последняя запись даёт HTTP 400. Неизвестный/чужой валидный UUID при count > 1 может дать 200 affected 0, не 404. При count <= 1 ошибка возникает до проверки target ID. Profile lock сериализует удаления этим методом, но не задаёт DB constraint для любых writers. Path id проходит ParseUUIDPipe; malformed UUID отвергается до service. Owner predicate сохраняй при любом redesign.

## Push registry

`upsertToken(userId,token)` строит один insert с `.orUpdate(['user_id'],['token'])`: **overwrite user_id при конфликте unique token**. Аргументы — update columns, conflict target. Это не `ON CONFLICT(user_id)` и не one token per user.

Следствия из schema/query:

- Один user может иметь много tokens, один token принадлежит максимум одному user.
- Повтор token с другим user переносит ownership на нового user.
- Старые tokens того же user при регистрации нового не удаляются.
- `createdAt` не является lastSeen: update columns не включают created_at и updatedAt в entity нет.
- Нет `deviceId`, platform, expiry/cleanup, provider check или token validity check.
- `deleteAllForUser` удаляет все user tokens, не текущий device. Login/refresh сами registry не меняют.
- Admin list выдаёт token plaintext, order createdAt DESC; неизвестный user/без tokens → `[]`.
- Table FK прямо к UsersEntity позволяет регистрацию device до profile creation; удаление user каскадно удаляет tokens.

В `src` нет FCM/APNs send implementation; пример `fcm-token-abc123` в Swagger не означает подключённый Firebase Admin SDK. Для задачи реальной доставки потребуется отдельное проектирование provider/service/config, а не только расширение registry DTO.

## Изменения: контроль границ

При добавлении profile field проверь entity/default/nullable + create/update DTO + ручные user/admin response mappings. Entity field само не появится в ручном response. При изменении ownership проверь обе поверхности current-user/admin; при изменении user deletion — полный FK граф и JWT existence checks. Schema writes/операционные действия выполняй только в рамках соответствующей задачи, не в качестве «проверки» этих заметок.
