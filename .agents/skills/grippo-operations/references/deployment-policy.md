# Обязательный порядок: dump-only и разрешённый deploy

Источники: [dump.sh](../../../../scripts/dump.sh), [deploy.sh](../../../../scripts/deploy.sh),
[operations.py](../../../../scripts/internal/operations.py), [Compose](../../../../docker-compose.yml).
CLI и failure state: [scripts-runbooks](scripts-runbooks.md); доступ:
[remote-access](remote-access.md); отдельное восстановление:
[dump-and-restore](dump-and-restore.md).

## Разрешение и технические gates

**Никогда не выполняй deploy самостоятельно.** Каждая реальная попытка требует
прямого явного разрешения человека на host/environment, absolute project path,
revision, команды, ожидаемые последствия и recovery. Под rollout понимаются
также ручной Compose up/recreate, release switch и upload в live checkout.
Review APPROVE, тесты, SSH/dump access, прежнее разрешение и сообщение агента
не заменяют human permission.

Уже разрешённые подшаги той же подготовленной попытки не требуют повторных
вопросов. Новая попытка, цель, revision или существенное изменение плана требует
нового разрешения. Dump-only заканчивается backup и отчётом: не разрешает
upload/deploy/restart/import/restore/cleanup.

Текущий deploy сохраняет существующие DB/volume, build/recreate выполняет только
для backend. Удалены прежние `down -v`, schema drop и SQL import. Bootstrap,
DB image upgrade, migrations и automatic rollback не входят в этот сценарий.
Это уменьшает destructive scope, но не отменяет permission и mandatory backup.

`--approve-plan` связывает CLI с plan, а `--writers-frozen` фиксирует утверждение
оператора. Ни один flag не проверяет человеческое разрешение и не останавливает
writers. Агент обязан иметь соответствующее разрешение и подтверждение окна.
`--plan` выполняет read-only Docker preflight; remote Docker context тоже
является подключением к серверу и требует разрешённого доступа.

## Что установить до execute

| Проверка | Требование |
|---|---|
| Target | Подтверждены SSH fingerprint, host/account, environment и absolute root; IDE hints недостаточны |
| Revision | Полный commit SHA, ожидаемые source bytes и clean tracked tree; branch name недостаточен |
| Docker identity | Тот же pinned daemon selector/context, Compose project/config, running DB, existing stable backend и persistent volume; backend может быть остановлен только в согласованном freeze |
| DB identity | Running backend endpoint/credentials/network соответствуют фактической DB и rendered Compose; внешнюю DB нельзя молча заменить на `db` |
| Schema compatibility | Новый backend совместим с существующей schema без synchronize/migrations; `SELECT 1` не проверяет все entities |
| Writers | Freeze всех DB writers и HTTP-клиентов действует до snapshot, через recreate и согласованный smoke; PostgreSQL остаётся доступна |
| Resources | Измерены доступные RAM/swap/disk, бюджет build и параллельных probes; локальный build RSS на другой ОС — ориентир, не точный Linux peak |
| Storage | Private recovery directory вне checkout/build context/удаляемых ресурсов, достаточно места; копии не перезаписываются |
| Notion archive | Для каждой production attempt подтверждено native `dump.sql` свежего pre-upload snapshot в [Dump history](notion-dump-history.md) до live upload/release switch |
| Recovery | Известны текущая code/image revision, good backup и отдельно согласуемый способ восстановления; plan сохраняет immutable old image ID даже для legacy без revision label |
| Plan | Совпадают attempt UUID, SHA256 плана и все связанные параметры; plan пересчитан перед mutation |

Не подменяй неизвестную production конфигурацию локальной. Если running DB
отсутствует, обнаружено несовпадение или нужен bootstrap — stop и отдельный план.
Не создавай пустую DB ради успешного preflight или dump.
Остановка старого backend прекращает его writes только до recreate: новый API
снова становится доступен до smoke. Подтверждение отсутствия внешних клиентов
или согласованный технический writer control должно покрывать и этот период.
Если ресурсов для build недостаточно, подготовь изменение плана до запуска;
временный swap не включается автоматически — см. [runbooks](scripts-runbooks.md).

## Отдельный dump

В разрешённом backup scope, на выбранном Docker host:

```bash
bash scripts/dump.sh \
  --backup-dir '<ABS_PRIVATE_DIRECTORY_OUTSIDE_CHECKOUT>'
```

По умолчанию используются root `.env`, `docker-compose.yml` и
`scripts/dump.sql`. Для другого согласованного выбора укажи `--env-file`,
`--compose-file`, `--latest-file` явно. Не исполняй `.env` через `source`.
Dump-only не разрешает самостоятельно останавливать writers.

Принимается только полное успешное выполнение штатного script для фактически
затрагиваемой DB/daemon. Проверь receipt: свежий непустой regular snapshot,
latest и independent recovery copy, одинаковые size/SHA256, правильные source
identity и paths, private permissions. Partial/failed dump или просто наличие
старого SQL не подходят. Helper обеспечивает запись/проверку файлов; оператор
дополнительно сверяет target и место хранения с задачей.

