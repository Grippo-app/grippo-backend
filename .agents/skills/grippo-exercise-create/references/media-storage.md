# Изображения Grippo: действующая структура и публикация

## Проверенные факты

20 октября 2026 прочитана AWS Console в существующем Chrome profile
`Grippo App`; настройки и файлы не изменялись. Прочитаны список bucket,
обе страницы `example-images/`, CloudFront origin и metadata одного объекта.
Дополнительно выполнены публичные HTTP range GET шести существующих WebP:
прочитаны только response headers и первые 128 байт, без сохранения медиа.

Точки повторной проверки: [S3 prefix](https://eu-north-1.console.aws.amazon.com/s3/buckets/grippo-bucket?region=eu-north-1&prefix=example-images/&showversions=false),
[CloudFront origins](https://us-east-1.console.aws.amazon.com/cloudfront/v4/home?region=eu-north-1#/distributions/E3JQQO4VD20GOA/origins),
[публичный WebP sample](https://dsikfdo0rac0e.cloudfront.net/example-images/reverse_hack_squat.webp).

| Параметр | Наблюдение |
|---|---|
| Bucket / region | `grippo-bucket`, `eu-north-1` (Europe/Stockholm) |
| Bucket root | В просмотренном root одна папка `example-images/` |
| Objects под prefix | 425/425 имён просмотрены: 201 `.png`, 224 `.webp` |
| Naming | Все 425 соответствуют `example-images/[a-z0-9]+(?:_[a-z0-9]+)*\.(png\|webp)`; вложенных папок среди этих ключей нет |
| CDN | `https://dsikfdo0rac0e.cloudfront.net/` |
| CloudFront distribution | `E3JQQO4VD20GOA`, имя `grippo-bucket-cloud-front` |
| Origin | `grippo-bucket.s3.eu-north-1.amazonaws.com`, origin path пустой (`-` в Console) |
| S3 metadata sample | `example-images/reverse_hack_squat.webp`: `Content-Type: image/webp`, Standard, SSE-S3; в metadata одна запись Content-Type, Cache-Control не показан |
| Live WebP samples | 6/6: HTTP206, `image/webp`, реальные RIFF/WEBP + VP8 bytes, 1024×1024, без alpha, animation и ICC chunk |

Шесть проверенных файлов: `seated_neutral_grip_dumbbell_wrist_curl.webp`,
`reverse_hack_squat.webp`, `incline_bench_dumbbell_curl.webp`,
`incline_bench_hammer_curl.webp`, `lying_dumbbell_extension.webp`,
`wide_hack_squat.webp`. Размеры файлов 24 254–116 182 байт — наблюдение,
не установленный лимит. Метаданные/размеры остальных 218 WebP не проверялись.
Отсутствие ICC chunk не доказывает проверку всего color pipeline.
Сам инструмент ограничивает один файл20MiB ради bounded read/HTTP verification;
это собственный ресурсный предел, одинаковый до upload и при CDN GET, а не
восстановленный лимит bucket или целевой размер картинки.

PNG и WebP часто имеют общий stem; есть и WebP без пары PNG. Это не позволяет
требовать PNG для каждого нового упражнения. В реально сохранённых ссылках
из прежнего media ledger эти шесть упражнений используют `.webp` на CDN.
Исходный admin prompt900×900PNG описывает желаемую генерацию, а не актуальную
структуру раздачи. Не превращай его в правило bucket.

## Правила нового результата

Пользователь поручил следовать существующей структуре. Машиночитаемый профиль —
[media-policy.json](media-policy.json); при документированном изменении среды
сначала обнови подтверждённые факты и профиль, не подменяй target молча.

- Финальное превью для модели: static opaque WebP1024×1024, Content-Type
  `image/webp`. Это выбранное продолжение проверенной выборки текущих файлов,
  не утверждение, что bucket технически запрещает другие изображения.
- `stem` — короткое English имя канонического варианта в lower snake_case.
  Сравни формулировку с соседними именами. Сохраняй важные setup/снаряд/хват;
  начало с цифры допустимо, например `45_degree_leg_press`.
- Key только `example-images/<stem>.webp`. Никаких новых папок, дефисов,
  пробелов, кириллицы, timestamp, случайных UUID или locale suffix без
  отдельной причины/принятого изменения соглашения. Regex проверяет форму,
  а смысл имени — AI/reviewer по канону и соседним именам.
- Изображение генератора сохраняется локально как исходник. Если это PNG,
  готовь WebP разрешённым текущими инструментами способом; смена расширения
  не является конвертацией. Source PNG можно сохранить локально; upload PNG
  в bucket не обязателен и не следует автоматически из пар старых файлов.
- URL модели — `https://dsikfdo0rac0e.cloudfront.net/example-images/<stem>.webp`.
  Это URL после публикации и проверки, не доказательство существования файла
  от простой конкатенации. Не подставляй S3 Console link, signed URL или
  временный URL генератора в итоговую модель.

## Техническая упаковка PNG в WebP

В среде исследования доступен `cwebp`; проверены его `-h`/`-longhelp` без
конвертации файлов. При разрешённой текущими image tool instructions упаковке
исходного static opaque1024×1024PNG подходит lossless WebP encoding:

```text
cwebp -lossless -m 6 -metadata icc -quiet <absolute-source.png> -o <new-output-directory>/<stem>.webp
```

Это шаблон argv, не команда с готовыми путями. Создай отдельную новую папку
для результата и убедись, что выходного файла ещё нет: сам cwebp может его
перезаписать. Вход сначала полностью декодируй и проверь size/static/opaque;
после кодирования декодируй WebP и сравни pixels/размеры, затем просмотри его.
Если нативный output больше1024, image-pipeline допускает только разрешённую
текущими инструментами пропорциональную техническую упаковку без обрезки:
сохрани исходник, запиши resize/цветовое преобразование и перепроверь финальные
pixels. Не заявляй побитовое совпадение исходных и уменьшенных pixels как lossless:
lossless относится к кодированию уже подготовленного1024 изображения.
Lossless выбран для сохранения исходных pixels, а не как якобы установленная
настройка нынешнего bucket. Его quality/encoder presets по старым файлам
не восстановлены; жёсткого лимита KB из наблюдённых размеров не выводи.

Это сериализация в требуемый формат. Позу/анатомию/стиль и другое визуальное
редактирование выполняет imagegen по [image-pipeline](image-pipeline.md).
Соблюдай ограничения инструментов текущей сессии; если такая упаковка
недоступна/запрещена, зафиксируй конкретный pending шаг и сохрани исходник.
Не переименовывай PNG в WebP и не устанавливай новый encoder молча.

## Локальный план и будущий upload

После generation/QA по [image-pipeline](image-pipeline.md):

```bash
node .agents/skills/grippo-exercise-create/scripts/exercise-media.cjs \
  --file /absolute/path/media/preview.webp \
  --stem knee_push_up \
  --out /absolute/path/new-media-package
```

`knee_push_up` здесь пример синтаксиса, не утверждение о новом упражнении или
свободном ключе. Helper проверяет реальные WebP bytes/размер/alpha/animation,
naming и профиль, сохраняет plan/QA с SHA-256 в новую папку. По умолчанию
нет сети/записи S3, опубликованный URL остаётся planned.
Его `HEADERS_PASS` относится только к контейнеру/заголовкам: полноценный decode,
decoded opacity и визуальное соответствие канону остаются отдельными
обязательными проверками. Отчёт helper перечисляет их в remainingValidation.

В задаче разработки инструмента на этом остановись: не публикуй тестовый
файл, не меняй backend/админку, AWS permissions или существующие изображения.
При будущем поручении публикации сначала покажи пользователю
[полный пакет с ещё локальной картинкой](preview-and-approval.md) и получи
явное подтверждение этой версии, target и операций. До него ни CLI, ни Console
upload не выполняются; QA/review/готовый plan или общий запрос не заменяют
подтверждение. Missing equipment сохраняет блокер пакета до отдельного решения.
Затем выбери действующий разрешённый канал:

1. **AWS CLI.** Добавление `--upload` к helper — явная попытка одной записи
   по проверенному preview. Кроме file/stem/out обязательны
   `--preview /absolute/path/package/preview.json` и
   `--expected-package-sha256 <показанный и подтверждённый hash>`.
   Preview создаётся штатным offline mode по [delivery](delivery.md).
   Helper до внешней команды проверяет identity пакета и совпадение source
   bytes/hash, bucket/region/key/URL/Content-Type с утверждённым preview.
   Для этого запуска укажи новую `--out` папку: существующая не перезаписывается.
   Длина S3 key с prefix ограничена 1024 UTF-8 bytes. Нужна рабочая стандартная AWS-сессия. Скрипт
   использует fixed bucket/region/prefix, Content-Type, SHA-256 и conditional
   `If-None-Match:*`; shell-команд из JSON не исполняет. Реальную авторизацию
   определяет поручение человека, не наличие флага.
2. **AWS Console через браузер.** Используй существующий profile `Grippo App`,
   проверь bucket/region и `example-images/`, отсутствие ключа, выбери точный
   проверенный локальный файл с именем `<stem>.webp`. Подтверди destination и
   Content-Type перед Upload, затем проверь success/object properties. Если
   Console предупреждает о замене, остановись; не обходи это через upload.
   Проверка списка/предупреждения не является atomic conditional create:
   другой writer может занять key после проверки. Этот путь допустим только
   при подтверждённом эксклюзивном контроле выбранного key на время upload;
   иначе используй канал с `If-None-Match:*` или оставь pending access.
   Не объявляй no-overwrite гарантией самого Console.
   Browser UI действуй через доступный computer-use tool. Не экспортируй
   cookies/credential values и не переноси browser session в CLI.

На дату исследования локальный AWS CLI default profile отвечал
`InvalidClientTokenId`, а browser session позволила read-only проверку.
Это факт окружения исследования, не вечная неисправность и не разрешение
создавать новые keys/roles. При ошибке CLI используй уже разрешённую рабочую
сессию Console или обозначь pending access; не проси секреты в чат.
Штатный browser login CLI и выбор отдельного профиля описаны в
[access-setup](access-setup.md); профиль не ограничивает права выбранной identity.

CLI upload дополнительно оставляет `media-upload-started.json` до внешней
команды и `media-upload.json` с безопасным outcome. Отсутствие завершающего
receipt при наличии started требует reconcile; это не разрешение повторить
команду. До команды также фиксируется intent в общей папке пользователя
`~/.grippo-private/exercise-create/publication-journal/` по bucket/key. Другая `--out`,
копия preview или новый checkout того же пользователя не обходят запрет
повторного put этого key. Existing intent/result
требует сверки состояния/решения пользователя; helper сам не стирает журнал.
Process error/signal/timeout имеет приоритет над частичным stderr и оставляет
неизвестный исход. Успешный receipt сохраняет доступные ETag/VersionId.
До put синхронизируются contents intent/start файлов и directory entries;
новые компоненты journal directory тоже синхронизируются в родителях.
Журнал имеет фиксированный путь без CLI/env override. Его private компоненты
проверяются на владельца/0700, файлы — на владельца/0600, каждый родитель — на
безопасность и отсутствие symlink. Старый непустой журнал в checkout блокирует
upload до [явной миграции всей истории](delivery.md#миграция-старого-журнала).
Ошибка такой синхронизации останавливает попытку до AWS. Это durability кода,
а не результат фактической power-failure проверки файловой системы.
`uploaded` подтверждает S3/checksum, а `publicReadbackPending` всё
ещё требует проверки CDN. Это не тот же статус, что опубликованная модель.

У существующего key сначала проверь канон и соответствие файла; не затирай
его и не добавляй произвольный `_v2` ради обхода коллизии. Отличающийся вариант
получает осмысленный уникальный stem. Сетевая ошибка не доказывает отсутствие
записи; при неизвестном исходе сначала reconcile, без автоматического
retry/delete/CloudFront invalidation. Bucket policy/ACL/кэш/шифрование не меняй
для загрузки одного превью, не добавляй `public-read`.

Conditional put и checksum поддерживаются текущей CLI input schema;
семантика — [AWS conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html)
и [PutObject CLI](https://docs.aws.amazon.com/cli/latest/reference/s3api/put-object.html).
Это защита от перезаписи, не доказательство качества картинки или публикации.

## Подтверждение URL и модели

После upload проверь metadata S3 и обычный CDN GET без admin Authorization:
успех, `image/webp`, фактические bytes/размеры и hash финального файла. Проверь
видимое изображение и отсутствие заглушки/ошибки. HEAD и успешный put сами
по себе не подтверждают финальную CDN выдачу. При cache/распространении
подожди и перепроверь read-only; не повторяй запись ради того же URL.

Для повторяемой read-only проверки добавь `--verify` вместо `--upload` к media
helper, сохранив file/stem, approved preview/hash и новую out папку. Команда
делает один HTTPS GET точного pinned CDN URL без Authorization/redirects,
проверяет200, Content-Type, полный размер/hash и пишет `media-public.json`.
Она не делает put или invalidation, не доказывает full pixel decode/рендеринг
клиента и не заменяет предшествующий image QA. При несовпадении/timeout
оставь media pending и повторяй только read-only проверку после ожидания.

Сохрани в media receipt bucket/region/key, URL, hash/bytes, результаты upload
и CDN verification без credential traces. Только после этого planned URL
считается опубликованным; payload уже проверен в preview. Для ручного editor/API
export перенеси тот же URL в draft без иных правок по [delivery](delivery.md).
Сохранение exercise в API выполняется отдельно, если оно входит в поручение.
Для этих двух операций не нужны backend deploy/restart, SSH или DB dump:
изображение — объект S3, карточка — данные через существующий admin API.
Если целевой contract не подходит, это отдельная backend задача с operations
gates, не разрешение скрыто обновить production.
