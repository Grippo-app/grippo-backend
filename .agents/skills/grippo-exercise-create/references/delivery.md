# Пакет, публикация и сохранение

## Discovery цели

Сверяй актуальные
[`ExerciseExampleRequest`](../../../../src/modules/exercise-examples/dto/exercise-example.request.ts),
[`components DTO`](../../../../src/modules/exercise-examples/dto/exercise-components.dto.ts),
[`service`](../../../../src/modules/exercise-examples/exercise-example.service.ts),
[`admin controller`](../../../../src/modules/admin/admin.controller.ts) и
[`SUPPORTED_LANGUAGES`](../../../../src/i18n/i18n.types.ts).
Локальная revision/dirty tree не доказывает deployed API/schema. Сверь цель
с доступными контрактом/сведениями о revision и raw translations, не проверяя
поддержку языков пробной записью. Не запускай AppModule/synchronize.

На дату создания skill локально есть `en`, `ua`, `ru`, `pt-BR`, `pt-PT`;
production мог ещё поддерживать три языка. При несовпадении используй
соответствующий цели checkout/контракт или явно отдели подготовленные
переводы от target payload. Приложенный helper требует совпадения local/target
languages; его отказ не обходи вымышленным snapshot. Несовпадение не является
разрешением деплоить языковой rollout.

Через порученный доступ получи каталог и `GET /muscles`, `GET /equipments`.
Справочники возвращают группы с `muscles` и `equipments` соответственно;
собери элементы этих массивов в плоские списки `{id,name}` без выдуманных ID.
Не используй ID самой группы как ID мышцы/оборудования:

```json
{
  "supportedLanguages": ["en", "ua", "ru", "pt-BR", "pt-PT"],
  "muscles": [{"id": "<real muscle UUID>", "name": "<dictionary name>"}],
  "equipment": [{"id": "<real equipment UUID>", "name": "<dictionary name>"}]
}
```

Это форма `dictionaries.json`, не исполняемый пример: подставь реальные данные.
В manifest сохрани источник/target, дату, revision если известна и checksum.
Без доступа работай с явно предоставленным snapshot, отметив его актуальность.
Перед create повторно проверь уникальность и ссылки в той же целевой среде.

## Локальный показ до отправки

Сначала подготовь и покажи [полное preview](preview-and-approval.md): локальная
картинка, техника, мышцы/проценты, экипировка/components, классификация и все
переводы. Media plan содержит только будущий key/URL. До upload не выдавай
его за доступное изображение и не обозначай локальный пакет как опубликованный.
Можно приложить черновой объект без ещё не подтверждённого imageUrl;
планируемую ссылку покажи отдельно от фактов публикации. Полный нормализованный
payload проверяется **до** upload штатным preview mode ниже. Он включает будущий
точный URL со статусом not published; после CDN readback проверяется неизменность
пакета, впервые формировать payload после согласования не нужно.

До любого S3/API write дождись явного подтверждения показанного пакета и
перечисленных операций. Утверждённый upload может дать заранее показанный
точный URL; одно это не меняет содержание пакета. Любая иная правка требует
обновлённого показа/подтверждения. Missing equipment — отдельное решение,
никакого автоматического создания или подмены refs.

## Медиа URL

Backend и админка хранят только `imageUrl`, upload endpoint отсутствует.
Действующий S3/CDN workflow, bucket/region, naming/format и helper — в
[media-storage](media-storage.md). Используй его в рамках порученной публикации
конкретного asset после подтверждения локального preview. Подготовь финальный
файл, имя/key и target; новый backend
endpoint или storage provider для работы этого AI-инструмента не требуется.
Временный URL imagegen, `file:`, `data:`, localhost и фиктивный CDN не подходят.

Для release используй стабильный HTTPS URL без embedded credentials или
истекающей signed query. Это качество пакета, а не существующий IsUrl validator.
Через разрешённый доступ проверь GET URL, фактические pixels/формат и доступность
без admin Authorization. Не отправляй bearer token каталога на media host.
Проверь отображение в доступном клиенте/preview; неподтверждённый клиент отметь.
Зафиксируй storage key/URL и hash опубликованного файла. После ошибки не удаляй
asset вслепую: сначала установи, не ссылается ли уже на него созданная карточка.
Значение `draft.imageUrl` должно совпадать с проверенным URL из media receipt:
`https://dsikfdo0rac0e.cloudfront.net/example-images/<stem>.webp`. Локальная
проверка URL в helper ниже подтверждает CDN/prefix/naming по media-policy,
но не существование файла, его формат или доступность.

