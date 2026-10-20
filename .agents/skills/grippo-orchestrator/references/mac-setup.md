# Новый Mac: единый установщик Grippo

Точка входа — [scripts/setup-mac.sh](../../../../scripts/setup-mac.sh).
Она готовит локальную машину для девяти project skills и восемнадцати агентов.
Не вызывает приложение, SSH, Docker daemon, dump/deploy, S3 PutObject или API
создания упражнений. Из другого каталога передай абсолютный путь к скрипту.

## Установка и проверка

После clone открой корень репозитория в Codex. Скилы и профили уже находятся в
`.agents/skills/` и `.codex/agents/`; копировать их в домашнюю папку не требуется.

```bash
/bin/bash -p scripts/setup-mac.sh --plan
/bin/bash -p scripts/setup-mac.sh --install
/bin/bash -p scripts/setup-mac.sh --check
```

Без флагов выполняется план без установки. `--install` ставит недостающие
инструменты через Homebrew, зависимости проекта через `npm ci --ignore-scripts`
и штатный Keychain helper. Уже подходящие инструменты сохраняются. Swift source
и существующая установка helper не подменяются. Для неполной/устаревшей установки
нужно отдельное восстановление; её файлы не удаляются автоматически.

Локальный Node 22/24 используется для tools и проверок; Docker runtime остаётся
Node 20. Нужны Python 3.11+, native PostgreSQL 15, AWS CLI v2, WebP tools, Git,
ripgrep, GitHub CLI, Docker Desktop/Compose и Codex. Установщик не запускает
PostgreSQL service, Docker daemon или приложение. Для SQL suite нужны binaries
PostgreSQL 15, а не рабочая БД. Shell profile и глобальные defaults не меняются.

Если Homebrew отсутствует, используется официальный installer, закреплённый
commit и SHA-256: он сначала сохраняется в приватный временный файл, проверяется
и затем запускается в интерактивном терминале. Installer может создать Homebrew
prefix и `/etc/paths.d/homebrew`; shell rc не редактируется. На новых Intel Mac
установка Homebrew может быть недоступна текущему upstream; уже установленный
Intel Homebrew поддерживается. Неинтерактивная сессия получает PENDING.

Apple Command Line Tools, системные запросы администратора и входы в сервисы
могут требовать действий человека. Отмена или незавершённый системный installer
дают PENDING; повтори ту же команду после завершения. Не вводи пароли в чат.

`--check` проверяет локальные компоненты, структуру agent kit и типы без
AppModule/БД. Он не обращается к AWS/admin API и не запускает сети Docker.
`--check-online` дополнительно выполняет обычный admin login/readback, AWS STS
проверку ограниченного пользователя и проверку текущего GitHub входа. Это не
проверка возможности S3 PutObject: тестовая картинка не загружается.

JSON-отчёт содержит READY/PENDING/FAIL/NOT_CHECKED для каждой возможности.
`localReady` относится только к проверенному локальному окружению. Не превращай
его в утверждение о готовности всех интеграций. Codex login, фактические web/
imagegen/subagent tools, Notion upload/edit и серверный доступ проверяются
отдельно в соответствующей среде; shell не получает их browser sessions.
Отчёт также возвращает публичный `toolchain.nodeExecutable` и `toolchain.binPath`.
Для дальнейших CLI helpers агент использует именно этот Node и child PATH:
Homebrew Node бывает keg-only, а обычный `node` может оказаться другим runtime
Codex. Это сохраняет строгую привязку AWS credential process без правки shell rc.
Пути читай как JSON и передавай отдельными аргументами, без shell `eval`.
Для publisher AWS profile путь Node и checkout допускает ASCII: латиницу,
цифры, пробелы и символы `/._@-`. Unicode и прочие символы дают безопасный отказ
`MAC_AWS_PROCESS_PATH_UNSAFE`; выбери подходящий путь до переноса.
Код 2 означает недостающую готовность, а не разрешение исправлять её любым
способом. Ошибка выполнения возвращает ненулевой код и безопасное имя ошибки.

## Перенос доступов и полного журнала

На старом Mac должны быть доступны обе собственные записи Keychain и полный
фиксированный журнал. Сначала останови всех publisher writers на обоих Mac и
другие утилиты, меняющие AWS config. `--writers-stopped` фиксирует заявление
оператора; это не блокировка другого компьютера. После переноса используй один
компьютер для публикаций. Локальный journal не является server idempotency. После миграции перед новой
публикацией проверь readiness; незавершённый импорт запрещает продолжение.

На старом Mac выбери **новый** абсолютный путь вне checkout, внутри своей
приватной папки. Например, после создания папки с mode 0700:

```bash
/bin/bash -p scripts/setup-mac.sh --export "$HOME/.grippo-private/transfer.grippo" --writers-stopped
```

Для выбранных SSH key и runtime `.env` добавь явные абсолютные пути:

```bash
/bin/bash -p scripts/setup-mac.sh --export "$HOME/.grippo-private/transfer.grippo" --writers-stopped \
  --ssh-key "$HOME/.ssh/grippo-deploy.pem" --env-file /absolute/selected/runtime.env
```

