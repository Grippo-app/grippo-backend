---
name: grippo-identity-api
description: "Изменять и проверять Grippo auth/JWT, Google/Apple login, users/profile/goals, weight history, push token registry, admin authorization, HTTP/Swagger/DTO и i18n exercise examples. Применять при работе с этими потоками и их API контрактами."
---

# Grippo identity и API

При исследовании начни с controller, затем проверь request DTO, guards, service,
repository/entity и response. В HTTP guards работают до pipes/DTO и вызова
controller; полная последовательность — в [архитектуре](../grippo-architecture/references/architecture.md).
Перед изменением сверь затронутый код. Обнаруженный риск сам по себе не разрешает
менять соседние потоки.

## Выбери нужную карту

- Endpoint, роль, статус, тело запроса/ответа: [api-map.md](references/api-map.md).
- Вход по паролю, привязка Google/Apple, JWT/refresh, создание первого admin: [auth-and-integrations.md](references/auth-and-integrations.md).
- Профиль, goals, exclusions, веса, проверка владельца push tokens и удаление: [profiles-and-data.md](references/profiles-and-data.md).
- `Accept-Language`, fallback, переводы, валидация, HTTP-логи, Swagger: [localization-and-http.md](references/localization-and-http.md).
- Предметные сценарии проверки identity/API: [review-loop.md](references/review-loop.md).

Выбери только нужные references и смежные границы. Например, при изменении веса
профиля проверь профиль, DTO веса и ответ API.

## Границы и инварианты

- `UsersEntity.id` — ID пользователя; `UserProfilesEntity.id` — отдельный ID
  владельца тренировок, весов, exclusions и goal. Передавать user ID как profile ID ошибочно.
- Auth возвращает `{id, accessToken, refreshToken}`, не создаёт профиль.
  `GET /users` допускает `profile: null` и нулевую статистику.
- Bearer access JWT содержит `id`; роль при каждом запросе читается из БД.
  Admin route требует `JwtAuthGuard` перед `AdminOnlyGuard`.
  Публичные auth routes не наследуют глобальный guard.
- Для пользовательских данных владелец определяется по `req.user.id`, не по body/query.
  Административные endpoints имеют другие ответы при отсутствии профиля.
- Глобальный `ValidationPipe` включает `transform`, `whitelist`, `forbidNonWhitelisted`.
  Декораторы Swagger и типы TypeScript не заменяют валидаторы. В текущем коде
  refresh извлекает скаляр через `@Body('refreshToken')`, без DTO.
- DI использует существующие `'<NAME>_REPOSITORY'` tokens и feature modules.
  Запись в транзакции использует переданный `manager`, не injected repository.
  Не вводи новую обёртку ORM ради отдельного endpoint.
- `translateExample` мутирует загруженный объект и убирает массив `translations`. Не сохраняй результат локализации ответа обратно в БД.
- Изменение DTO, enum, текстов ошибок guards, status/null/body или кодов локали —
  изменение контракта. Найди вызывающий код в доступном проекте; не заявляй
  о проверке mobile/admin, если их код не был доступен.
- Значения `.env`, закрытые ключи, OAuth codes, JWT, push tokens и содержимое дампа
  не нужны для анализа кода. Для интеграционных проверок используй изолированные
  fixtures/mocks в разрешённых рамках задачи. Сам skill не разрешает вход
  в production, deploy или изменение БД.

## Изменение и проверка

Зафиксируй существующий контракт и требуемое изменение, включая отрицательный
сценарий и границу владельца/роли. Проверь DTO, controller, service, entity,
module и response; изменяй только нужные звенья. Разделяй реализованную защиту,
вывод по коду и предложение исправления. Для изменения схемы или auth проверь
доступных потребителей.

Предметные сценарии — в [review-loop.md](references/review-loop.md).
Общий порядок self-review и независимого ревью задаёт [grippo-review](../grippo-review/SKILL.md),
команды и ограничения проверок — [grippo-verification](../grippo-verification/SKILL.md).
Статическое чтение не подтверждает HTTP/OAuth/DB поведение.
