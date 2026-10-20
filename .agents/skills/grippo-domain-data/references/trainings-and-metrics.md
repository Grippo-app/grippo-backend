# Тренировки, упражнения, подходы и метрики

Источники: [TrainingsController](../../../../src/modules/trainings/trainings.controller.ts), [TrainingsService](../../../../src/modules/trainings/trainings.service.ts), [TrainingsRequest](../../../../src/modules/trainings/dto/trainings.request.ts), [ExerciseMetricsController](../../../../src/modules/exercise-metrics/exercise-metrics.controller.ts), [ExerciseMetricsService](../../../../src/modules/exercise-metrics/exercise-metrics.service.ts), [metric response DTO](../../../../src/modules/exercise-metrics/dto/exercise-metrics.response.ts).

Содержание: HTTP; request и persistence; чтение/порядок; обновление и удаление; формулы метрик; ограничения; целевые проверки.

## HTTP-контракт тренировок

На всем `TrainingsController` стоит `JwtAuthGuard`. Locale берется из `req.locale`, иначе `ExerciseExampleI18nService.resolveLanguage()`.

| Метод и маршрут | Вход | Выход / фактическая семантика |
|---|---|---|
| `GET /trainings?start=…&end=…` | start/end строки, без DTO | 200, trainings только текущего profile, диапазон включает обе календарные даты |
| `GET /trainings/:id` | id через ParseUUIDPipe | 200; service возвращает entity либо null при отсутствии/другом владельце, без NotFound; JSON `null` как тело не гарантируется |
| `POST /trainings` | `TrainingsRequest` | 201 `{id}`, training + children в транзакции |
| `PUT /trainings?id=…` | query id через ParseUUIDPipe, полный `TrainingsRequest` | 204; заменяет все exercises/iterations, 404 при отсутствии/другом владельце |
| `DELETE /trainings/:id` | id через ParseUUIDPipe | 204, 404 при отсутствии/другом владельце |
| `GET /admin/users/:id/trainings?start=…&end=…` | user ID проходит ParseUUIDPipe, admin guards | 200; тот же fetch по profile; если profile нет, `[]` **до валидации dates** |

Административный вход находится в [AdminController](../../../../src/modules/admin/admin.controller.ts), который применяет `JwtAuthGuard, AdminOnlyGuard`. Не добавляй туда логику подсчета или ручные join.

`requireProfile(user)` проверяет строковый `user.id`, ищет profile через `{user: {id: userId}}`; отсутствие user/profile дает BadRequest с `User not authenticated` / `User profile not created yet`. Guard и service отвечают за разные уровни проверки.

## Request, DTO и сохраненные величины

`TrainingsRequest`: duration/repetitions int; volume/intensity — конечные number, которые `RoundAggregate` округляет до 1/2 decimals перед validation. `TrainingExerciseRequest`: name string; те же volume/repetitions/intensity; iterations nested; exerciseExampleId optional UUID. `ExerciseIterationRequest`: repetitions int; четыре веса optional nullable number с 1 decimal; bodyMultiplier optional nullable number с 2 decimals. У iteration нет округления: лишняя точность отклоняется.

- Duration описана как минуты, volume как кг; intensity описана как проценты в training DTO. Никакого нормирования 0..1/0..100 нет; metric DTO пример `0.85` сам по себе не меняет семантику.
- DTO ограничивает signed диапазоны под storage: int −2147483648..2147483647; volume ±999999999.9; intensity ±999.99; веса ±9999.9; multiplier ±99.99. Отрицательные значения в этих пределах допустимы. Transform не приводит строки и не исправляет нечисловые/неfinite значения или число за пределом диапазона; validators их отклоняют.
- Сервер **не пересчитывает** training/exercise volume, repetitions, intensity по approaches. Значения могут расходиться. Пользовательские summary и lifetime/bestTonnage читают эти сохраненные агрегаты.
- Сервер не сверяет iteration весовые поля с актуальным `exerciseExample.components`; исторический `bodyMultiplier` хранится в iteration самостоятельно.
- `TrainingExerciseRequest.id` и `ExerciseIterationRequest.id` объявлены без validators. При global whitelist+forbidNonWhitelisted это не разрешенные request поля; отправка полученного entity обратно целиком не является корректным request.
- Exercises/iterations обязательны через IsDefined/IsArray, элементы — IsObject(each:true) + ValidateNested/Type. Отсутствие, null, скаляр, object вместо array и array вместо row отклоняются. ArrayNotEmpty отсутствует: пустые arrays допустимы.

