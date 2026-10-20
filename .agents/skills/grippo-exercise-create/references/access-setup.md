# Доступ к S3 и admin API

Подключение доступа и проверка чтения не разрешают upload или create.
До внешней записи остаются обязательными preview, подтверждение пакета и
publication gates из [delivery](delivery.md) и [media-storage](media-storage.md).
Не извлекай cookies, localStorage/JWT, browser credentials или секреты из
password manager. Не передавай ключи и пароли через чат, CLI arguments,
JSON задачи или журнал публикации.

## AWS: отдельный профиль и браузерный вход

Цель: account `915173132322`, bucket `grippo-bucket`, region `eu-north-1`,
prefix `example-images/`. Это не разрешение менять IAM, policy или ACL.
На локальной AWS CLI 2.34.38 поддерживается официальный `aws login`:

```bash
env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY \
  -u AWS_SESSION_TOKEN -u AWS_SECURITY_TOKEN \
  AWS_PAGER='' aws login \
  --profile grippo-exercise-publisher --region eu-north-1
```

В проверенном запуске login не сохранил region нового профиля. После успешного
входа регион задан отдельно; при настройке нового профиля проверь его:

```bash
aws configure set region eu-north-1 --profile grippo-exercise-publisher
aws configure get region --profile grippo-exercise-publisher
```

Это только локальная настройка выбранного профиля, не изменение AWS resources.

Используй уже открытую сессию Chrome `Grippo App` и проверь identity на экране
согласования. Отдельное имя профиля сохраняет default profile, но **не сужает
права** identity. Обнаруженный root-вход даст CLI права выбранной root identity до истечения
сессии; не подтверждай такую новую выдачу доступа без отдельного согласия
пользователя на конкретный экран. Для регулярной работы ограниченная identity
предпочтительна; её создание/изменение прав — отдельная согласованная задача.

CLI сохраняет login metadata и временные credentials по умолчанию в `~/.aws`
(расположение может быть изменено AWS configuration environment),
не в репозитории. Access credentials обновляются в пределах browser login
session (до 12 часов); это не бессрочный unattended доступ. Не читай и не
копируй cache. При истечении повторяй обычный browser login.
Не заменяй default keys и не создавай новые access keys ради этого шага.

После успешного входа read-only `sts get-caller-identity` должен подтвердить
именно целевой account. `HeadBucket`/`HeadObject` проверяют только соответствующее
чтение: отказ HeadBucket может означать отсутствие ListBucket, а успешное чтение
не доказывает разрешение PutObject. Пробная загрузка запрещена при поручении
только подключить доступ. Не выдавай её отсутствие за проверенный live upload.

Media helper наследует AWS environment. Для будущего согласованного запуска
выбирай профиль через `AWS_PROFILE=grippo-exercise-publisher`, удаляя те же
четыре static credential variables; их наличие может перекрыть login profile.
Другие flags helper, target и preview/hash gates остаются по media-storage.

Источники: [официальный browser login](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html),
[login credentials и срок сессии](https://docs.aws.amazon.com/sdkref/latest/guide/feature-login-credentials.html),
[credential precedence](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in-troubleshoot.html).

## Админка: browser и CLI — разные сессии

Открытая Grippo Admin подтверждает browser доступ после свежего чтения
каталога и выбора существующей карточки, включая raw translations. Save,
New, изменение формы и открытие пользовательских push tokens для проверки
доступа не нужны. Browser session автоматически не передаётся в Node helper.

Для прямого API пути используй локальный wrapper со скрытым вводом:

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-admin-access.cjs --check
```

Команду запускает пользователь в своём интерактивном терминале. Email и пароль
вводятся скрыто прямо там; агент не просит их в чат и не наблюдает ввод.
Wrapper не принимает credentials из arguments/environment/files. Он выполняет
один обычный `POST /auth/login` на `https://grippo-app.com`, оставляет access
token только в памяти, не сохраняет refresh token и читает self user, каталог
и raw translations одной существующей карточки. В результате — только безопасная
сводка admin role/profile, количества карточек, raw route/revision и наблюдаемых
языков. Неполные переводы старой карточки не доказывают неподдержку языка API.
Проверка доступа не создаёт упражнение, пользователя или профиль.

Если у browser аккаунта нет известного пароля, не сбрасывай пароль и не
создавай нового пользователя автоматически. Browser остаётся отдельным
доступным каналом; программный вход требует решения пользователя.

В будущем wrapper может вызвать штатный publisher в том же процессе:

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-admin-access.cjs \
  --publisher --preview /absolute/path/package/preview.json \
  --dictionaries /absolute/path/dictionaries.json
```

Без create/verify-only flags это только offline preflight: нет prompt и сети.
Для согласованного create добавляются обычные `--create` и
`--expected-package-sha256` из delivery; live wrapper сначала проверяет пакет
offline, затем запрашивает credentials и проверяет доступ. Он не отменяет
подтверждение конкретного пакета, не обновляет токен автоматически и не повторяет
login/POST при ошибке. После выхода token отбрасывается; будущий live запуск
потребует нового локального входа.

Ранее разрешённый `GRIPPO_ADMIN_TOKEN` в памяти процесса остаётся альтернативой
для прямого publisher. Не ищи его в `.env`, браузере или credential stores.
