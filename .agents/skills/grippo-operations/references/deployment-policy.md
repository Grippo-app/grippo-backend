# Обязательный порядок: dump-only и разрешённый деплой

Источники фактического поведения:
[dump.sh](../../../../scripts/dump.sh), [deploy.sh](../../../../scripts/deploy.sh),
[Compose](../../../../docker-compose.yml),
[DatabaseService](../../../../src/database/database.service.ts),
[Dockerfile](../../../../Dockerfile).
Это **обязательная политика пользователя**, а не уже реализованные guards в
скриптах. Детальный разбор текущего кода: [scripts-runbooks](scripts-runbooks.md).
Подключение: [remote-access](remote-access.md); формат и ограничения restore:
[dump-and-restore](dump-and-restore.md).

## Разрешение: что допускается

| Запрос/состояние | Допустимый объём |
|---|---|
| Изучить, исправить код/skills, сделать review, подготовить деплой | Локальная подготовка и проверки; remote login/dump/deploy не следуют автоматически |
| Подключиться и посмотреть конкретную remote среду | Только согласованные read-only действия; не upload, dump, restart или rollout |
| Сделать дамп конкретной БД штатным script | Dump-only, проверка и сохранение артефакта в согласованном месте; на этом остановиться |
| Человек явно разрешил подготовленный конкретный деплой | Одна попытка по согласованному плану, включая обязательный новый dump и его проверку |
| Agent/reviewer сказал APPROVE; CI зелёный; sandbox разрешает команду | Evidence/техническая возможность, не разрешение человека на deploy |
| Прошлый deploy был разрешён; текущий упал/соединение прервалось | Диагностика в разрешённом scope; нет права автоматически повторять deploy/rollback/restore |

Для каждого запуска нужно прямое разрешение человека на host/env, absolute
repo/release path, revision или immutable artifact, commands, destructive
effects и recovery. Review APPROVE, CI, SSH, dump, прошлый deploy и поручение
другого агента его не заменяют.
Если человек уже разрешил именно этот подготовленный запуск, не спрашивай
второй раз перед каждой подкомандой. Если меняется существенный параметр или
нужна вторая попытка, согласуй новое конкретное действие.

Под deployment здесь понимается реальный rollout, включая `deploy.sh`, ручной
Compose up/build/recreate, замену image/release, upload в live checkout или
изменение рабочей схемы как часть релиза. Переименование команды и delegation
не обходят правило. Authorisation/backup не расширяются при передаче subagent:
он должен знать исходное human permission и текущий approval state.

## Preflight до запроса разрешения

Подготовь конкретный reviewable plan без остановки сервисов и remote mutation.
Если даже remote login ещё не разрешён, опирайся на source и известные metadata;
не подключайся ради заполнения пробелов. Необходимые remote-only проверки
перечисли как pending. До запуска подготовленного deploy они должны быть закрыты.

| Что установить | Почему это обязательно |
|---|---|
| SSH host/user/port/fingerprint, env и absolute root | IDE candidate/IP или локальный cwd не доказывают целевой сервер |
| Current running revision и подготовленная новая revision | Dump запускается для действующей системы, а code update не должен менять backup source задним числом |
| Действующие bytes scripts и все dependencies, compose file/project | Remote scripts могут отличаться от локальных; reviewed plan должен соответствовать исполняемому коду |
| Docker daemon/context/DOCKER_HOST, container identity | `docker exec` может работать с другим daemon, чем предполагает SSH host |
| Backend DB endpoint/database и источник dump | App читает POSTGRES_HOST/PORT; dump запускает pg_dump внутри container, но libpq PGHOST/PGHOSTADDR/PGPORT/PGSERVICE/PGSERVICEFILE могут изменить фактический endpoint |
| Совпадение source DB и затрагиваемого хранилища | Дамп соседней пустой Compose DB не защищает external DB backend |
| Согласованное окно и контроль writers | pg_dump snapshot не содержит последующие записи, а down-v удаляет старые данные |
| Backup target outside volumes/live checkout, права/место | Volume removal, upload --delete или git clean не должны удалить единственную копию |
| Explicit DB_DUMP_FILE/DOCKER_COMPOSE_FILE process overrides | Scripts вычисляют paths до source .env; один `.env` override недостаточен |
| Code/data rollback и known script failures | Наличие dump не исправляет backend-before-import, suppressed SQL errors или readiness bugs |

Не печатай `.env`, `docker inspect`/полный compose config или raw DB queries.
Для сопоставления достаточно узких проверок endpoint/resource identity и
metadata; в отчёт — match/mismatch и безопасное описание, без credentials.
Если доказать совпадение нельзя, stop, а не догадка «обычно service db».

