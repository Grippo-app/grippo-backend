---
name: grippo-operations
description: Исследование и изменение Docker, env, SSH, dump/deploy/cleanup и восстановления PostgreSQL Grippo. Используй для эксплуатации, отдельного backup и подготовки разрешённого deploy; доменную логику разбирай профильным skill.
---

# Grippo Operations

Источники: [wrappers и helper](../../../scripts/), [operations.py](../../../scripts/internal/operations.py),
[Dockerfile](../../../Dockerfile), [Compose](../../../docker-compose.yml),
[bootstrap](../../../src/main.ts) и [DatabaseService](../../../src/database/database.service.ts).
Проверяй выбранные source bytes и среду; документация не доказывает runtime.

## Выбор справочника

- Dump/deploy и границы разрешения: обязательно [deployment-policy](references/deployment-policy.md).
- SSH, remote preflight, передача backup: [remote-access](references/remote-access.md).
- CLI, порядок действий и failure state: [scripts-runbooks](references/scripts-runbooks.md).
- Docker, env, порты, health и startup: [configuration-and-containers](references/configuration-and-containers.md).
- Безопасные проверки: [verification](references/verification.md).
- Состав SQL и отдельный restore: [dump-and-restore](references/dump-and-restore.md).

## Рабочий цикл

1. Установи scope: локальное исправление, read-only доступ, dump-only, deploy
   либо recovery. Разработка и review не разрешают SSH или эксплуатацию.
2. Прочитай актуальный wrapper и helper; установи Git diff и владельцев файлов.
   Сохраняй чужие изменения, private/untracked файлы и last-known-good backup.
3. Для deploy подготовь конкретный target/root/revision, runtime plan,
   backup/storage и recovery. Каждая попытка требует прямого human permission.
   `--approve-plan` связывает параметры; не заменяет разрешение человека.
4. Выполни разрешённое локальное изменение, self-review и безопасные проверки.
   Review эксплуатационного кода не требует реального dump/deploy.
5. Передай независимому reviewer diff, source, результаты и scope. Исправь
   blocking findings и повтори затронутые проверки/review.
6. Отчитайся о фактическом результате и ограничениях; compile/static checks
   не подтверждают доступ, backup восстановления или production rollout.

## Существенные ограничения

- `deploy.sh` по умолчанию строит read-only plan выбранного Docker daemon.
  Даже plan может обращаться к remote context: соблюдай разрешённую цель.
- Execute обновляет только существующий backend. DB/volume сохраняются;
  `down -v`, import/drop schema, bootstrap и автоматический rollback отсутствуют.
  Несовпадение actual DB с Compose блокирует deploy, а не меняет источник.
- Перед каждой execute attempt helper заново вызывает штатный `dump.sh`,
  проверяет snapshot/latest и независимую private recovery copy.
  Dump-only не разрешает upload/restart/deploy/restore.
- Окно без writes согласуется до snapshot и длится до согласованного API smoke,
  включая HTTP-клиентов после recreate. `--writers-frozen` — утверждение
  оператора, а не механизм остановки писателей.
- `--env-file` читается как данные, не выполняется через `source`.
  Не выводи .env values, SQL rows, credentials/keys, полный inspect/config,
  production logs; не включай tracing с secrets.
- Docker context ограничен allowlist; production backend использует `db:5432`,
  отключает synchronize/migrationsRun и SQL logging. Schema changes требуют
  отдельного data plan; обычный deploy их не применяет.
- `cleanup.sh` остаётся destructive host-wide операцией с reboot. Не используй
  его для исправления build failure и не запускай при исследовании.
- Failure/disconnect не разрешает повтор; attempt marker нельзя удалить ради
  обхода gate. Новый attempt/target/revision требует нового human permission.
