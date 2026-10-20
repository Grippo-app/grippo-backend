# Постоянный локальный доступ к S3 и admin API

Для нового Mac используй [единый установщик и зашифрованный перенос](../../grippo-orchestrator/references/mac-setup.md).
Он восстанавливает существующие записи и полный журнал, привязывая AWS profile
к новым путям. Это отдельный путь от первоначального создания IAM user ниже:
`--apply` при переносе уже существующей identity не повторяется.
После такой установки бери точный `toolchain.nodeExecutable` и `toolchain.binPath`
из JSON-отчёта установщика для запуска Node helpers и их child environment.
Обычный `node` в PATH может указывать на другой runtime; собственный AWS profile
намеренно привязан к конкретным Node/helper. Не ослабляй эту проверку и не
перепривязывай профиль между разными runtime при каждом упражнении.

После разовой настройки на этом Mac команды выполняет агент. Для нового
упражнения пользователь одобряет полное финальное preview; повторный ручной
вход не нужен, пока доступы действуют и Keychain доступен. Настройка доступа
сама не разрешает upload/create. Перед каждой публикацией сохраняются gates
из [delivery](delivery.md) и [media-storage](media-storage.md).

## Границы хранения

Используется только собственный macOS login Keychain: service
`app.grippo.exercise-publisher.local`, accounts `admin` и `aws`.
Не извлекай browser cookies/localStorage/JWT, чужие записи Keychain или
password manager. Не передавай секреты через чат, arguments, environment,
JSON задачи, journal, файлы проекта или вывод инструментов. Native helper
передаёт записи только Node bridge через приватные pipes; access token живёт
в памяти одной команды, refresh token не сохраняется.

Исходники: [Node bridge](../scripts/exercise-vault.cjs) и
[native helper](../scripts/exercise-vault.swift).

Сборка для SwiftPM и CodeQL описана в корневом
[Package.swift](../../../../Package.swift): один native source, без зависимостей.
Она только компилирует helper; рабочая установка и записи Keychain создаются
штатными командами ниже, отдельно от CI.

Установка явная:

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-vault.cjs --install
node .agents/skills/grippo-exercise-create/scripts/exercise-vault.cjs --status
```

Бинарник и hash manifest находятся в
`~/.grippo-private/exercise-create/bin/`; директории private, файлы проверяются
по владельцу, modes и hash. Чтение не собирает и не подменяет бинарник.
Изменение исходника требует отдельного review и явной установки. Status
показывает только наличие установки/двух собственных записей.
Не вызывай native read или `--aws-credential-process` напрямую через инструмент:
их stdout предназначен только потребляющему процессу и содержит секреты.
Если sandbox блокирует Security.framework, нужен разрешённый локальный запуск
с доступом к Keychain; обход через экспорт секретов запрещён.

## AWS: отдельная ограниченная identity

Фиксированная цель: account `915173132322`, region `eu-north-1`, bucket
`grippo-bucket`, prefix `example-images/`. IAM user
`grippo-exercise-publisher` не имеет console password. Его точная
[inline policy](publisher-iam-policy.json) разрешает только
`s3:PutObject` для новых WebP с `If-None-Match: *` по HTTPS в этом bucket.
Вложенные ключи запрещены; чтение, удаление, ACL, IAM и серверные операции
не выдаются. Имена, реальные WebP bytes и checksum дополнительно проверяет
media helper.

Перед runtime STS/upload helper также проверяет весь профиль: только согласованные
region/output/credential_process, без static credentials одноимённого профиля,
role/SSO и иных источников, которые могут обойти Keychain. Несовпадение блокирует
операцию без изменения AWS config или IAM.

Новый профиль `grippo-exercise-publisher-keychain` использует фиксированный
absolute `credential_process` из Node bridge. Единственный access key
хранится в собственной записи Keychain. Существующие default и временный
`grippo-exercise-publisher` профили сохраняются. Root-сессия нужна только
для отдельно разрешённого создания identity; регулярный upload через неё
не выполняется.

Подготовка и разовое применение:

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-aws-access.cjs --plan
node .agents/skills/grippo-exercise-create/scripts/exercise-aws-access.cjs \
  --apply --expected-plan-sha256 FULL_PLAN_SHA256
node .agents/skills/grippo-exercise-create/scripts/exercise-aws-access.cjs --check
```

`--plan` только читает authority, отсутствие конфликтов и bucket encryption.
До `--apply` покажи пользователю точные identity/права/хранение и hash плана
и получи явное разовое разрешение на постоянный ключ. Флаг/hash технически
связывает план, но не заменяет человеческое разрешение.
Каждой IAM записи предшествует durable intent в
`~/.grippo-private/exercise-create/publication-journal/aws-access/`.
Потерянный ответ, существующая identity/profile/history или сбой после создания
ключа требуют reconcile; второй ключ или автоматический rollback не создаются.
Если ключ уже сохранён, проверяй существующие profile/Keychain/STS и IAM metadata
только чтением. Успешное восстановление проверки отмечай отдельным
`setup-reconciled.json` с исходным plan hash; первоначальные receipts сохраняй.

Перед S3 intent helper сверяет exact profile/credential process/region и свежий
STS account + ARN ограниченного пользователя. AWS subprocess очищает
credential/endpoint/preload overrides и использует официальные endpoints.
Перед IAM записями и использованием runtime профиля helper проверяет, что
AWS CLI history выключена; включённый history блокирует запуск без изменения
чужой конфигурации. Это предотвращает запись ответа CreateAccessKey в CLI history.
`--check` проверяет identity, но не доказывает фактический PutObject.
Не загружай тестовый файл для проверки доступа без согласованной публикации.
Источники: [условные записи S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes-enforce.html),
[credential process](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html).

## Админка: разовый защищённый ввод

Агент запускает:

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-admin-access.cjs --setup
```

После явного разрешения хранить данные админки пользователь один раз вводит
email/пароль в защищённом native окне; при интерактивном терминале используется
скрытый локальный ввод. Пароль не отправляется в чат. Helper выполняет один
обычный `POST /auth/login` на `https://grippo-app.com`, проверяет текущие
admin role/profile и raw API, затем сохраняет только проверенную собственную
запись с account binding. Он не меняет пользователя, роль, профиль или пароль.
При отсутствии известного пароля не сбрасывай его и не создавай аккаунт.

Обычная проверка и публикация уже не запрашивают пароль:

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-admin-access.cjs --check
node .agents/skills/grippo-exercise-create/scripts/exercise-admin-access.cjs \
  --publisher --preview /absolute/path/package/preview.json \
  --dictionaries /absolute/path/dictionaries.json
```

Каждая live команда читает только собственную запись, получает свежий access
token одним обычным login и проверяет привязанный account/current admin role.
JWT и AdminOnlyGuard сервера остаются штатными. Offline publisher preflight
не обращается к vault, UI или сети. Для live create добавляются штатные
`--create` и `--expected-package-sha256` одобренного пакета из delivery.
Сбой/401/timeout не вызывает повтор login или POST; после команды token
отбрасывается. Все пять переводов проверяются обычными gates publisher.

Смена пароля, отзыв AWS key или блокировка Keychain потребуют восстановления
доступа; это не шаг каждого упражнения. `--forget` удаляет только собственную
локальную admin запись и не отзывает серверные сессии.
Открытая browser session не является программным токеном.
Альтернативный уже разрешённый `GRIPPO_ADMIN_TOKEN` допускается только в памяти
процесса прямого publisher; не ищи его в файлах или браузере.