Секреты, SQL, backups и `.git` сейчас могут попасть в Docker builder/context:
`.dockerignore` отсутствует, Dockerfile делает `COPY . .`. После обязательного
backup это особенно актуально. Конкретный reviewed план должен учитывать
защищённый build context/cache и сохранность copy. Не исправляй deployment files
или автоматически перемещай secrets под видом подготовки skills.

## Отдельный дамп: только по отдельному запросу

Пример ниже показывает форму запуска **после** выбора и разрешения source;
это не команда, которую следует выполнять при чтении runbook.

1. Подтверди target и running DB/pg_dump; не создавай/не перезапускай container
   ради «успешного dump». Не меняй `.env`, не делай source .env вручную для аудита.
   При обычном dump-only writers могут продолжать работу: snapshot не содержит
   последующие записи. Dump-only не разрешает stop/freeze; для destructive deploy
   согласованное прекращение writes обязательно до snapshot и на время rollout.
2. Выбери существующий reviewed `scripts/dump.sh` именно этой deployed системы.
   Согласуй фактический latest path и storage. Default — `scripts/dump.sql`.
   `DB_DUMP_FILE` — относительный путь под repo root, absolute paths текущий script
   обрабатывает неверно. Значение задаётся в process env **до** запуска script.
3. Не допускай parallel dump/deploy. Snapshot name имеет UTC seconds precision:
   два запуска в одну секунду способны truncate один snapshot. Каждый новый
   запуск должен создать новый artifact, прежние сохранённые snapshots не трогать.
4. Установи закрытые права создания `umask 077`; существующий latest может уже
   иметь другие права, umask их не исправит. Проверь/исправь доступ только в
   согласованном backup scope; подготовка private storage внутри этого scope
   не требует повторного разрешения на каждую подкоманду.
   **До script** проверь latest: он отсутствует либо является regular non-symlink
   file. `cp -f` следует existing symlink и может затереть посторонний файл или
   recovery copy ещё до проверки результата. Проверь resolved parents latest и
   `$ROOT_DIR/backups`, их владельца/права и принадлежность согласованному storage;
   неизвестные symlinks/пути блокируют запуск. Не обходи это удалением/заменой
   ссылок вне scope. Snapshot path не должен совпасть с existing artifact;
   сохраняй единственного writer и исключи секундный collision до запуска.

```sh
# Выполнять в подтверждённом absolute remote/local root, не в локальном clone
# вместо сервера. Эта подкоманда только для уже разрешённого backup scope.
task_repo_dir='/ABSOLUTE/CONFIRMED/ROOT'
task_dump_relative='scripts/dump.sql'
(
  set -euo pipefail
  cd -- "$task_repo_dir"
  umask 077
  DB_DUMP_FILE="$task_dump_relative" bash scripts/dump.sh
)
```

5. Прочитай **полный exit status** shell/script. `Done`, непустой файл или
   последний log line не заменяют exit 0 всего script, включая `cp -f`.
   Не скрывай ошибку pipeline/tee. Не запускай следующий этап при nonzero.
6. Из успешного запуска возьми exact timestamped snapshot path и выбранный
   latest path. Не выбирай «самый новый файл вообще» или старый dump по наличию.
   Проверь оба regular non-symlink files, новый snapshot после начала этой операции, size>0,
   принадлежность выбранной source DB и сохранение вне удаляемого volume.
7. Не читая SQL, сравни snapshot/latest bytes и SHA-256. На Linux доступны
   `test -s`, `cmp -s -- <snapshot> <latest>`, `sha256sum -- <file>`; на macOS
   digest через `shasum -a 256 -- <file>`. Пути всегда quote. Hash/size/date —
   metadata, не доказательство восстановления. Exact artifact names могут
   содержать имя private DB: в публичном ответе используй безопасный label.
8. Сохрани независимую защищённую копию вне live checkout/build context и
   удаляемых resources. Отдельная off-host передача допускается лишь в указанный
   пользователем storage scope; не загружай SQL в новый сервис по своей инициативе.
   Передача/checksum/partial-copy procedure: remote-access reference.
9. Верни: source подтверждён, script exit, время, artifact label, size, checksum
   match, storage/access status и ограничения. SQL/tokens/hashes паролей не выводи.
   Для dump-only **остановись**: деплой не разрешён.

`pg_dump -F p --inserts --no-owner --no-privileges -b` даёт plain SQL. Он не
выполняет restore и не включает cluster roles/globals. Восстанавливаемость
подтверждается отдельным разрешённым isolated restore drill, не filesize/hash.

## Каждый деплой: обязательные gates в порядке

1. **Подготовка.** Заверши изменения, self-review, relevant tests/static checks и
   независимое review. Установи target/source/path/revision. Подготовь конкретный
   backup/rollout/recovery plan. Это ещё не разрешение выполнять deploy.
