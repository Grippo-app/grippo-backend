# Обязательный архив production dump в Notion

Пользователь назначил [Dump history](https://app.notion.com/p/3300cb0926ef80a7b760e51cf768a2d1)
постоянным местом хранения полных SQL backup каждой production deploy attempt.
Page ID: `3300cb09-26ef-80a7-b760-e51cf768a2d1`. Это разрешение прикладывать dump
файлом на указанную страницу в рамках разрешённого deploy; оно не разрешает
сам dump/deploy/retry, другие назначения или изменение прав страницы.
Основные gates — в [deployment-policy](deployment-policy.md).

## Формат существующей страницы

MCP fetch подтвердил: новые записи сверху, каждая — native callout с серым значком
`/icons/circle-dot_gray.svg`. Первая строка: `At D MMM YYYY (краткая причина)`,
месяц по-английски. Внутри — native file `dump.sql`. Для новых записей брать дату
самого snapshot в UTC; timezone старых записей по fetch не установлена.
Для deploy причина: `Prod before deploy: <краткое изменение>`; фазы разных backup
одной попытки можно уточнить в скобках. Существующие записи не переписывать.
Исторические ZIP с изображениями не требуют нового image archive при каждом deploy.

## Порядок агента

1. До live upload/release switch выполнить новый разрешённый штатный `dump.sh`,
   проверить exit0, source identity и все snapshot/latest/recovery size/SHA256.
   Выбрать immutable `receipt.snapshot`, сохранить good recovery copy.
2. В пределах того же разрешённого backup scope передать exact snapshot в private
   staging, сверить bytes/SHA256 по [remote-access](remote-access.md). Полный SQL
   не читать/печатать. Имя вложения `dump.sql` не меняет содержимое snapshot.
3. Через Notion MCP заново fetch страницу и проверить доступ. Перед её изменением
   прочитать актуальный `notion://docs/enhanced-markdown-spec`. Загрузить бинарный
   файл штатным file-upload flow, сохранить возвращённый `suggested_markdown`
   и вставить его дочерним блоком нового callout В НАЧАЛЕ страницы. Старые записи
   и права страницы сохранить. Markdown с SQL, внешняя ссылка или ZIP не заменяют
   native вложение `dump.sql`; незавершённую загрузку не считать архивом.
4. Повторный fetch должен подтвердить новый callout и native file. Размер/hash
   или обратную загрузку проверять там, где API позволяет; не заявлять byte-check
   Notion, если он не выполнен. Сохранить приватную связь attempt/source/receipt/
   snapshot bytes/SHA256 → Notion page/block/file и результат проверки. Не
   копировать credentials, upload URLs/headers или SQL payload в чат/Git/текст страницы.
5. Подтверждённая запись этого свежего pre-upload snapshot обязательна ДО live
   upload/release switch. Недоступность Notion, отказ/лимит upload или отсутствие
   подтверждённого native file останавливают rollout до изменений. Локальные
   проверенные backup copies сохраняются независимо от Notion.
6. Обычный `deploy.sh --execute` ОБЯЗАТЕЛЬНО делает ещё один новый dump. Между ним
   и build/recreate сейчас нет MCP-паузы: shell scripts сами Notion не вызывают.
   После завершения либо установления состояния неуспешной attempt взять exact
   snapshot из execute result/durable attempt journal и архивировать аналогично,
   если его SHA отличается от уже сохранённого snapshot ЭТОЙ attempt. При одинаковых
   bytes и подтверждённой той же DB/daemon в той же attempt связать второй receipt
   с существующей записью; полного равенства config/env metadata двух receipts не требовать.
   Каждая НОВАЯ attempt получает новую запись даже при прежнем SHA; старый архив
   другой попытки не заменяет свежий dump. Если внутренний dump не завершён успешно,
   его partial/непроверенный файл не публиковать как backup.
7. При неизвестном результате загрузки сначала fetch и выяснить наличие записи,
   не создавать дубликат вслепую. Если rollout уже произошёл, а архив внутреннего
   dump не подтверждён, сообщить фактическое состояние backend и `Notion archive
   pending`, сохранить good copies и завершить архивацию. Полностью закрытым такой
   rollout не объявлять; автоматически повторять deploy/rollback запрещено.

Notion дополняет private snapshot/recovery, не заменяет их или restore drill.
Нельзя считать чтение страницы доказательством успешного upload/restore. Подготовка
этого правила не создаёт историческую запись и не загружает старый dump.
