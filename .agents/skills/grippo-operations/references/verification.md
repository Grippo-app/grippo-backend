# Проверка эксплуатационных изменений

Общие команды TypeScript/Jest, diff hygiene, agent-kit validator, изоляция и
формат evidence находятся в
[grippo-verification/checks](../../grippo-verification/references/checks.md).
Здесь — дополнительные сценарии для
[deploy/dump/cleanup/logger](../../../../scripts/),
[Dockerfile](../../../../Dockerfile) и [Compose](../../../../docker-compose.yml).

## Статические проверки

- `bash -n` проверяет parsing **каждого файла отдельно**, не поведение и не
  side effects. В `bash -n a b` файл `b` лишь аргумент script `a`.
- При доступном ShellCheck используй `-x -P SCRIPTDIR`; dynamic `.env` source
  может оставлять SC1090. Не подставляй настоящий secret `.env` в source directive.
- Bash snippets из изменённых instructions извлекай во временные файлы и
  проверяй только через `bash -n`. Их operational commands не выполняются.
- TypeScript/build/Jest не подтверждают backup, Docker health, SQL import или SSH.
  `npm ci`, Docker build и app startup не нужны для статического review scripts.

## Readiness: зависимость от версии Bash

В deploy используется `set -e`, затем `attempt=0; ((attempt++))`. Post-increment
возвращает status 1 для прежнего значения 0; применимость errexit к arithmetic
command различается между Bash 3.2 и современными версиями. Без Docker это
можно проверить отдельным чистым subprocess, если проверка семантики нужна задаче:

```bash
bash -c 'set -e; attempt=0; ((attempt++)); printf "%s\n" reached'
```

На исследованном macOS Bash 3.2.57 subprocess напечатал `reached` и вернул 0.
На Bash с errexit для arithmetic ожидается exit 1 без `reached`. Не объявляй
этот probe выполненным на remote host и не обещай 30 retries по одному наличию
`MAX_ATTEMPTS`. Probe не запускает deploy/logger/.env/Docker и не доказывает
readiness реальной DB.

## Сценарии для self-review и независимого review

| Область | Что проверить по source/diff |
|---|---|
| Permission | Прямое human permission на конкретный target/path/revision/commands; новый штатный dump до каждой попытки; review/SSH/dump-only не дают deploy permission |
| Env/paths | Выбор путей до source .env, относительные overrides, quoting, default cwd/Compose identity; случай absolute path не считается поддержанным |
| DB identity | Daemon/project/container соответствуют backend и libpq endpoint, а не соседней пустой DB |
| Dump | pg_dump/copy failures, partial/empty файл, секундный collision, права existing latest, equality/checksum, независимая recovery copy |
| Deploy | down-v до build, первая readiness failure и Bash version, missing dump, suppressed SQL error, backend-before-import, состояние после каждой ошибки |
| SSH/transfer | Unknown/changed fingerprint, cd failure, .partial/checksum/rename, параллельный upload, disconnect без автоматического retry |
| Cleanup | Sudo escalation, daemon-wide prune, tmp/apt/journal/reboot, ветки без Docker/apt и безусловные success messages |
| Secrets | Нет SQL rows/keys/.env/raw production logs в diff/output; context/cache проверяется отдельно от runtime image |

Если задача требует shell harness, работай в изолированной копии: подмени **все**
external/write commands и source/write paths. Забытый docker/sudo/rm/reboot делает
harness неизолированным. Operational forward-test ограничивается чтением
сценария и выбором действия: реальные SSH/dump/deploy/restore не запускаются.

После исправления повтори затронутые проверки и независимое review. Отмечай
PASS/FAIL/NOT_RUN, фактическую команду/exit и ограничения; статический разбор
failure branch не выдавай за выполненный restore или проверку production.