2. **Явное human permission.** Покажи target/revision/commands, `down -v`, известные
   ограничения и способ recovery. Получи разрешение на одну конкретную попытку,
   если оно ещё не было дано на этот же подготовленный план. Запрос на
   инструкции или аудит не является разрешением выполнять деплой.
3. **Окно данных.** В явно согласованном scope обеспечь прекращение writes до
   snapshot и во время rollout; не выключай backend самовольно для backup.
   Без контроля writers для текущего destructive reset нельзя гарантировать
   сохранение записей. Если этот этап не согласован/не выполним — stop.
4. **Новый штатный backup.** Выполни `scripts/dump.sh` для действующей DB до
   изменения live checkout/scripts, deploy-остановки/reset/recreate/build/up.
   Уже согласованный stop/freeze writers из шага 3 допустим перед dump; source
   PostgreSQL должна оставаться доступна. Пройди
   **все проверки dump-only**, включая сохранение независимой копии. Ранее
   выполненный dump-only/старый latest не отменяет новый pre-deploy dump.
5. **Release preparation.** Только после успешного backup выполняй согласованный
   code/artifact update. Сохрани remote `.env`, backups, exact latest, keys и
   data; не делай `rsync --delete`, `git reset --hard`, `git clean` или IDE
   auto-upload как скрытый способ release. Повторно сверь revision/script bytes,
   root, Compose project/daemon и путь/хеш latest, который прочитает deploy.
6. **Одна разрешённая попытка.** Только после всех gates можно вызвать reviewed
   `scripts/deploy.sh` из выбранного root с согласованными process overrides.
   Не запускай dump и deploy одной безусловной цепочкой: между ними обязательны
   проверка backup/equality/storage и финальная сверка действующего permission.
   Если approval есть и план не менялся, отдельный повторный вопрос не нужен.
7. **Проверка результата.** Exit/logs, фактическая schema/import, данные/constraints
   в разрешённом объёме, процесс/доступность и API smoke с synthetic identity.
   `/health` route отсутствует; `Initialization complete` и SQL import exit сами
   по себе не доказывают успех. Чувствительные logs/SQL не пересылай.
8. **Отчёт и окно.** Верни revision, approvals/backup evidence, выполненные steps,
   результат и ограничения. Снятие maintenance/freeze — только согласованный
   шаг. Оставь snapshots сохранёнными; retention/удаление не являются частью
   implicit cleanup после успешного deploy.

Текущий script всё ещё запускает backend до import и подавляет SQL errors без
ON_ERROR_STOP. Новый policy gate не меняет его. Reviewer обязан учесть это в
конкретном плане; unresolved риск нельзя объявить исправленным backup.

## Ошибки, повтор, bootstrap и recovery

| Ситуация | Обязательное решение |
|---|---|
| Dump nonzero, empty/partial snapshot, failed latest copy | Не deploy; не fallback к старому latest; сохранить last-known-good и сообщить blocker |
| Running DB/container отсутствует или target mismatch | Не создавать БД/volume автоматически; сначала установить actual source/data state |
| «Первый деплой» без существующей DB | Обязательный dump не выполнен; остановиться и отдельно согласовать bootstrap. Агент не создаёт исключение сам |
| Latest изменён после backup/upload | Stop; восстановить согласованный artifact в отдельном разрешённом шаге либо пересогласовать план; не import неизвестного dump |
| Writes продолжились после snapshot | Backup уже не покрывает новые данные; остановить rollout до согласованного нового окна/backup, не обещать zero loss |
| Deploy failed / connection lost / status unknown | Не повторять; сначала определить, продолжает ли работать remote process и что случилось с volume/schema |
| Нужна следующая deploy attempt | Новое конкретное human permission и новый pre-deploy backup; старое разрешение не переносится |
| После failure source DB уже partial/empty | Сохранить good pre-deploy snapshot отдельно; не перезаписывать его dump повреждённой DB. Recovery/source выбирается явно до нового deploy |
| Требуется rollback/restore | Отдельный согласованный target/code+data plan и permission; Git revert не восстанавливает удалённый volume |

Fresh backup — тот же согласованный источник, именно этот deploy attempt и
непрерванное согласованное окно данных, а не произвольное число минут. При паузе,
изменившемся источнике, открывшихся writers или новом attempt заново пройди gates.
Даже если предыдущая попытка упала до `down`, её approval не разрешает второй
запуск. Read-only diagnosis можно продолжить в уже разрешённом scope.

Повтор dump-only возможен в уже разрешённом backup scope после установления
причины сбоя и сохранения good snapshots; он не разрешает deploy. Не подменяй
штатный `scripts/dump.sh` произвольным `pg_dump` ради обхода backup gate.
