# Сценарии доменных изменений

Опирайся на [entity-map](entity-map.md), [trainings-and-metrics](trainings-and-metrics.md) и [catalog-and-dictionaries](catalog-and-dictionaries.md). Ниже — предметные сценарии; общий порядок ревью задаёт [grippo-review](../../grippo-review/SKILL.md), команды и ограничения проверок — [grippo-verification](../../grippo-verification/SKILL.md).

## Изменить существующий endpoint / DTO

1. Найди controller decorator, pipes, guards, статус и вызываемый service. Для admin найди метод в единственном [AdminController](../../../../src/modules/admin/admin.controller.ts).
2. Сверь DTO с global ValidationPipe в [main.ts](../../../../src/main.ts): Swagger property не разрешает body field; class-validator decorators разрешают. Проанализируй absent/null/false/0, nested object/array и extra fields.
3. Проследи source поля: request, computation, entity column, relation или response-only property. Для `components` нет DB column; для groupId есть response mapping; для profile FK используется profile ID.
4. Зафиксируй исходный статус/shape и предполагаемое новое поведение. Изменение consumer DTO или enum требует оценки совместимости; соседние mobile/admin проекты не считай прочитанными, если они не доступны.
5. Не меняй маршруты query-ID на path-ID, null на 404, единицы intensity или полную замену на PATCH попутно. Подтверждённый дефект вне задачи опиши отдельно.

## Добавить поле entity / отношение

Это workflow для уже разрешенного изменения схемы, не разрешение запускать sync/deploy.

1. Определи owning side, SQL имя через SnakeNamingStrategy и существующий FK scalar. Проверь все readers/writers и response serialization.
2. Оцени существующие rows: null/default/backfill, conversion, numeric precision/scale, enum compatibility, unique/check/index, onDelete/orphan actions.
3. Сохрани актуальный механизм entity glob. Создай repository token только если потребуется injection; operation через transaction manager может работать без отдельного token, как components.
4. Для новой cross-entity операции используй `manager.transaction`, читай и пиши через этот manager. Не копируй outside-manager reads из trainings как рекомендуемый pattern.
5. Проверь metadata без подключения к БД, если доступна существующая TypeORM среда: число entity, column name/type/nullability, owning relation/FK action, uniqueness, decimal transformers. Такой результат не доказывает совместимость с production rows.
6. Проект не содержит настроенных migrations. Не создавай migration folder/toolchain как побочный эффект. Для схемы, backup и восстановления следуй [политике эксплуатации](../../grippo-operations/references/deployment-policy.md); проверка metadata не разрешает запуск.
7. Проверь каскад от user до leaves и независимо от dictionary/example до связей. Сохрани историю exercises: текущий DB example FK SET NULL, текущий delete API service guard 409.

## Изменить тренировки

1. Перечитай controller/DTO/service; различай create, полную replacement update, list/detail и admin variant.
2. Подтверди `user.id → profile.id` и owner filter до mutation. При transaction используй manager также для ownership/reference checks в изменяемой операции.
3. Объясни, должны ли children сохранять ID. Текущее поведение генерирует новые на каждом PUT; стабильные ID потребуют отдельного контрактного решения.
4. Не пересчитывай агрегаты автоматически, пока задача не определит units, effective weight, null policy и consistency между training/exercise/iteration.
5. Сохрани позиционные orderIndex и JS sorting. Проверь исторический bodyMultiplier и неполный/удаленный example.
6. Для запроса optimize сравни join cardinality, число запросов, date predicates и реальные доступные indices. `date(created_at)` может ограничить использование обычного timestamp index — это гипотеза для EXPLAIN, не измеренная деградация.
7. Проверь rollback при поздней invalid example ссылке, доступ другого user, новые UUID после replacement, boundary dates, public components/localization.

Для retry/потерянного ответа применяй раздел «Неопределённый исход записи» в
[review protocol](../../grippo-review/references/review-protocol.md).
[createTraining](../../../../src/modules/trainings/trainings.service.ts) генерирует
новый UUID при каждом вызове: повтор после уже совершённого commit может создать
вторую training. PUT также пересоздаёт children/IDs и timestamps; одинаковый body
не доказывает сохранение всех эффектов. Сценарий проверки — commit завершился,
ответ потерян, затем повтор; обычный rollback case его не покрывает.

## Изменить каталог / components / переводы