Snapshot и recovery copy сохраняются под уникальными именами, latest публикуется
атомарно. Не выбирай snapshot через `ls -t | head`; используй exact receipt.
Права backup не дают права читать/публиковать payload. Hash/exit не доказывают
восстановимость: restore drill — отдельная разрешённая задача.

В отчёте укажи source identity, timestamp, checksum/size, private storage и exit
без SQL/secret values. После dump-only остановись.

## Подготовленный deploy

1. **Подготовь reviewable результат.** Исследуй diff, compatibility и recovery,
   выполни self-review/checks/independent review. Remote-only evidence получай
   только в разрешённом scope.
2. **Согласуй live подготовку и окно.** До upload/release switch нужен новый
   успешный штатный dump действующей системы и проверенная независимая копия.
   Для production до live upload/release switch агент обязан загрузить exact snapshot
   в [Notion Dump history](notion-dump-history.md) и подтвердить native вложение.
   Неподтверждённый архив останавливает live подготовку.
   Исходная PostgreSQL остаётся доступна. Сохрани remote `.env`, keys, backups,
   чужие изменения и good snapshot; не применяй reset/clean/rsync-delete.
3. **Сверь подготовленную revision и план.** Deploy сам не делает Git update.
   После разрешённого upload получи plan уже из выбранной revision:

```bash
bash scripts/deploy.sh --plan \
  --revision '<FULL_COMMIT_SHA>' \
  --backup-dir '<ABS_PRIVATE_DIRECTORY_OUTSIDE_CHECKOUT>'
```

4. **Разрешение на конкретную попытку.** Покажи человеку target/root/revision,
   plan, backup и recovery. Выполняй только если этот подготовленный запуск
   прямо разрешён. Plan hash — техническая привязка, не самостоятельное approval.
5. **Один execute.** Подтверди действующий freeze. Используй exact attempt и
   plan hash из принятого плана, те же paths и timeout:

```bash
bash scripts/deploy.sh --execute \
  --revision '<SAME_FULL_COMMIT_SHA>' \
  --backup-dir '<SAME_ABS_PRIVATE_DIRECTORY>' \
  --attempt '<PLAN_ATTEMPT_UUID>' \
  --approve-plan '<PLAN_SHA256>' \
  --writers-frozen
```

Execute заново проверяет plan/target, фиксирует уникальную attempt, блокирует
параллельную операцию, **сам вызывает новый `scripts/dump.sh`** и проверяет receipt
до build/recreate. Отдельный backup перед upload не заменяет этот новый backup.
Далее build backend → recreate только backend без dependencies/build/pull →
ожидание healthy. DB/volume не пересоздаются; SQL не импортируется.
До recreate helper проверяет image ID/approved revision построенного образа,
сохраняет его в journal и выбирает для up именно immutable ID. Повторный config
может отличаться от принятого только `backend.image`. Исходный image должен
оставаться доступен; не удаляй его/backup ради неявного cleanup или retry.

6. **Проверка и отчёт.** Сверь фактическую revision/image, Docker health,
   `/health` и согласованный API smoke с synthetic identity. Health проверяет
   доступность DB, а не полноту schema, auth/OAuth или бизнес-потоков.
   Снимай freeze только предусмотренным согласованным шагом; сохрани snapshots.
   Exact внутренний dump этой attempt также архивируй в Notion по
   [правилу истории](notion-dump-history.md), в том числе после failed rollout,
   если dump успешно завершён. Shell не делает эту загрузку. Неподтверждённый
   архив после rollout — отдельный pending шаг, не повод автоматически повторять deploy.
   Сообщай фактические результаты и pending проверки.

Если на сервере ещё старые source-sourcing scripts, не заменяй их и не запускай
новый helper как скрытый обход backup-before-upload. Подготовь отдельный
reviewed staging/upgrade plan для backup действующей системы до live update.
Прежнее разовое разрешение на legacy bootstrap не переносится на другую
попытку; текущий plan должен подтверждаться actual состоянием выбранной среды.

## Failure, disconnect и recovery

- Nonzero/partial/empty dump, failed copy, source/hash/path mismatch: stop до
  build/recreate; не fallback к старому latest.
- Plan изменился или writes возобновились: stop dependent rollout, установи
  причину и пересогласуй изменившийся scope/окно.
- После failure/disconnect сначала установи, жив ли процесс и что произошло
  с backend/DB/backup. Attempt marker не удаляют для обхода повторного запуска.
- Вторая попытка требует нового human permission, нового plan/attempt и нового
  pre-deploy dump. Скрипт не делает автоматический retry/rollback.
- Good backup сохраняй независимо от нового dump: снимок повреждённой DB
  не заменяет last-known-good. Не перезаписывай recovery copy.
- Restore, code rollback, schema repair и bootstrap требуют отдельного
  конкретного разрешения. Git revert не является восстановлением данных.

Fresh означает тот же согласованный source и attempt в непрерывном окне данных,
а не произвольный возраст файла. Неподтверждённый source или пропущенный штатный
backup запрещают deploy; исключение «первый запуск» агент сам не создаёт.
