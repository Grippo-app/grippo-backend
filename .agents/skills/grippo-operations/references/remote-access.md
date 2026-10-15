# SSH, проверка remote среды и перенос backup

Разрешения и последовательность операций задаёт
[deployment-policy.md](deployment-policy.md): каждая конкретная попытка deploy
требует прямого разрешения человека и нового успешного `scripts/dump.sh`.
Этот справочник описывает подключение/preflight/transfer внутри разрешённого
scope. Изучение репозитория не разрешает SSH; remote чтение не разрешает dump,
upload или restart. Уже согласованные подшаги не требуют повторных вопросов.

Источники: [scripts](../../../../scripts/),
[Compose](../../../../docker-compose.yml),
[DatabaseService](../../../../src/database/database.service.ts).
Remote bytes/configuration могут отличаться: проверяй выбранную систему.

## Реквизиты и уровень подтверждения

| Нужно установить | Требование |
|---|---|
| Host/user/port или существующий SSH alias | Подтверждённый target и environment; alias должен вести на ожидаемый host/account |
| Authentication | Согласованный существующий key path/agent/интерактивный механизм; private key bytes не читать и не передавать |
| Host fingerprint | Независимый доверенный источник: пользователь, администратор или console provider |
| Absolute checkout root | Реальный проект/окружение, действующая и новая revision |
| Docker и DB identity | Daemon/context, Compose project/file, backend endpoint и источник dump |
| Scope | Чтение, dump-only с storage либо конкретный разрешённый deploy attempt |

Пользователь предположительно указал `ubuntu@51.21.57.106:22`. Это совпадает с
локальными ignored `.idea/sshConfigs.xml` и `.idea/webServers.xml`, но **target
не подтверждён**. `/home/ubuntu/grippo-backend` — только кандидат, выведенный из
SFTP root `/home/ubuntu` и deployment mapping `/grippo-backend` в
`.idea/deployment.xml`; пользователь absolute path ещё не подтвердил. Existing
approved key и fingerprint неизвестны. Эти hints не разрешают login/deploy.

В `.idea/deployment.xml` указан `autoUpload=Always`. До rollout установи,
использует ли IDE эту настройку; согласуй единственного writer remote checkout.
Параллельный upload может заменить scripts/latest между backup и deploy.
Не объявляй auto-upload выключенным без проверки и не меняй IDE попутно.

Читай только нужные metadata выбранного alias/key, без содержимого ключей и
чужих hosts. Не создавай новый key, не меняй firewall/authorized_keys/groups или
Docker socket ради обхода отсутствующего доступа. Agent forwarding не включай
без необходимости и разрешённого scope.

## Host key и подключение

Все примеры — шаблоны для разрешённых операций. Placeholders не являются defaults.
В **локальном shell**, с согласованным существующим key:

```bash
SSH_HOST='<confirmed-host>'
SSH_PORT='<confirmed-port>'
SSH_USER='<confirmed-account>'
SSH_KEY='<approved-existing-absolute-key-path>'
ssh -p "$SSH_PORT" -i "$SSH_KEY" \
  -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
  "${SSH_USER}@${SSH_HOST}"
```

Для существующего проверенного alias вместо этого:

```bash
SSH_ALIAS='<approved-existing-alias>'
ssh -o StrictHostKeyChecking=yes "$SSH_ALIAS"
```

`StrictHostKeyChecking=yes` требует уже доверенного key. Для нового host сначала
сверь fingerprint по независимому источнику и установи trust согласованным
способом. `ssh-keyscan` получает ответ сети, но не подтверждает identity.
Изменившийся fingerprint — stop и выяснение причины; не отключай verification,
не подставляй `/dev/null` вместо known_hosts и не удаляй прежнюю запись ради login.
Пароли/passphrases вводит пользователь через согласованный механизм; tracing и
сырой verbose output с секретами не использовать.

## Remote preflight

Следующие примеры выполняются **в уже открытой remote Bash session**, в пределах
разрешённого доступа. Обычный SSH не обеспечивает техническую read-only sandbox.
Проверяй exit каждого шага; при ошибке не продолжай dependent команды.

```bash
REMOTE_ROOT='<confirmed-absolute-checkout-path>'
cd -- "$REMOTE_ROOT" || {
  printf '%s\n' 'Wrong or unavailable remote checkout; stop' >&2
  exit 1
}
pwd -P
id -un
hostname
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short --untracked-files=no
git diff --name-status
bash --version
sha256sum scripts/dump.sh scripts/deploy.sh scripts/internal/logger.sh \
  docker-compose.yml Dockerfile
```

