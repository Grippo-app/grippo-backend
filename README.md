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
| Команда аудита: техника, проценты, сложность, оборудование, переводы и исследования | [exercise-audit](.agents/skills/grippo-exercise-audit/SKILL.md) |
| API и identity | [api-map](.agents/skills/grippo-identity-api/references/api-map.md) |
| Env keys, порты, Docker и запуск | [configuration-and-containers](.agents/skills/grippo-operations/references/configuration-and-containers.md) |
| Проверки и границы покрытия | [checks](.agents/skills/grippo-verification/references/checks.md) |

Jest содержит focused DTO/controller specs; они подменяют services/guards и
не проверяют настоящие auth/DB интеграции. Перед запуском приложения установи
изолированную DB/config: DATA_SOURCE открывает соединение при bootstrap.
В production synchronize/migrationsRun запрещены; автоматического schema rollout нет.
Swagger paths: /docs, /docs-json; глобального /api prefix нет. `/health` проверяет
доступность БД без выдачи её данных.

## Эксплуатация

**Деплой только с явного разрешения человека на конкретную попытку. Перед каждым
деплоем обязателен новый successful dump через scripts/dump.sh.** Dump-only,
SSH, зелёные checks и review не разрешают rollout или автоматический retry.

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

Финальные результаты проверки комплекта: [agent-kit-audit](tasks/agent-kit-audit.md).
