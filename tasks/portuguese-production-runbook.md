# Production: схема и пакет v2

Это подготовка команд. Подключение, backup, DDL, deploy и импорт сейчас не выполнялись.
Цель: `ubuntu@51.21.57.106:22`, `/home/ubuntu/grippo-backend`.
SSH ED25519 fingerprint: `SHA256:FS0XbKpIOAXx4+EjL9hroSJ2as6DcX0bfhltaa/Dlws`.

1. Перед запуском зафиксировать локальный commit (push не обязателен), выбрать
   проверенный runner с Node20/Git/pg/psql и сверить actual DB connection.
   Подготовить новую unique PT_RUN на попытку, private каталоги0700, файлы0600
   и передать туда неизменённый v2.
   Dataset SHA256: `4cec836959b41ce4862bafe138246e2b458424caf7573f68d52f4f5d1853b376`.
   Команды ниже выполняются в Bash на сервере. Значения в `<...>` заполняются после preflight.

```sh
set -euo pipefail
set -o noclobber
umask 077
PT_ROOT=/home/ubuntu/grippo-backend
PT_CODE='<ABS_CLEAN_CHECKOUT_OF_APPROVED_SHA>'
PT_RUN='<ABS_PRIVATE_RUN_DIRECTORY>'
PT_BACKUP='<ABS_PRIVATE_RECOVERY_DIRECTORY>'
PT_LATEST='<VERIFIED_DB_DUMP_FILE>'
PT_SHA='<APPROVED_40_CHARACTER_COMMIT_SHA>'
```

2. На согласованное окно остановить всех writers, оставив PostgreSQL доступной.
   Сделать backup ДО schema/live upload. Receipt сохранить; принять только exit0,
   свежие непустые snapshot/latest/recovery с одинаковыми size/SHA256. Независимую
   good copy сохранить вне checkout; восстановимость подтвердить отдельным restore drill.
   Проверенный pre-schema snapshot загрузить в Notion до DDL/live upload:
   [Dump history](https://app.notion.com/p/3300cb0926ef80a7b760e51cf768a2d1), новый серый
   блок сверху `At D MMM YYYY (Prod before deploy: pt-BR / pt-PT)`, файл `dump.sql`.
   Подтвердить native вложение; при отказе загрузки остановиться до изменений.

```sh
bash "$PT_ROOT/scripts/dump.sh" \
  --env-file "$PT_ROOT/.env" --compose-file "$PT_ROOT/docker-compose.yml" \
  --latest-file "$PT_LATEST" --backup-dir "$PT_BACKUP" \
  > "$PT_RUN/pre-schema-backup.json"
```

3. Добавить языки отдельной транзакцией. `pg-service.conf` явно задаёт проверенные
   host/port/database/user/password/sslmode для той же DB; выбранные SSL/credential
   file paths абсолютные. Команды очищают унаследованные PG* и не полагаются на HOME.
   SQL сам делает COMMIT;
   после него проверить точные labels: en, ua, ru, pt-BR, pt-PT.

```sh
env -i PATH="$PATH" PGSERVICEFILE="$PT_RUN/pg-service.conf" psql -X -w \
  --dbname='service=grippo-production' -v ON_ERROR_STOP=1 \
  --file "$PT_CODE/scripts/sql/add-portuguese-locales.sql"
```

4. Выпустить backend и совместимую admin по [готовому порядку](portuguese-rollout.md#code-и-production-gates).
   Каждый backend deploy делает СОБСТВЕННЫЙ новый dump; pre-schema good copy сохраняется.
   После execute (в том числе неуспешного, если dump завершён) архивировать его
   exact snapshot в той же Notion history по [общему правилу](../.agents/skills/grippo-operations/references/notion-dump-history.md).
   Сверить v2 UUID и все base/en/ua/ru тексты с production: при изменениях сначала редактура.
   Перед импортом — действующий freeze и новый dump той же командой из пункта2,
   сохранив receipt как `"$PT_RUN/pre-import-backup.json"`.

5. Dry-run создаёт manifest, затем человек принимает точный запуск. Private approval
   привязывает manifest/target/attempt и ПОСЛЕДНИЙ backup receipt с тремя доступными
   runner файлами; поля описаны в [CLI инструкции](portuguese-rollout.md#cli-команды).
   Новый dump меняет latest: после него прежний receipt уже нельзя использовать для apply.

```sh
node "$PT_CODE/scripts/import-exercise-translations.cjs" \
  --connection "$PT_RUN/connection.json" \
  --dataset "$PT_RUN/portuguese-exercise-translations.private.json" \
  --manifest "$PT_RUN/import-manifest.json" --code-revision "$PT_SHA"
```

```sh
node "$PT_CODE/scripts/import-exercise-translations.cjs" \
  --connection "$PT_RUN/connection.json" \
  --dataset "$PT_RUN/portuguese-exercise-translations.private.json" \
  --manifest "$PT_RUN/import-manifest.json" --code-revision "$PT_SHA" \
  --apply --approval "$PT_RUN/approval.json" --receipt "$PT_RUN/import-attempt.jsonl"
```

6. Подтвердить COMMITTED/APPLIED, полные пять локалей (при прежнем каталоге224×5=1120),
   сохранность base/en/ua/ru, API pt-BR/pt-PT/fallback/Vary и admin token flow.
   Данные проверять read-only, без вывода текстов/секретов. После smoke снять freeze.

Для подтверждения применения, а также при обрыве выполнить read-only reconciliation
через отдельную observer connection:

```sh
node "$PT_CODE/scripts/import-exercise-translations.cjs" \
  --connection "$PT_RUN/observer-connection.json" \
  --dataset "$PT_RUN/portuguese-exercise-translations.private.json" \
  --manifest "$PT_RUN/import-manifest.json" --code-revision "$PT_SHA" \
  --reconcile --receipt "$PT_RUN/import-attempt.jsonl"
```

Откат: подтверждённая ошибка до COMMIT отменяет import transaction. Неизвестный
результат сначала выясняется reconciliation; UNKNOWN/MISMATCH означает остановку.
После schema COMMIT дополнительные enum labels сохраняются. Готового reverse-import нет.
После успешного импорта восстановление — отдельно разрешённый restore проверенного
pre-import snapshot в ЧИСТУЮ recovery DB, проверка и согласованное переключение с
совместимыми code/env. Для полного возврата до схемы выбирается pre-schema good copy.
После возобновления writes полный restore может потерять новые данные.

Команда restore после выбора/проверки пустой recovery DB и good copy:

```sh
env -i PATH="$PATH" PGSERVICEFILE="$PT_RUN/pg-service.conf" psql -X -w \
  --dbname='service=grippo-recovery-empty' -v ON_ERROR_STOP=1 \
  --single-transaction --file '<VERIFIED_GOOD_RECOVERY_SQL>'
```

Конкретные backup receipt, import manifest/approval и recovery target появляются
при подготовке разрешённого запуска. Автоматических retry/rollback нет;
реальный rollout или recovery требует отдельного разрешения по [policy](../.agents/skills/grippo-operations/references/deployment-policy.md).