Пути выше — шаблоны выбора, не подтверждение существования или production
назначения файла. Источники должны принадлежать текущему пользователю, иметь
0400 или 0600, быть обычными одиночными файлами без symlink/hardlink. Значения `.env`
не исполняются. Другие ключи и соседние `.env` не ищутся.

В двух скрытых системных окнах задай и повтори отдельную парольную фразу
не короче 16 символов. Она нужна при импорте; скрипт её не сохраняет. Фраза,
AWS/admin credentials и plaintext export intermediates не попадают в argv,
environment, логи или открытый файл. Выбранные SSH/env при импорте сохраняются
в собственные файлы 0600, как описано ниже. Пакет
шифруется AES-256-GCM с ключом из scrypt (N=131072, r=8, p=1), случайными salt/nonce. Пароль
передавай отдельно от файла, через собственный защищённый канал.

В пакет входят собственные записи `admin`/`aws`, **всё** содержимое
`~/.grippo-private/exercise-create/publication-journal/`, включая старые
ошибочные попытки и reconciliation receipts, и только явно выбранные SSH key/
`.env`. Состояние Keychain других приложений, browser sessions, бинарник,
AWS config, дампы и папка `work/` в пакет не входят.

Перенеси зашифрованный файл на новый Mac, сохрани приватные права 0600 и
сверь показанный SHA-256 файла на обоих компьютерах. Установи окружение, затем:

```bash
/bin/bash -p scripts/setup-mac.sh --import "$HOME/.grippo-private/transfer.grippo" --writers-stopped
/bin/bash -p scripts/setup-mac.sh --check-online
```

До записи импорт проверяет аутентичность пакета, все пути/размеры/hash, полный
план слияния журнала, записи Keychain и собственный AWS profile. Различающиеся
существующие записи или файлы блокируют импорт; одинаковые пропускаются.
Symlink, hardlink, небезопасные owner/modes и выход из фиксированного root
запрещены. Исторические абсолютные пути внутри receipts сохраняются как bytes.
Старый непустой journal в checkout требует предварительной миграции по
[delivery](../../grippo-exercise-create/references/delivery.md#миграция-старого-журнала).

Записи восстанавливаются в Keychain текущего пользователя. Собственный профиль
`grippo-exercise-publisher-keychain` привязывается к **новым** абсолютным путям
Node/helper; остальные профили сохраняются. Конфликт со static credentials,
неожиданными полями или включённой AWS CLI history требует разбора. IAM user,
access key, серверные роли и пароль не создаются и не меняются. Повторный
`exercise-aws-access --apply` при переезде не используется.

Выбранные серверные файлы восстанавливаются с 0600 в
`~/.grippo-private/mac-setup/server-access/grippo-deploy.pem` и `runtime.env`.
SSH config и `.env` в checkout не заменяются. Для будущей операции укажи эти
пути явно, проверив среду. Несовпадение существующего файла блокирует импорт.
Наличие ключа не подтверждает серверную авторизацию или fingerprint; наличие
`.env` не подтверждает правильность production конфигурации.

Импорт сохраняет intent/result в `~/.grippo-private/mac-setup/`. После частичной
ошибки не удаляй историю и не выполняй rollback секретов. Повтори импорт того же
неизменного файла: он сверит уже записанные значения. После аварийного завершения
может остаться lock. Явное продолжение:

```bash
/bin/bash -p scripts/setup-mac.sh --import "$HOME/.grippo-private/transfer.grippo" --writers-stopped --resume
```

Продолжение требует того же аутентифицированного пакета, валидного intent и
доказанно завершившегося PID владельца lock. Живой/неизвестный процесс или
конфликт — остановка для reconciliation, без автоматического удаления lock.
Проверенные точные bytes/hash и readback определяют успех, а не наличие папок.
Readiness сверяет сохранённые nonsecret inventories с журналом и выбранными
серверными файлами; потеря исторического guard после импорта также даёт PENDING.
Команды S3 upload и API create дополнительно проверяют историю миграции перед
своим intent: незавершённый импорт, lock или утраченный guard блокируют запись.
Эта проверка не читает SSH/env и не мешает read-only сверке прежней попытки.
Оставшиеся `.import-*` после аварии требуют reconciliation; их не удаляют вслепую.

## Доступы вне пакета

Новый ручной admin setup доступен через `--setup-admin`: штатное скрытое окно,
проверка реального входа, затем собственная запись Keychain. Импорт уже
сохранённого доступа этого не требует. Блокировка Keychain, смена пароля или
отзыв AWS key остаются причинами восстановления доступа.

GitHub и Codex авторизуются обычным входом; плагины и Notion подключаются в
клиенте. Установщик не копирует их токены. Импортированные SSH key и runtime `.env`
подключай явно по [remote-access](../../grippo-operations/references/remote-access.md)
и [configuration](../../grippo-operations/references/configuration-and-containers.md),
с проверкой target/fingerprint и без вывода значений. Подключение доступов не
разрешает deploy: правила конкретной попытки и нового dump сохраняются.

Реализация: [orchestrator](../../../../scripts/internal/setup-mac.cjs),
[encrypted transfer](../../../../scripts/internal/mac-transfer.cjs),
[own access adapter](../../../../scripts/internal/mac-access.cjs),
[selected server files](../../../../scripts/internal/mac-server-access.cjs).