## Два JSON

`draft.json` — форма редактора: `name`/`description` как English strings,
`nameTranslations`/`descriptionTranslations` как maps по target languages,
`weightType`, `category`, `experience`, `forceType`, `imageUrl`,
`exerciseExampleBundles`, `equipmentRefs`, `components`. Для create убери
временный editor `id` только после проверки, что это новая карточка, не
экспорт существующего упражнения.

В `api-payload.json` входят только:

```text
name: [{language, value}], description: [{language, value}],
weightType, category, experience, forceType, imageUrl,
exerciseExampleBundles: [{muscleId, percentage}],
equipmentRefs: [{equipmentId}],
components: {externalWeight, bodyWeight, extraWeight, assistWeight}
```

Никаких `id`, maps переводов, `translationsRevision`, `tutorials`, `rules`,
`evidence`, canon или других служебных полей в POST. Классы/TS типы не
заменяют runtime validation. Не смешивай это с полным PUT существующей карточки.

Подготовь пакет локально, сначала получив offline media plan по media-storage:

```bash
node .agents/skills/grippo-exercise-create/scripts/prepare-exercise.cjs \
  --preview \
  --draft /absolute/path/draft.json \
  --dictionaries /absolute/path/dictionaries.json \
  --media-plan /absolute/path/media-package/media-plan.json \
  --out /absolute/path/new-package-directory
```

Preview mode принимает draft без imageUrl и берёт будущий URL из media plan.
Он проверяет bytes/hash файла, destination/policy, реальный DTO/ValidationPipe,
ссылки по snapshot и дополнительные критерии пакета, без приложения/сети/БД.
Создаёт `preview.json` и `validation.json` в новой папке. В preview находятся
нормализованный editor draft без imageUrl, полный `payloadCandidate` с будущим
URL, media identity и target. `packageSha256` связывает draft, payload, target
и точные bytes/hash/destination картинки; sourcePath не влияет на содержимое
fingerprint, поэтому перенос того же файла допустим. Показывай именно эту
нормализованную версию, а не исходные строки до trimming. Даже `--preview`
не доказывает биомеханику, качество
перевода, происхождение snapshot, актуальность target, доступность URL и pixels.
Успешный validation/hash не является разрешением или доказательством создания.

Без `--preview` остаётся структурный export `admin-import.json`,
`api-payload.json`, `validation.json` для ручного пути после media verification;
он не проверяет публикацию URL. Это не publish command. Поддерживай совпадение
этих файлов с утверждённым preview, не исправляй модель после upload скрыто.

`admin-import.json` — подготовленные поля без identity, не готовая замена
всего текста JSON editor. Для пути через админку нажми New, проверь `isNew`
и возьми временный `id` именно этой пустой формы. Создай `admin-editor.json`:
наложи поля `admin-import.json` на пустую форму, сохрани её исходный `id`,
затем вставь объект в JSON editor и проверь форму до Save. Без этого ID UI
отвергнет вставку; UUID существующей карточки приведёт к другому пути записи.
Не придумывай UUID вместо ID текущей формы. В серверный POST временный ID
не входит: админский mapper удаляет его, а backend выдаёт новый server ID.
Прямой API путь использует только `api-payload.json` и этого адаптера не требует.

Дополнительные требования к новой карточке строже API: все target локали
заполнены один раз; base=en; IDs без дублей; стабильный HTTPS URL. Backend
допускает неполные локали/пустые значения и повторные refs, но не используй
это для «полноценного» результата. Helper также требует точный CDN/prefix,
snake_case и расширение WebP по media-policy, без query/fragment.
`externalWeight.required:false` валиден;
body.required только true; extra/assist требуют body и исключены с external.
Пустые equipment refs допустимы для канона без инвентаря. Backend допускает
все-null components, но новая полная карточка в helper должна иметь body
component для `body_weight`, а external component для `free`/`fixed`.
Body multiplier хранится numeric(4,2): helper отклоняет больше двух десятичных
знаков, не округляет согласованное число молча. Это критерии нового пакета,
не изменение действующего DTO/API или старых упражнений.
Размер сериализованного UTF-8 POST JSON ограничен102400bytes: это текущий
default Nest/Express parser limit. Preflight проверяет его до upload; HTTP helper
повторяет перед POST. Лимит JSON-ответа отдельный,8MiB. При изменении backend
parser сверяй локальную и deployed конфигурацию, не повышай предел инструмента
без проверки цели.

