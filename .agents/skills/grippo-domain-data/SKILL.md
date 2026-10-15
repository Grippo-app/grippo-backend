---
name: grippo-domain-data
description: "Изменять и исследовать TypeORM-сущности Grippo, связи и repository DI, тренировки и подходы, каталог exercise-examples/components/translations, справочники muscles/equipments и exercise-metrics. Использовать для запросов, транзакций, каскадов, доменных DTO, агрегатов и изменений схемы в этих областях; auth и эксплуатация требуют своих проектных skills."
---

# Grippo: домен и данные

Перед изменением перечитай затронутый код. Карта ниже помогает найти файлы,
но не заменяет проверку реализации.

## Выбор контекста

- Сущности, FK, enum, каскады, nullable, decimal, DI: [entity-map.md](references/entity-map.md). Здесь все 19 entity, 18 repository tokens и карта удаления.
- Тренировки, порядок exercises/iterations, статистика и формулы: [trainings-and-metrics.md](references/trainings-and-metrics.md).
- Каталог, компоненты веса, словари, переводы, административный CRUD: [catalog-and-dictionaries.md](references/catalog-and-dictionaries.md).
- Реализация изменения, проверка или расследование дефекта: [workflows-and-review.md](references/workflows-and-review.md).

## Правила работы с данными

1. Проверь controller, request DTO, service, entity/query и response.
   Для пользовательских данных проследи связь `user.id → profile.id`:
   эти ID относятся к разным таблицам.
2. Сохраняй схему DI из [repository.providers.ts](../../../src/database/repository.providers.ts).
   Сущности автоматически загружаются по glob из [database.service.ts](../../../src/database/database.service.ts).
   Repository token нужен только при DI-инъекции. `ExerciseExampleComponentsEntity`
   работает через transaction manager без отдельного token.
3. Изменение entity меняет описание PostgreSQL-схемы. Сначала оцени влияние
   на существующие данные, FK, nullable/default, точность numeric и `synchronize`.
   Не запускай приложение, deploy, синхронизацию схемы, restore или SQL-запросы,
   меняющие данные/схему, ради проверки документации. Миграций в конфигурации нет.
4. Для новой или изменяемой атомарной операции используй переданный transaction
   manager во всех запросах транзакции; injected repositories работают вне неё.
5. Сохраняй публичные форматы: `PUT /trainings?id=…`; создание возвращает `{ id }`;
   каталог возвращает `{ entity, usageCount, lastUsed }`; публичный `components`
   заменяет внутренний `componentsEntity`. Исторические exercises/iterations
   имеют свои ID и значения веса.
6. Не приписывай серверу отсутствующую бизнес-логику: суммы тренировки приходят
   от клиента; exclusions не фильтруют каталог; goal tags сохраняются как контекст;
   метрика `sessionsCount` считает exercises.
7. Для предметных сценариев используй [workflows-and-review.md](references/workflows-and-review.md), для порядка ревью — [grippo-review](../grippo-review/SKILL.md), для выбора и выполнения проверок — [grippo-verification](../grippo-verification/SKILL.md).
8. При изменении entities/FK/constraints/defaults, ownership, транзакций,
   блокировок и CRUD каталога/тренировок актуализируй `test/postgres/` и запусти
   полную suite по [PostgreSQL checks](../grippo-verification/references/checks.md).
   Для найденного дефекта добавляй regression case; не ослабляй проверки ради PASS.

Если задача касается профиля, goals, exclusions, weight-history, push tokens или
auth, используй карту связей здесь, а HTTP/auth поведение уточни в соответствующем
проектном skill. Не расширяй изменение каталога до переделки этих модулей.