### Создание

`createTraining` сначала разрешает profile, затем `trainingsRepository.manager.transaction`:

1. Отделяет `exercises`, создает training из остальных полей, задает `v4()` и profile.id, `manager.save`.
2. Для каждого exercise отделяет iterations/exerciseExampleId. Если example ID truthy, выполняет `manager.findOne(ExerciseExamplesEntity)` с `for_key_share`; отсутствие дает `BadRequest('Invalid exerciseExampleId: …')`.
3. Создает exercise с новым v4, FK training, example ID либо null, `orderIndex` из позиции массива; сохраняет manager.
4. Создает iterations с новыми v4, exerciseId и позиционным orderIndex; сохраняет manager.
5. Возвращает ID тренировки. Поле createdAt из request не принимается — дата назначается persistence.

Проверка ссылок и writes в callback используют один manager; `for_key_share` удерживает referenced example от конкурентного удаления до завершения transaction. Первоначальный requireProfile выполняется до transaction. Не объявляй весь feature защищённым от любых гонок по одному этому lock.

### Обновление

`updateTraining` не является PATCH:

1. Разрешает profile, открывает transaction.
2. Через manager читает `{id, profileId}`; при miss бросает NotFound. Явного parent lock в этом чтении нет.
3. Через manager обновляет training по `{id}`, передает агрегаты и profileId.
4. `manager.delete(ExercisesEntity, {trainingId: id})`: FK каскадирует iterations.
5. Заново создает все exercises/iterations, новые UUID и orderIndex из массивов, с теми же проверками example.

ID тренировки сохраняется; ID, createdAt и updatedAt дочерних rows меняются. Это влияет на catalog lastUsed (`MAX(ex.createdAt)`), metric timestamps, recent ordering и внешние ссылки на exercise/iteration. Не обещай стабильность child ID и «дату фактического выполнения», пока контракт не изменен явно.

### Удаление

`deleteTraining`: разрешает profile, find `{id, profileId}`, NotFound при miss, затем `delete({id, profileId})`. Отдельной транзакции нет. DB каскадирует exercises → iterations. Удаление training не удаляет example/muscle/equipment.

## Чтение, локализация и порядок

`fetchTrainingsForProfile` требует непустые после trim строки start/end и успешный `moment(...).isValid()`, иначе `BadRequest('Wrong date format')`. Отсутствие query отвергается этим service check. Проверки `start <= end` нет; `date(:start) <= date(created_at) <= date(:end)` работает по календарным датам, не timestamp границам. Swagger `required: true` сам validation не создаёт; строгого ISO parser здесь нет.

Список загружает training.exercises → exerciseExample → componentsEntity/translations и exercises.iterations. Detail дополнительно загружает exerciseExampleBundles → muscle. Оборудование в этом fetch не загружается; не ожидай в training response весь каталог.

SQL сортирует training.created_at ASC, затем exercises.order_index/created_at ASC, iterations.order_index/created_at ASC. После SQL сервис повторно сортирует JS collections по `(orderIndex ?? 0)`, затем createdAt; training list — по createdAt.

Для каждого exercise:

- i18n меняет name/description вложенного example и удаляет translations; собственное exercise.name остается.
- `attachComponentsToExerciseExample` допускает отсутствующий/null example; для существующего example без componentsEntity бросает BadRequest. Одна неполная запись каталога может сорвать чтение связанных тренировок.
- Сервис строит `components`, удаляет `componentsEntity`. Helper продублирован в catalog service; изменение формы требует проверки обоих путей.

## Метрики

На `ExerciseMetricsController` стоит `JwtAuthGuard`. `:id` — exerciseExampleId, проходит ParseUUIDPipe.