Неуспешный `cd` завершает session до следующих команд. Сверь resolved cwd/root и
script hashes с прочитанной revision; branch name недостаточен. Этот status не
перечисляет untracked/ignored SQL/keys: при необходимости проверяй конкретные
paths, не раскрывая данные. Сырые diff/logs с secrets не публикуй.

Environment анализируй по именам assignments без `source .env`; shell scripts
**исполняют** этот файл. Наличие имени не доказывает непустое/runtime значение.
Для сопоставления свойств подготовь узкую проверку с выводом match/mismatch.
Не выводи `.env`, `env`, `printenv`, полный `docker inspect` или Compose config.
Реестр имён и порядок env:
[configuration-and-containers](configuration-and-containers.md).

Для Docker metadata на выбранном host, без автоматического `sudo`:

```bash
docker context show
docker info --format '{{.Name}} {{.ID}}'
docker compose version
COMPOSE_REL='<confirmed-relative-compose-path-under-checkout>'
docker compose --env-file "$REMOTE_ROOT/.env" \
  -f "$REMOTE_ROOT/$COMPOSE_REL" ps --all --services
```

Эти команды не доказывают source identity целиком. До dump/deploy сверь:

- **Daemon/project.** `DOCKER_CONTEXT`, `DOCKER_HOST`, TLS/SSH context и
  `COMPOSE_PROJECT_NAME` могут направить команду иначе. Сверь daemon ID, Compose
  project/file, service `db`, container `POSTGRES_CONTAINER_NAME` и volume.
  Не добавляй `-p` только диагностике, если deploy не получает ту же identity.
- **Backend/source DB.** Effective `POSTGRES_HOST/PORT/DATABASE/USERNAME` backend
  должны совпадать с фактической PostgreSQL instance/database/ролью dump.
  `pg_dump`/`psql` запускаются без `-h/-p`; container libpq `PGHOST`, `PGHOSTADDR`,
  `PGPORT`, `PGSERVICE`, `PGSERVICEFILE` способны изменить endpoint. Имя container
  и наличие `pg_dump` не доказывают совпадение.
- **Network/данные.** Для обычной Compose topology backend идёт к `db:5432`;
  published host port отличается от container port. Backend может использовать
  external DB. Установи actual source/data state по разрешённым metadata/DB
  проверкам без user rows. Не запускай Nest/TypeORM как diagnostic probe:
  initialize может применить `synchronize`.

Если identity неизвестна, перечисли missing evidence и останови dependent
действия. Отсутствующий running container не доказывает первый запуск: могут
сохраниться stopped container/volume или использоваться external DB.

Preflight не заменяется `git pull`, checkout/reset/clean, SFTP или `rsync --delete`.
Это записи. Передача кода относится к конкретному плану release **после** нового
проверенного backup; сохраняются remote изменения, `.env`, keys и exact latest.
После update повторно сверяются revision/script bytes, target и import checksum.

## Выполнение dump и обрыв связи

Для remote dump-only и pre-deploy backup используется единый порядок
[deployment-policy](deployment-policy.md). Dump создаётся на выбранном Docker
host; локальный `scripts/dump.sql` сам не обновляется. Не соединяй dump/deploy
безусловной цепочкой и не используй deploy как пробу доступа/readiness.

При SSH disconnect сначала установи, остался ли процесс и какие snapshot/latest
созданы; полные command lines/environment могут содержать secrets. Deploy не
повторяется без нового конкретного permission и нового backup. Dump-only retry
допустим внутри согласованного backup scope после диагностики и сохранения good
copies. Не добавляй скрытые background jobs/auto retry; если нужны tmux/nohup,
план должен явно учитывать продолжение после disconnect и защищённые logs.

## Независимая копия snapshot

Согласуй направление и private storage, находящиеся вне удаляемых ресурсов,
live checkout и build context. Подготовить directory/права можно внутри этого
backup scope; это не разрешает выбрать посторонний cloud service. Не отправляй
SQL в чат/Git и не передавай его через `ssh ... cat dump.sql` в stdout. Не копируй
вместе с backup `.env`/keys без соответствующей задачи.

**Remote:** выбери exact завершённый timestamped snapshot, а не движущийся latest.
Проверь происхождение и закрой доступ в пределах backup scope:

