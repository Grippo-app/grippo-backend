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
| API и identity | [api-map](.agents/skills/grippo-identity-api/references/api-map.md) |
| Env keys, порты, Docker и запуск | [configuration-and-containers](.agents/skills/grippo-operations/references/configuration-and-containers.md) |
| Проверки и границы покрытия | [checks](.agents/skills/grippo-verification/references/checks.md) |

Jest содержит focused DTO/controller specs; они подменяют services/guards и
не проверяют настоящие auth/DB интеграции. Перед запуском приложения установи
изолированную DB/config: DATA_SOURCE может применить synchronize при bootstrap.
Swagger paths: /docs, /docs-json; глобального /api prefix и /health route нет.

## Эксплуатация

**Деплой только с явного разрешения человека на конкретную попытку. Перед каждым
деплоем обязателен новый successful dump через scripts/dump.sh.** Dump-only,
SSH, зелёные checks и review не разрешают rollout или автоматический retry.

[Обязательный порядок dump/deploy](.agents/skills/grippo-operations/references/deployment-policy.md)
и [SSH/remote доступ](.agents/skills/grippo-operations/references/remote-access.md)
определяют target, backup evidence, допустимые команды и условия остановки.

Текущий deploy.sh удаляет volumes через down -v, запускает backend до import и
сам не обеспечивает backup/approval gates или проверку восстановления.
cleanup.sh чистит весь Linux host и вызывает sudo reboot.
[Разбор scripts и failure branches](.agents/skills/grippo-operations/references/scripts-runbooks.md).
Примеры в документах не являются разрешением выполнять эти операции.

Финальные результаты проверки комплекта: [agent-kit-audit](tasks/agent-kit-audit.md).
