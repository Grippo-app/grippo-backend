# Ресурсы из админки

Источник изучен 20 октября 2026: sibling repository `grippo-admin`,
`src/features/exercises/exercisePrompts.js`:
`buildReviewPrompt` (1–59), `buildImagePrompt` (61–107),
`buildRulesPrompt` (109–160). Это builders текста для clipboard, не вызовы AI.
При доступной админке сверяй актуальные builders и consumers; без неё используй
сохранённые ниже требования. Версии репозиториев и target могут различаться.

Связанные исходники админки:

- `src/domain/exercise/ExerciseNormalizer.js`: editor/defaults, import и
  `buildPersistencePayload` (326, exported static method 386); scalar/maps
  преобразуются в массивы языковых значений.
- `src/domain/exercise/ExerciseValidator.js`: правила формы и components.
- `src/shared/constants/index.js`: языки; `src/shared/utils/index.js`:
  ограничения image URL; `src/domain/exercise/DictionaryStore.js`: справочники.
- `src/features/exercises/ExerciseFormView.js`: копирование prompts (1109),
  JSON editor и preview; `index.html`: только URL input для изображения (208).
- `src/infrastructure/http/endpoints.js`: выбранный base URL; на дату чтения
  hardcoded production. Открытая админка не является staging по умолчанию.

## Ревью карточки: что переносится

Оригинал требует JSON формы редактора и короткое пояснение на русском:
scalar `name`/`description`, maps `nameTranslations`/`descriptionTranslations`,
enums, `imageUrl`, `components`, `exerciseExampleBundles`, `equipmentRefs`.
В исходнике maps включают `en`, `ua`, `ru`, `pt-BR`, `pt-PT`.
IDs берутся только из переданных справочников, muscle percentages целые с
суммой 100; повторные ссылки объединяются осмысленно; base English согласован
с `en`. Поле `tutorials` исключено.

Адаптация для нового упражнения:

- Вместо «улучши по общим знаниям» сначала установи канон, роли и evidence
  через [content-pipeline](content-pipeline.md). Редакционное число не является
  измеренной активацией. Дедупликация muscles не разрешает потерять бюджет 100.
- Не пересылай editor JSON напрямую в API; mapping — в [delivery](delivery.md).
  Новый API create не содержит `id`, включая временный editor UUID. Для
  вставки в JSON editor админки, наоборот, нужен UUID текущей новой формы;
  адаптер описан там же. Не смешивай эти два уровня.
- Переводы создаются по фактическому target contract. Пример с пятью языками
  не доказывает их поддержку на сервере.
- Ответ AI проверь как недоверенные данные. «Строгий JSON validator» в роли
  модели не заменяет детерминированную проверку DTO/refs.

## Components: что переносится

Оригинал просит изменить только top-level `components`, сохранив весь
остальной JSON. Четыре nullable ключа: `externalWeight`, `bodyWeight`,
`extraWeight`, `assistWeight`. Body multiplier `0.05..2`; extra/assist только
с body; external исключает остальные каналы. Этот отдельный проход полезен
для review, но при обнаружении конфликта канона нужно вернуть его владельцу,
а не молча подогнать только components.

Поправка: исходный prompt требует `externalWeight.required=true`.
Актуальные backend DTO и admin validator допускают boolean, в том числе false.
Только `bodyWeight.required` обязан быть true. `null` — отсутствие канала,
`required:false` — присутствующий необязательный канал. Не переносить ошибочное
ограничение prompt в новый контракт.

## Изображение: что переносится

Полная рабочая спецификация, палитра и prompt — в
[image-pipeline](image-pipeline.md). Из оригинала сохраняются matte clay/3D,
андрогинный манекен, opaque sRGB, камера/границы кадра и нейтральная студия.
Оригинальный builder задаёт PNG900×900; это историческое требование prompt,
не актуальный формат опубликованных файлов. Проверенная структура CDN/bucket
и профиль нового WebP1024×1024 — в [media-storage](media-storage.md).
Добавляются точная фаза, контакты, геометрия и проверка варианта.

Исправления исходных противоречий:

- «Only these HEX» трактуется как опорная палитра: градиент и мягкое затенение
  дают промежуточные цвета.
- Пара blue `#3366FF` / outfit `#2E333B` имеет contrast около 2.71:1,
  а не требуемые оригиналом 4.5:1. Не обещай выполнение 4.5 и не меняй бренд
  молча. Orange `#FFA726` даёт около 6.54:1; строгий новый порог требует
  выбранного пользователем решения о палитре.
- Размер/формат/цветовой профиль/opaque проверяются на файле по media-policy;
  исходные 900PNG не подменяют проверенные 1024WebP. Prompt сам не гарантирует
  эти свойства.
- Ни админка, ни backend на дату чтения не содержат image upload/hosting
  или автоматической AI inference; для финального URL нужен реальный канал
  публикации. Известное отсутствие этой интеграции не заменять выдуманным API.