## Один create и подтверждение

Предпочтительный AI-путь — inert по умолчанию helper:

```bash
node .agents/skills/grippo-exercise-create/scripts/publish-exercise.cjs \
  --preview /absolute/path/package/preview.json \
  --dictionaries /absolute/path/dictionaries.json
```

Это только offline preflight/plan без сети и journal. Будущий `--create`
требует `--expected-package-sha256` ровно показанной версии. До него агент
проверяет человеческое подтверждение из чата, закрытый QA/review, свежую полную
проверку дублей и refs/языкового контракта той же цели. Флаг/hash не являются
доказательством разрешения. Target закреплён `https://grippo-app.com`; другую
среду не выбирают через произвольный URL или environment override.

Для прямого API пути доступен
[`exercise-admin-access.cjs`](../scripts/exercise-admin-access.cjs): после разовой
настройки он читает собственную запись macOS Keychain, выполняет обычный login,
проверяет доступ и передаёт свежий token в publisher в памяти того же процесса.
Пользователь не вводит пароль при каждом упражнении. Разовая настройка и границы
хранения — в [access-setup](access-setup.md).
Открытая browser session сама не является программным токеном.

Альтернативный `GRIPPO_ADMIN_TOKEN` читается только из процесса, без .env discovery, аргументов
командной строки, browser credential extraction или вывода токена. Нужен уже
разрешённый admin доступ; секрет в чат/JSON/journal не копировать. Helper до POST
проверяет CDN bytes/hash/Content-Type и читает каталог по target локалям: точное
имя/тот же imageUrl блокируют явный дубль. Это не заменяет проверку канона.
Без server-side idempotency/dedup эта проверка не атомарна с POST. Журнал
обеспечивает один POST для данного package hash в общей истории пользователя;
параллельные разные пакеты/пользователи/компьютеры могут пройти одинаковый preflight.
Для публикации одной карточки нужен один оператор/попытка; не запускай
несколько писателей и не выдавай локальную защиту за серверную уникальность.

До одного POST helper сохраняет durable intent в фиксированной папке пользователя
`~/.grippo-private/exercise-create/publication-journal/` по package hash. Путь
не переопределяется CLI/env; private папки/файлы требуют текущего владельца,
0700/0600 и безопасных родителей без symlink. Смена checkout или папки вывода
не превращает старую попытку в новую. Existing intent/receipt запрещает новый
POST; чтение/сверка продолжаются отдельным `--verify-only --id <server UUID>`.
Для `--verify-only` также укажи preview, dictionaries и expected package hash.
Потерянный финальный receipt не отменяет уже сохранённый intent.
Если авторитетный ID из ответа201 не успел сохраниться, найденная карточка
даже с полностью совпадающими полями не доказывает исход именно этой попытки:
возможны старый дубль/другой writer и ещё выполняющийся первый запрос.
Read-only проверка фиксирует совпадение ресурса отдельно, сохраняя
`outcome_unknown` до установления состояния; новый POST из этого не следует.
Повреждённый необязательный outcome receipt сохраняется как evidence и не
мешает read-only сверке при валидном intent; автоматического удаления нет.

### Миграция старого журнала

Helpers блокируют online publisher и S3 upload с
`LEGACY_JOURNAL_MIGRATION_REQUIRED`, если в текущем checkout остаётся непустой
`tasks/exercise-create/.publication-journal/`. Не стирай его для обхода.
Для переноса останови локальных писателей и собери все такие старые журналы
других используемых checkout. Вне репозитория сохрани приватную recovery copy.
Создай новый фиксированный журнал с 0700; существующий проверь на владельца,
права и отсутствие symlink, не меняя чужие права автоматически.