1. Раздели localized public read и stored admin editor endpoint. Не формируй editable translations из fallback response.
2. Для write определись с replacement semantics; текущий PUT удаляет все прежние bundles/refs/translations. DTO требует непустые bundles, integer percentages 0..100 и сумму 100; equipmentRefs обязателен, но может быть []. Дубли muscleId/equipmentId не запрещены. Сервис не нормирует percentages и не заменяет DTO checks DB-ограничениями.
3. Для components проверь обязательный object parent и четыре обязательных nullable ключа, массив вместо объекта/ветви, null против required:false, external/body exclusivity, extra/assist dependency, multiplier bounds/precision и все-null форму. Текущий DTO сочетает IsDefined/IsObject с nested validation; массив вместо объекта отвергается до сервиса.
4. Сверь DTO ↔ service validation ↔ DB checks ↔ оба read builders (catalog/training). Загрузка entity требует componentsEntity, публичная выдача его удаляет.
5. Для imports не предполагай components PK=example FK: эту форму задает service, не DB check. Не заменяй existing row новым PK без проверки unique FK.
6. Для перевода проверь trim, повтор языка, en absent/null, name-only/description-only row, массив вместо localized row и base fallback. Учитывай locale storage `ua`.
7. Проверь global popularity sort отдельно от personal stats; exclusions не являются фильтром; delete used example →409 и rollback writes. Для array/percentage validation и HTTP POST/PUT используй существующие [DTO spec](../../../../src/modules/exercise-examples/dto/exercise-example.request.spec.ts) и [admin controller spec](../../../../src/modules/admin/admin.controller.spec.ts); guards/services в HTTP spec подменены, реальную authorization/DB behavior он не доказывает. Не называй specs прошедшими без актуального запуска.

## Изменить метрики

1. Найди уровень данных: iteration bestWeight/maxRepetitions, exercise bestTonnage/intensity/lifetime/recent, training user summary.
2. Сохрани profile filter **во всех** queries; параллельные aggregates не должны снимать tenant scope.
3. Определи units и ties. Не объявляй sessionsCount уникальными тренировками без DISTINCT; не нормируй intensity по DTO example.
4. Сверь SQL/JS effectiveWeight, `?? 0/1`, bodyMultiplier из iteration, nullable returns и числовую конверсию raw aggregates. Для nullable decimals проверь driver hydration: `parseFloat(null)` дает NaN, `??` его не заменяет, JSON превращает NaN в null.
5. Проверь несколько records одного example в одной training, разные profiles, пустую историю, tie timestamps, null/0/negative/NaN values и итоговый JSON. Значения могут быть legacy и не удовлетворять предполагаемой будущей валидации. Plain objects с null не заменяют fixture реально hydrated entity.
6. Сохрани двухэтапную recent выборку или докажи корректность нового pagination с joins. Сортировка iterations остается независимой.

## Наблюдения, которые нельзя принимать за желаемые требования

Следующие пункты подтверждены чтением кода; они не являются разрешением изменять runtime в задаче настройки skills.

| Наблюдение | Следствие / что проверять при соответствующей задаче |
|---|---|
| Training by ID возвращает null при miss; UUID pipes на training IDs отсутствуют | Документация «всегда 404/400» была бы неверна; отдельно проверяй фактический HTTP |
| Training nested arrays без IsArray/IsDefined | Actual ValidationPipe ранее подтвердил acceptance missing training.exercises; далее сервис ожидает .entries(). Catalog bundles/refs в текущем DTO уже required arrays; не переносить старый catalog risk на новый код |
| LocalizedText.value optional только для undefined | ValidateIf(value !== undefined) + IsString отвергает explicit null; отсутствие value допустимо, empty string после trim → null в storage |
| Localized arrays имеют IsObject(each:true) и nested validation | name:[[]] отвергается; ArrayNotEmpty всё ещё не гарантирует непустой текст |
| id в request classes без validators | Entity round-trip с id несовместим с forbidNonWhitelisted |
| Reads через injected repo внутри training transaction | Нет единой гарантии transaction connection для этих чтений; новая логика должна использовать manager |
| Ownership/usage проверки вне transaction либо без locking | Есть окно конкуренции; отсутствие гонок тестом одного запроса не доказано |
| Каталог read зависит от наличия components у каждой entity | Неполный example может сломать список и связанные trainings |
| Components parent обязателен object; четыре ключа обязательны и nullable | Swagger ApiProperty и runtime IsDefined/IsObject согласованы; поддерживать явные null в clients, массивы не допустимая форма |
| muscle size/sensitivity numeric имеют Number/null transformer | Entity hydration и raw SQL различаются; наличие TS number само по себе тип ответа не гарантирует |
| iteration nullable weight/bodyMultiplier transformers сохраняют null | В текущем IterationsEntity from использует value === null ? null : parseFloat(value); прежний вывод о NaN из hydrated SQL null больше не описывает этот путь. Raw SQL и нечисловые значения требуют отдельной проверки |
| Catalog API checks и DB constraints различаются | Текущий DTO проверяет percentage integer 0..100 и total100; DB этого не проверяет, direct service/import обходят pipe. Unique pairs/dedup отсутствуют на обоих уровнях |
| Training aggregates приходят от клиента | Метрики и training summary могут расходиться с iterations |
| Catalog exclusions repos injected, но в queries не используются | Не обещать фильтрацию, не удалять данные по exclusions |
| Update тренировки пересоздает children | exercise.createdAt/lastUsed/recent меняются при редактировании |
| Goal comments говорят об AI context | Нельзя заявлять наличие AI generation/inference integration по этим enum |
