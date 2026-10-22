# Полный индекс исходников и постоянных тестов

Индекс включает source/config/script files, focused specs и `test/postgres/`.
Индекс помогает найти owner и источник; сам по себе не доказывает полноту
анализа поведения. Включены все src файлы: 19 entities, 10 feature modules,
shared bootstrap/database/common/i18n/lib. Подробности — в профильных references.
Контракт локалей и редактора переводов — в
[localization-and-http](../../grippo-identity-api/references/localization-and-http.md).
Production metadata проверяй заново для каждой разрешённой операции.

## Файлы

| Source | Primary skill |
|---|---|
| [.dockerignore](../../../../.dockerignore) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [.eslintrc.cjs](../../../../.eslintrc.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [.gitignore](../../../../.gitignore) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [.agents/skills/grippo-exercise-audit/scripts/inspect_snapshot.py](../../grippo-exercise-audit/scripts/inspect_snapshot.py) | [grippo-exercise-audit](../../grippo-exercise-audit/SKILL.md) |
| [CLAUDE.md](../../../../CLAUDE.md) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [Dockerfile](../../../../Dockerfile) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [README.md](../../../../README.md) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [docker-compose.yml](../../../../docker-compose.yml) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [nest-cli.json](../../../../nest-cli.json) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [package-lock.json](../../../../package-lock.json) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [package.json](../../../../package.json) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/cleanup.sh](../../../../scripts/cleanup.sh) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/deploy.sh](../../../../scripts/deploy.sh) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/dump.sh](../../../../scripts/dump.sh) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/setup-mac.sh](../../../../scripts/setup-mac.sh) | [grippo-orchestrator](../../grippo-orchestrator/SKILL.md) |
| [scripts/internal/setup-mac.cjs](../../../../scripts/internal/setup-mac.cjs) | [grippo-orchestrator](../../grippo-orchestrator/SKILL.md) |
| [scripts/internal/mac-access.cjs](../../../../scripts/internal/mac-access.cjs) | [grippo-exercise-create](../../grippo-exercise-create/SKILL.md) |
| [scripts/internal/mac-server-access.cjs](../../../../scripts/internal/mac-server-access.cjs) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/internal/mac-transfer.cjs](../../../../scripts/internal/mac-transfer.cjs) | [grippo-exercise-create](../../grippo-exercise-create/SKILL.md) |
| [scripts/import-exercise-translations.cjs](../../../../scripts/import-exercise-translations.cjs) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/internal/exercise-translations.cjs](../../../../scripts/internal/exercise-translations.cjs) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [scripts/sql/add-portuguese-locales.sql](../../../../scripts/sql/add-portuguese-locales.sql) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-butterfly-forearm-enum.sql](../../../../test/postgres/fixtures/equipment-publication/add-butterfly-forearm-enum.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-butterfly-forearm-equipment.sql](../../../../test/postgres/fixtures/equipment-publication/add-butterfly-forearm-equipment.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/preflight-kettlebells.sql](../../../../test/postgres/fixtures/equipment-publication/preflight-kettlebells.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-kettlebells-enum.sql](../../../../test/postgres/fixtures/equipment-publication/add-kettlebells-enum.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-kettlebells-equipment.sql](../../../../test/postgres/fixtures/equipment-publication/add-kettlebells-equipment.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/preflight-assisted-pull-up-dip.sql](../../../../test/postgres/fixtures/equipment-publication/preflight-assisted-pull-up-dip.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-assisted-pull-up-dip-enum.sql](../../../../test/postgres/fixtures/equipment-publication/add-assisted-pull-up-dip-enum.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-assisted-pull-up-dip-equipment.sql](../../../../test/postgres/fixtures/equipment-publication/add-assisted-pull-up-dip-equipment.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/preflight-plate-loaded-row.sql](../../../../test/postgres/fixtures/equipment-publication/preflight-plate-loaded-row.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-plate-loaded-row-enum.sql](../../../../test/postgres/fixtures/equipment-publication/add-plate-loaded-row-enum.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-plate-loaded-row-equipment.sql](../../../../test/postgres/fixtures/equipment-publication/add-plate-loaded-row-equipment.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/preflight-belt-squat.sql](../../../../test/postgres/fixtures/equipment-publication/preflight-belt-squat.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-belt-squat-enum.sql](../../../../test/postgres/fixtures/equipment-publication/add-belt-squat-enum.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-belt-squat-equipment.sql](../../../../test/postgres/fixtures/equipment-publication/add-belt-squat-equipment.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/preflight-plate-loaded-seated-dip.sql](../../../../test/postgres/fixtures/equipment-publication/preflight-plate-loaded-seated-dip.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-plate-loaded-seated-dip-enum.sql](../../../../test/postgres/fixtures/equipment-publication/add-plate-loaded-seated-dip-enum.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [test/postgres/fixtures/equipment-publication/add-plate-loaded-seated-dip-equipment.sql](../../../../test/postgres/fixtures/equipment-publication/add-plate-loaded-seated-dip-equipment.sql) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [scripts/internal/logger.sh](../../../../scripts/internal/logger.sh) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/internal/operations.py](../../../../scripts/internal/operations.py) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [scripts/validate-agent-kit.py](../../../../scripts/validate-agent-kit.py) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [src/app.module.ts](../../../../src/app.module.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/common/admin.guard.ts](../../../../src/common/admin.guard.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/common/jwt-auth.guard.ts](../../../../src/common/jwt-auth.guard.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/common/jwt.strategy.ts](../../../../src/common/jwt.strategy.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/common/logging.interceptor.ts](../../../../src/common/logging.interceptor.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/common/snake-naming.strategy.ts](../../../../src/common/snake-naming.strategy.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/database/database.module.ts](../../../../src/database/database.module.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/database/database.provider.ts](../../../../src/database/database.provider.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/database/database.service.ts](../../../../src/database/database.service.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/database/repository.providers.ts](../../../../src/database/repository.providers.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/entities/equipment-groups.entity.ts](../../../../src/entities/equipment-groups.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/equipments.entity.ts](../../../../src/entities/equipments.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/excluded-equipments.entity.ts](../../../../src/entities/excluded-equipments.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/excluded-muscles.entity.ts](../../../../src/entities/excluded-muscles.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/exercise-example-bundles.entity.ts](../../../../src/entities/exercise-example-bundles.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/exercise-example-components.entity.ts](../../../../src/entities/exercise-example-components.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/exercise-example-translation.entity.ts](../../../../src/entities/exercise-example-translation.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/exercise-examples-equipments.entity.ts](../../../../src/entities/exercise-examples-equipments.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/exercise-examples.entity.ts](../../../../src/entities/exercise-examples.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/exercises.entity.ts](../../../../src/entities/exercises.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/goals.entity.ts](../../../../src/entities/goals.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/iterations.entity.ts](../../../../src/entities/iterations.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/muscle-groups.entity.ts](../../../../src/entities/muscle-groups.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/muscles.entity.ts](../../../../src/entities/muscles.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/push-tokens.entity.ts](../../../../src/entities/push-tokens.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/trainings.entity.ts](../../../../src/entities/trainings.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/user-profiles.entity.ts](../../../../src/entities/user-profiles.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/users.entity.ts](../../../../src/entities/users.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/entities/weight-history.entity.ts](../../../../src/entities/weight-history.entity.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/i18n/exercise-example-i18n.service.ts](../../../../src/i18n/exercise-example-i18n.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/i18n/express.d.ts](../../../../src/i18n/express.d.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/i18n/i18n.module.ts](../../../../src/i18n/i18n.module.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/i18n/i18n.types.ts](../../../../src/i18n/i18n.types.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/i18n/language.middleware.ts](../../../../src/i18n/language.middleware.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/i18n/locale.helper.ts](../../../../src/i18n/locale.helper.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/lib/equipment-group.enum.ts](../../../../src/lib/equipment-group.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/equipment.enum.ts](../../../../src/lib/equipment.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/exercise-category.enum.ts](../../../../src/lib/exercise-category.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/experience.enum.ts](../../../../src/lib/experience.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/force-type.enum.ts](../../../../src/lib/force-type.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/goal.enum.ts](../../../../src/lib/goal.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/hash.ts](../../../../src/lib/hash.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/lib/muscle-group.enum.ts](../../../../src/lib/muscle-group.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/muscle.enum.ts](../../../../src/lib/muscle.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/user-role.enum.ts](../../../../src/lib/user-role.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/lib/weight-type.enum.ts](../../../../src/lib/weight-type.enum.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/main.ts](../../../../src/main.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [src/modules/health/health.controller.ts](../../../../src/modules/health/health.controller.ts) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [src/modules/admin/admin.controller.ts](../../../../src/modules/admin/admin.controller.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/admin/admin.controller.spec.ts](../../../../src/modules/admin/admin.controller.spec.ts) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [src/modules/admin/admin.module.ts](../../../../src/modules/admin/admin.module.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/auth.controller.ts](../../../../src/modules/auth/auth.controller.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/auth.module.ts](../../../../src/modules/auth/auth.module.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/auth.service.ts](../../../../src/modules/auth/auth.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/dto/apple-login.request.ts](../../../../src/modules/auth/dto/apple-login.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/dto/google-login.request.ts](../../../../src/modules/auth/dto/google-login.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/dto/login.request.ts](../../../../src/modules/auth/dto/login.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/dto/login.response.ts](../../../../src/modules/auth/dto/login.response.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/dto/register.request.ts](../../../../src/modules/auth/dto/register.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/services/apple-auth.service.ts](../../../../src/modules/auth/services/apple-auth.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/services/google-auth.service.ts](../../../../src/modules/auth/services/google-auth.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/auth/services/token.service.ts](../../../../src/modules/auth/services/token.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/equipments/dto/equipment-response.ts](../../../../src/modules/equipments/dto/equipment-response.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/equipments/equipments.controller.ts](../../../../src/modules/equipments/equipments.controller.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/equipments/equipments.module.ts](../../../../src/modules/equipments/equipments.module.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/equipments/equipments.service.ts](../../../../src/modules/equipments/equipments.service.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/dto/exercise-components.dto.ts](../../../../src/modules/exercise-examples/dto/exercise-components.dto.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/dto/exercise-example-translations.response.ts](../../../../src/modules/exercise-examples/dto/exercise-example-translations.response.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/dto/exercise-example-update.request.ts](../../../../src/modules/exercise-examples/dto/exercise-example-update.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/exercise-examples/dto/exercise-example.request.ts](../../../../src/modules/exercise-examples/dto/exercise-example.request.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/dto/exercise-example.request.spec.ts](../../../../src/modules/exercise-examples/dto/exercise-example.request.spec.ts) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [src/modules/exercise-examples/dto/exercise-example.response.ts](../../../../src/modules/exercise-examples/dto/exercise-example.response.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/exercise-example.controller.ts](../../../../src/modules/exercise-examples/exercise-example.controller.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/exercise-example.module.ts](../../../../src/modules/exercise-examples/exercise-example.module.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/exercise-example.service.ts](../../../../src/modules/exercise-examples/exercise-example.service.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/exercise-example-response.mapper.ts](../../../../src/modules/exercise-examples/exercise-example-response.mapper.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-examples/exercise-translations-revision.ts](../../../../src/modules/exercise-examples/exercise-translations-revision.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-metrics/dto/exercise-metrics.response.ts](../../../../src/modules/exercise-metrics/dto/exercise-metrics.response.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-metrics/exercise-metrics.controller.ts](../../../../src/modules/exercise-metrics/exercise-metrics.controller.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-metrics/exercise-metrics.module.ts](../../../../src/modules/exercise-metrics/exercise-metrics.module.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/exercise-metrics/exercise-metrics.service.ts](../../../../src/modules/exercise-metrics/exercise-metrics.service.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/muscles/dto/muscle-response.ts](../../../../src/modules/muscles/dto/muscle-response.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/muscles/muscles.controller.ts](../../../../src/modules/muscles/muscles.controller.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/muscles/muscles.module.ts](../../../../src/modules/muscles/muscles.module.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/muscles/muscles.service.ts](../../../../src/modules/muscles/muscles.service.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/push-tokens/dto/device-token.response.ts](../../../../src/modules/push-tokens/dto/device-token.response.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/push-tokens/dto/push-token.request.ts](../../../../src/modules/push-tokens/dto/push-token.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/push-tokens/push-tokens.controller.ts](../../../../src/modules/push-tokens/push-tokens.controller.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/push-tokens/push-tokens.module.ts](../../../../src/modules/push-tokens/push-tokens.module.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/push-tokens/push-tokens.service.ts](../../../../src/modules/push-tokens/push-tokens.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/trainings/dto/trainings.request.ts](../../../../src/modules/trainings/dto/trainings.request.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/trainings/dto/trainings.response.ts](../../../../src/modules/trainings/dto/trainings.response.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/trainings/trainings.controller.ts](../../../../src/modules/trainings/trainings.controller.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/trainings/trainings.module.ts](../../../../src/modules/trainings/trainings.module.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/trainings/trainings.service.ts](../../../../src/modules/trainings/trainings.service.ts) | [grippo-domain-data](../../grippo-domain-data/SKILL.md) |
| [src/modules/users/dto/admin-set-role.request.ts](../../../../src/modules/users/dto/admin-set-role.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/admin-user.response.ts](../../../../src/modules/users/dto/admin-user.response.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/assign-admin.request.ts](../../../../src/modules/users/dto/assign-admin.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/create-user-profile.request.ts](../../../../src/modules/users/dto/create-user-profile.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/goal.request.ts](../../../../src/modules/users/dto/goal.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/goal.response.ts](../../../../src/modules/users/dto/goal.response.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/update-excluded-ids.dto.ts](../../../../src/modules/users/dto/update-excluded-ids.dto.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/update-experience.request.ts](../../../../src/modules/users/dto/update-experience.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/update-height.request.ts](../../../../src/modules/users/dto/update-height.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/dto/user.response.ts](../../../../src/modules/users/dto/user.response.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/users.controller.ts](../../../../src/modules/users/users.controller.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/users.module.ts](../../../../src/modules/users/users.module.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/users/users.service.ts](../../../../src/modules/users/users.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/weight-history/dto/weight-history.request.ts](../../../../src/modules/weight-history/dto/weight-history.request.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/weight-history/weight-history.controller.ts](../../../../src/modules/weight-history/weight-history.controller.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/weight-history/weight-history.module.ts](../../../../src/modules/weight-history/weight-history.module.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/modules/weight-history/weight-history.service.ts](../../../../src/modules/weight-history/weight-history.service.ts) | [grippo-identity-api](../../grippo-identity-api/SKILL.md) |
| [src/swagger.ts](../../../../src/swagger.ts) | [grippo-architecture](../../grippo-architecture/SKILL.md) |
| [test/postgres/README.md](../../../../test/postgres/README.md) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/catalog.cjs](../../../../test/postgres/catalog.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/assisted-pull-up-dip.cjs](../../../../test/postgres/assisted-pull-up-dip.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/belt-squat.cjs](../../../../test/postgres/belt-squat.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/context.cjs](../../../../test/postgres/context.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/equipments.cjs](../../../../test/postgres/equipments.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/identity.cjs](../../../../test/postgres/identity.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/kettlebells.cjs](../../../../test/postgres/kettlebells.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/plate-loaded-row.cjs](../../../../test/postgres/plate-loaded-row.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/plate-loaded-seated-dip.cjs](../../../../test/postgres/plate-loaded-seated-dip.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/run.cjs](../../../../test/postgres/run.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/runtime.cjs](../../../../test/postgres/runtime.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [test/postgres/runtime.guard.cjs](../../../../test/postgres/runtime.guard.cjs) | [grippo-verification](../../grippo-verification/SKILL.md) |
| [tsconfig.build.json](../../../../tsconfig.build.json) | [grippo-operations](../../grippo-operations/SKILL.md) |
| [tsconfig.json](../../../../tsconfig.json) | [grippo-operations](../../grippo-operations/SKILL.md) |

## Отдельные артефакты

SQL-дампы и backups не входят в source inventory и не копируются в знания.
Schema metadata извлекай по [правилам работы с дампом](../../grippo-operations/references/dump-and-restore.md),
без строк данных. Для .env достаточно key names без значений.
.idea, .DS_Store, .git, node_modules и dist не копируются в знания; установленный
код зависимостей читается точечно для подтверждения TypeORM/validator semantics.

Комплект инструкций: root AGENTS.md/README.md/CLAUDE.md,
.agents/skills/grippo-*, .codex/agents/*.toml, scripts/validate-agent-kit.py
и постоянные test/postgres/ docs. Разовые отчёты и рабочие артефакты в него
не входят. При добавлении/удалении runtime source или постоянных файлов
`test/postgres/` обнови таблицу и профильный reference.
Validator сверяет inventory, формат и ссылки; он не запускает PostgreSQL tests.