Перенеси **все** относительные пути и точные bytes: S3 intent/result, папки
package hash, `intent.json`, `outcome.json`, `recovered.json`, каждый
`verification-*.json` и прочие исторические receipts. Новые файлы создавай с
0600 без перезаписи. При совпадении пути сравни размер/SHA-256: одинаковые
bytes уже сохранены; любое отличие останавливает миграцию без удаления или
замены истории. Symlink, неизвестный владелец или небезопасные права также
требуют разбора. Проверь полный список, количество и SHA-256 до/после,
синхронизируй файлы и записи каталогов. Только после доказанного полного
сохранения можно убрать старый журнал из checkout; recovery copy оставь.

Старые абсолютные пути внутри manifest/approval/receipts сохраняй как есть:
это историческое evidence, а не новый пакет для переутверждения. Перенос
истории не разрешает новый put/POST и не требует повторного одобрения уже
опубликованного неизменного пакета. При продолжении используй read-only
reconciliation, сохраняя `outcome_unknown`, если attribution не установлена.

Успех create — только HTTP201 с валидным server UUID; этот факт фиксируется
**до** readback. Timeout/5xx/неожиданный успешный ответ/невалидный ID дают
`outcome_unknown`, без автоматического retry/PUT/delete. Полученный ID с
ошибкой последующего GET остаётся `created_readback_pending`, а не failed create.
Даже определённый отказ не разрешает скрипту самовольно начать другую попытку:
сначала установить состояние и согласовать дальнейшее действие; journal
сохраняется, не удаляется ради обхода блокировки.

Сверка читает graph, raw translations и localized GETs; partial/mismatch
возвращает ненулевой exit и сохраняет созданный ID. Реальный auth/profile,
production persistence и клиентская картинка подтверждаются только фактическим
readback, их нельзя выдать за результат offline fixtures.

Этот этап нужен только когда пользователь поручил сохранение упражнения.
Для запроса собрать полную модель конечный результат — проверенные
`admin-import.json`/`api-payload.json`, источники и опубликованное изображение
с рабочим URL. Не записывай модель в БД только ради server ID.

Для ручного пути до POST проверь актуальный показанный пакет: карточка/все локали, изображение,
точная среда, JSON, закрытые findings и оставшиеся ограничения. Запись должна
входить в явное подтверждение пользователя после локального preview; общее
предварительное поручение его не заменяет. После утверждённого upload и
проверки неизменного планировавшегося URL то же подтверждение может покрывать
уже перечисленный API create. Другой target или изменённый пакет покажи заново.
Держи admin Bearer credential вне JSON/репозитория/логов/командной строки.

`POST /admin/exercise-examples` возвращает 201 `{id}` и атомарно сохраняет
parent, bundles, equipment refs, components и translations. Проверь ответ,
сохрани server ID, target, время и hash отправленного payload в `receipt.json`.
Create не имеет idempotency key или защиты от семантических дублей.

При timeout/потере ответа останови повторы: проверь каталог/найденный ID и
точное совпадение варианта/полей в порученной среде. Нельзя считать timeout
откатом. Если исход установить нельзя, явно оставь `create_outcome_unknown`;
не повторяй автоматически и не делай delete как компенсацию.
Через админку это относится и к ручному повторному Save: UI после network
failure может остаться `isNew`, а его toast/локальная форма не являются
полным подтверждением server graph. Не продолжай через повторное нажатие.

После подтверждённого create:

1. `GET /exercise-examples/:id` с JWT пользователя, имеющего profile:
   сравни `entity` поля, refs, percentages, components и imageUrl с payload.
   Администратор без profile может не пройти этот путь; это отдельная
   незавершённая проверка, не повод менять auth или создать профиль самовольно.
2. `GET /admin/exercise-examples/:id/translations`: сравни raw base и все
   language rows с подготовленными текстами. Public fallback не доказывает
   наличие перевода. Сохрани компактный отчёт сравнения, не bearer trace.
3. Проверь localized GET с `Accept-Language` для target languages и видимость
   изображения в доступном UI. В receipt отметь фактическое покрытие.

Если readback не совпадает, не выполняй скрытый PUT. Это полная замена графа;
для Portuguese rows может требоваться свежий `translationsRevision` и полные
тексты. Исправление выполняется в границах поручения после чтения свежего
состояния по domain/identity skills. Автоматический delete использованного
упражнения запрещён контрактом 409 и не является универсальным rollback.