| Endpoint | Поведение |
|---|---|
| `GET /exercise-metrics/exercise-example/:id/achievements` | 200 объект с bestWeight, bestTonnage, maxRepetitions, peakIntensity, lifetimeVolume; каждая часть nullable |
| `GET /exercise-metrics/exercise-example/:id/recent?limit=10` | ParseIntPipe + default 10; service clamps 1..100; 200 exercises с iterations |

Profile обязателен; сами example existence и access к каталогу не проверяются. Для валидного несуществующего UUID будут пустые данные/nullable achievements, а не обязательный 404.

`getAchievements` запускает пять независимых запросов через `Promise.all`. Каждый фильтруется через `training.profileId = profileId` и `exercise.exerciseExampleId = id`.

| Metric | Источник, сортировка, выход |
|---|---|
| bestWeight | iteration + joined exercise; SQL формула ниже DESC, tie iteration.createdAt DESC; iterationId/exerciseId/exampleId/weight/createdAt |
| bestTonnage | exercise.volume IS NOT NULL; volume DESC, exercise.createdAt DESC; возвращает сохраненный volume как tonnage |
| maxRepetitions | iteration.repetitions IS NOT NULL; repetitions DESC, iteration.createdAt DESC |
| peakIntensity | exercise.intensity IS NOT NULL; intensity DESC, exercise.createdAt DESC; возвращает сохраненное число без нормирования |
| lifetimeVolume | COALESCE(SUM(exercise.volume),0), COUNT(exercise.id), MIN/MAX exercise.createdAt; при count 0 возвращает null |

```text
effectiveWeight = (externalWeight ?? 0)
                + (bodyWeight ?? 0) * (bodyMultiplier ?? 1)
                + (extraWeight ?? 0)
                - (assistWeight ?? 0)
```

SQL использует COALESCE, JS — `??`. Текущие transformers всех пяти весовых полей сохраняют SQL null, поэтому null получает указанные defaults в обоих путях. Прежнее преобразование SQL null в NaN исправлено; не описывай его как текущий дефект. Для специальных нечисловых значений и raw SQL соответствие нужно проверять отдельно: `??` не заменяет NaN, а JSON сериализует NaN как null.

Нулевой **числовой** multiplier сохраняется как 0 благодаря `??`; `|| 1` изменит смысл. Формула не читает актуальные components каталога, не умножает на repetitions и не обрезает отрицательный результат до 0. При проверке исправления используй реально hydrated values, а не только plain JS fixtures с null.

`lifetimeVolume.sessionsCount` — **COUNT exercises, не DISTINCT trainings**: два одинаковых exerciseExample в одной training дают count 2. Общая пользовательская статистика в [UsersService.getTrainingStats](../../../../src/modules/users/users.service.ts) отдельно считает trainings и суммирует training.duration/volume/repetitions; это другой уровень агрегации.

Recent сначала берет top N exercises.createdAt DESC, затем одним `find({exerciseId: In(ids)})` читает iterations, группирует Map и сортирует по orderIndex/createdAt ASC. Не переносить `.take(limit)` на query с joined iterations без проверки, что limit ограничивает упражнения, а не строки join. Возвращаются исторические поля exercise и iterations, без загруженного exerciseExample и locale transform.

## Целевые сценарии проверки при изменениях

- Владение: разные users/profiles, чужой training ID, отсутствие профиля; admin no-profile → [].
- Структура: пустые массивы, отсутствующий массив, object вместо array, extra `id`/`orderIndex` в request; не полагайся только на TS тип.
- Порядок: два exercises, по два iterations, несовпадающие timestamps, повторяющийся orderIndex/legacy default 0.
- Транзакция: невалидный example на позднем exercise не оставляет частично созданную training; update rollback восстанавливает прежних children.
- Даты: одноименные день/время, обе граничные даты, reversed range, missing query, invalid input; не заявляй строгое ISO validation только по moment().
- Метрики: external-only; body×multiplier; +extra; −assist; null multiplier; каждый nullable вес после driver hydration, NaN и JSON weight:null; нулевые/отрицательные величины в существующих rows; ties; разные profiles; несколько exercises того же example в одной training; отсутствующая история.
- HTTP и serializers: public components без componentsEntity/translations; list/detail relation sets различаются; request и response нельзя считать взаимозаменяемыми.
