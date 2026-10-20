# Grippo Backend

REST API для тренировок: NestJS 10 / Express, TypeScript, TypeORM 0.3,
PostgreSQL 15.5. Docker runtime — Node 20; точные dependencies закреплены lockfile.

Backend содержит auth (email/Google/Apple, access/refresh JWT), users/profile/
goals/exclusions, trainings/exercises/iterations, каталог упражнений и его
переводы/components, muscles/equipments, exercise metrics, weight history,
push token registry и admin API.

## Документация

| Нужная информация | Источник |
|---|---|
| Правила работы и выбор skill | [AGENTS.md](AGENTS.md) |
| Архитектура, modules, DI | [architecture](.agents/skills/grippo-architecture/references/architecture.md) |
| Все исходники и владельцы областей | [source-map](.agents/skills/grippo-architecture/references/source-map.md) |
| Entities и отношения | [entity-map](.agents/skills/grippo-domain-data/references/entity-map.md) |
| Новое упражнение через AI: содержание, переводы, изображение и добавление | [exercise-create](.agents/skills/grippo-exercise-create/SKILL.md) |
| Команда аудита: техника, проценты, сложность, оборудование, переводы и исследования | [exercise-audit](.agents/skills/grippo-exercise-audit/SKILL.md) |
| API и identity | [api-map](.agents/skills/grippo-identity-api/references/api-map.md) |
| Env keys, порты, Docker и запуск | [configuration-and-containers](.agents/skills/grippo-operations/references/configuration-and-containers.md) |
| Проверки и границы покрытия | [checks](.agents/skills/grippo-verification/references/checks.md) |
| Локали, snapshot API и отдельные schema/import операции | [localization-and-http](.agents/skills/grippo-identity-api/references/localization-and-http.md) |

Jest содержит focused DTO/controller specs; они подменяют services/guards и
не проверяют настоящие auth/DB интеграции. Перед запуском приложения установи
изолированную DB/config: DATA_SOURCE открывает соединение при bootstrap.
В production synchronize/migrationsRun запрещены; автоматического schema rollout нет.
Swagger paths: /docs, /docs-json; глобального /api prefix нет. `/health` проверяет
доступность БД без выдачи её данных.

Каталог/тренировки поддерживают `Accept-Language` en/ua/ru/pt-BR/pt-PT и
`Vary: Accept-Language`. `uk` — header alias для ua; bare pt/прочие pt-регионы
выбирают BR, явный PT — PT. Без перевода сохраняется en/base fallback.
Raw admin translations возвращает `translationsRevision`; PUT проверяет снимок
при сохранении португальских переводов и отвечает structured409 при конфликте.
Подготовлены отдельные schema SQL и dry-run importer; автоматически при старте
они не выполняются. Контракт редактора и порядок отдельных schema/import операций
описаны в [localization-and-http](.agents/skills/grippo-identity-api/references/localization-and-http.md);
разрешения и release gates — в [deployment-policy](.agents/skills/grippo-operations/references/deployment-policy.md).

## Эксплуатация

**Деплой только с явного разрешения человека на конкретную попытку. Перед каждым
деплоем обязателен новый successful dump через scripts/dump.sh.** Dump-only,
SSH, зелёные checks и review не разрешают rollout или автоматический retry.

Свежие pre-deploy дампы каждой production attempt сохраняются также в
[Notion Dump history](https://app.notion.com/p/3300cb0926ef80a7b760e51cf768a2d1)
датированным серым блоком с вложением `dump.sql`; [порядок архивации](.agents/skills/grippo-operations/references/notion-dump-history.md).
Это обязательный шаг агента через Notion MCP; shell scripts сами файл в Notion не загружают.

[Обязательный порядок dump/deploy](.agents/skills/grippo-operations/references/deployment-policy.md)
и [SSH/remote доступ](.agents/skills/grippo-operations/references/remote-access.md)
определяют target, backup evidence, допустимые команды и условия остановки.

`deploy.sh` планирует и выполняет обновление только backend, сохраняя работающую
PostgreSQL и её volume. Перед build/recreate сам вызывает новый `dump.sh`,
проверяет backup и ждёт healthy backend. Import/reset/автоматический rollback
в deploy отсутствуют. Новая или внешняя DB требует отдельного согласованного плана.
Исходный backend может быть остановлен для согласованного freeze; DB должна
оставаться running. Скрипт сам не организует остановку writers.
`cleanup.sh` по-прежнему чистит весь Linux host и вызывает sudo reboot.
[Разбор scripts и failure branches](.agents/skills/grippo-operations/references/scripts-runbooks.md).
Примеры в документах не являются разрешением выполнять эти операции.

После подтверждения target и доступа план получают командой:

```bash
bash scripts/deploy.sh --plan \
  --revision '<FULL_COMMIT_SHA>' \
  --backup-dir '<ABSOLUTE_PRIVATE_DIRECTORY_OUTSIDE_CHECKOUT>'
```

`--plan` обращается к выбранному Docker daemon, но не делает backup/rollout.
Запуск `--execute` требует отдельного явного разрешения человека на подготовленный
plan; параметры выполнения находятся в deployment-policy. Для отдельного backup:

```bash
bash scripts/dump.sh \
  --backup-dir '<ABSOLUTE_PRIVATE_DIRECTORY_OUTSIDE_CHECKOUT>'
```

Нужны Unix/Bash, Python >=3.9, Git и Docker Compose v2 с JSON config. `.env` читается как конфигурация,
не исполняется shell. Содержимое secrets и SQL не печатается. Recovery directory
должен быть заранее согласован, приватен и находиться вне checkout/build context.

Проверка инструкций и ссылок: `python3 scripts/validate-agent-kit.py`.
Она проверяет формат и полноту ссылок; поведение приложения подтверждается
проверками из [checks](.agents/skills/grippo-verification/references/checks.md).