```bash
REMOTE_SNAPSHOT='<confirmed-absolute-completed-snapshot-path>'
if test -f "$REMOTE_SNAPSHOT" && test -s "$REMOTE_SNAPSHOT" \
  && test ! -L "$REMOTE_SNAPSHOT"; then
  chmod 600 "$REMOTE_SNAPSHOT" && sha256sum "$REMOTE_SNAPSHOT"
else
  printf '%s\n' 'Expected completed regular snapshot; stop' >&2
  false
fi
```

При ошибке остановись. Metadata/hash не доказывают restore; выбранный snapshot
не должен меняться во время transfer. Если filename содержит private DB name,
в публичном отчёте используй безопасный label.

**Локально:** следующий пример предполагает проверенный `scp` с SFTP transport,
поддерживаемый клиентом/сервером. Он не подходит для legacy `scp -O`, где иная
remote shell quoting. Для неизвестного transport выбери проверенный SFTP client;
не добавляй `-O` вслепую. Здесь paths могут содержать пробелы, но не control/glob
characters (`*`, `?`, `[`, `]`); иначе нужен проверенный exact-path transfer.

Directory заранее подготовлен, принадлежит оператору и закрыт для посторонних.
В нём один writer. Используй новый unique final/partial; existing files не
перезаписывай. Локальные и remote session variables не передаются автоматически:

```bash
LOCAL_BACKUP_DIR='<approved-private-absolute-directory>'
LOCAL_FINAL="$LOCAL_BACKUP_DIR/<approved-new-unique-snapshot-name>.sql"
LOCAL_PARTIAL="${LOCAL_FINAL}.partial"
REMOTE_SNAPSHOT='<same-confirmed-absolute-completed-snapshot-path>'
EXPECTED_SHA256='<exact-digest-from-verified-remote-snapshot>'
(
  set -euo pipefail
  umask 077
  test -d "$LOCAL_BACKUP_DIR"
  test ! -L "$LOCAL_BACKUP_DIR"
  test ! -e "$LOCAL_FINAL"
  test ! -L "$LOCAL_FINAL"
  test ! -e "$LOCAL_PARTIAL"
  test ! -L "$LOCAL_PARTIAL"
  (set -o noclobber; : > "$LOCAL_PARTIAL")
  scp -P "$SSH_PORT" -i "$SSH_KEY" \
    -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
    "${SSH_USER}@${SSH_HOST}:${REMOTE_SNAPSHOT}" "$LOCAL_PARTIAL"
  chmod 600 "$LOCAL_PARTIAL"
  ACTUAL_CHECKSUM_OUTPUT="$(shasum -a 256 "$LOCAL_PARTIAL")"
  ACTUAL_SHA256="${ACTUAL_CHECKSUM_OUTPUT%% *}"
  test -n "$ACTUAL_SHA256"
  test "$ACTUAL_SHA256" = "$EXPECTED_SHA256"
  test -s "$LOCAL_PARTIAL"
  test ! -L "$LOCAL_PARTIAL"
  test ! -e "$LOCAL_FINAL"
  test ! -L "$LOCAL_FINAL"
  mv -- "$LOCAL_PARTIAL" "$LOCAL_FINAL"
)
```

Для одобренного alias в этом block замени только SCP invocation на
`scp -o StrictHostKeyChecking=yes "${SSH_ALIAS}:${REMOTE_SNAPSHOT}" "$LOCAL_PARTIAL"`.
При отсутствии `shasum` используй заранее проверенную checksum utility; не
устанавливай пакеты автоматически. Проверяй exit всего block и самого `mv`,
права final и неизменность remote checksum после передачи. Rename внутри одного
filesystem публикует завершённую копию; partial при failure остаётся invalid.
Original snapshot сохраняется независимо от результата transfer.

Для remote checksum предпочтительна показанная интерактивная session:
`ssh host command "$REMOTE_ROOT"` сам не гарантирует сохранения границ аргументов
в remote shell. Не строй shell code из paths через eval/backticks/JSON.stringify.

Обратный restore transfer требует разрешённого restore plan с новым staging
partial, restrictive permissions, source checksum, rename в одном filesystem и
повторной сверкой import path. SCP прямо в `scripts/dump.sql` может уничтожить
единственный latest. Передача backup сама не разрешает import/redeploy.

В отчёте укажи target/scope, revision/script evidence, dump/transfer status и
ограничения, без SQL/keys/production logs. Без runtime доступа явно укажи, что
SSH, Docker/DB identity и restore не подтверждены.
