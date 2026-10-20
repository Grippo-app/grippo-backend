# Локальная структурная проверка снимка

`scripts/inspect_snapshot.py` — небольшой Python 3 CLI на стандартной библиотеке.
Он читает только явно переданный локальный JSON-файл и печатает один JSON-отчёт
в stdout. У него нет подключения к PostgreSQL, SSH, Docker, HTTP, `.env`, SQL-дампам
и приложению NestJS; он ничего не исправляет и не создаёт snapshot. Не запускай
приложение или импорт его модулей ради подготовки входа. Доступ к remote и
выгрузка данных требуют отдельно разрешённого operations workflow.

## Запуск и результат

```sh
python3 .agents/skills/grippo-exercise-audit/scripts/inspect_snapshot.py /absolute/path/catalog.json
```

Коды завершения:

- `0`: предусмотренные структурные проверки выполнены без findings. Editorial
  observations при этом допустимы. Это **не заключение о научной точности**.
- `1`: есть структурные findings или нарушения явно обозначенного runtime/API
  инварианта. Это не утверждение, что каждый finding запрещён SQL constraint.
- `2`: вход не подходит для проверки: аргументы, доступ к файлу, размер, JSON,
  корневой объект, обязательная таблица или форма строк.

CLI принимает один positional argument; дополнительных режимов и `--help` нет.
Некорректные аргументы также возвращают JSON с кодом 2. Для чтения результат можно
перенаправить в отдельный разрешённый файл, **никогда не в исходный snapshot**.
Проверка не устанавливает свежесть/полноту выгрузки и не сверяет её с живой БД.

`input_sha256` и `input_bytes` относятся к прочитанным байтам. Отчёт содержит
числа строк и уникальных валидных ID по каждой таблице, summary кодов, diagnostics
и явные `performed`/`not_performed`. Диагностики содержат только фиксированные
коды, известные имена таблиц/полей, row index, валидные UUID и counts. Тексты,
полные строки, неизвестные поля, metadata и пути файла не печатаются. Ошибка
JSON не выводит фрагмент входа. Не передавай дампы и пользовательские таблицы.

## Контракт входа

UTF-8 JSON (BOM допустим), размер не более 32 MiB:

```json
{
  "metadata": {},
  "payload": {
    "exercise_examples": [],
    "exercise_example_bundles": [],
    "exercise_examples_equipments": [],
    "exercise_example_components": [],
    "exercise_example_translations": [],
    "muscles": [],
    "muscle_groups": [],
    "equipments": [],
    "equipment_groups": []
  }
}
```

Все девять таблиц обязательны: массив объектов. Верхние дополнительные ключи,
metadata, дополнительные таблицы и дополнительные поля строк игнорируются и не
выводятся. Сводный отчёт, API response wrapper `{entity, usageCount, lastUsed}`
и нормализованные nested relations этим контрактом **не являются**. Не выдавай
их за полный снимок. Повторённые JSON-ключи, `NaN`/`Infinity` и числовой overflow
вроде `1e999`, который при разборе становится nonfinite, отвергаются как invalid
input (exit 2, `json_nonfinite_number`) во всём документе, включая metadata.

Имена колонок — физические **snake_case**. Источники: текущие
`src/entities/*`, `src/common/snake-naming.strategy.ts`,
`src/database/database.service.ts`, DTO каталога и `src/i18n/i18n.types.ts`.
В каждой строке обязательны `id`, `created_at`, `updated_at`; сверх них:

| Таблица | Обязательные поля |
|---|---|
| exercise_examples | name, description, image_url, category, weight_type, force_type, experience |
| exercise_example_bundles | exercise_example_id, muscle_id, percentage |
| exercise_examples_equipments | exercise_example_id, equipment_id |
| exercise_example_components | exercise_example_id, external_weight_required, body_weight_multiplier, extra_weight_required, assist_weight_required |
| exercise_example_translations | exercise_example_id, language, name, description |
| muscles | name, type, muscle_group_id, recovery, size, sensitivity |
| muscle_groups | name, type |
| equipments | name, type, equipment_group_id |
| equipment_groups | name, type |

Missing field и явный `null` различаются. В частности, missing nullable-колонки —
finding `required_field_missing`: по такой выгрузке нельзя подтвердить состояние
колонки. Пустые девять таблиц не запрещены; отдельное observation предупреждает
о нулевом покрытии упражнений. Ожидаемое число упражнений не зашито в программу.

## Что проверяется

### Структура и связи

- UUID в ID/FK, уникальность ID внутри таблицы, существование FK во всём снимке.
  UUID сравниваются без учёта регистра. Невалидный ID не отражается в output.
- `muscle_group_id`/`equipment_group_id=null` допускаются схемой: observation
  `dictionary_group_unassigned`, а не невалидный UUID. Такая запись может
  отсутствовать в grouped API; назначение группы и проверка выдачи требуют
  отдельного анализа. Непустой невалидный или отсутствующий в снимке FK — finding.
- Повторные пары exercise–muscle, exercise–equipment и exercise–language:
  finding о дублировании связи. В текущей entity уникальность задана для
  exercise–language; применение constraint в живой БД этот CLI не проверяет.
- Ровно одна components-строка для каждого exercise — требование чтения каталога.
  Отличающийся components PK и exercise FK — только observation о service
  convention: SQL unique FK не требует их равенства.
- Наличие непустой строковой формы timestamps. Календарная корректность,
  timezone, порядок created/updated и схема SQL этим не сертифицируются.
- Equipment refs могут отсутствовать у упражнения. Пустой список оборудования
  **валиден** и не превращается в finding или требование добавить инвентарь.

### Проценты

- `percentage` — finite JSON number с математически целым значением в диапазоне
  0..100, исключая boolean. Как в `Number.isInteger` / текущем DTO после
  `JSON.parse`, `100.0`, `37.0` и `63.0` допустимы; numeric string `"100"`,
  `true`, `false` и дробный `100.5` не допускаются. Сумма проверяется только
  после той же проверки каждого элемента, без округления дробных значений.
- Карта каждого упражнения непуста и сумма допустимых строк равна 100.
- `0%` при допустимой сумме — **editorial observation**, а не structural finding:
  текущий DTO разрешает ноль. Это повод проверить полезность записи, а не
  доказательство ошибки или разрешение автоматически удалить её.
- Доли 1–3% не считаются ошибкой, не удаляются и не перенормируются. Полнота
  мышц, роль стабилизаторов, физиологический смысл и точность 53 vs 55 этим
  инструментом не оцениваются. Сумма 100 не подтверждает их правильность.

### Компоненты веса

- Все четыре storage-поля обязательны, но `null` допустим. Boolean-поля
  принимают только `true`/`false`/`null`; `false` означает существующую ветвь,
  поэтому не приравнивается к отсутствующей `null`.
- `body_weight_multiplier`: finite JSON number или PostgreSQL numeric string
  в диапазоне 0.05..2.0, либо `null`. Boolean не число; 0 невалиден.
  Numeric strings используют ASCII decimal notation (знак, точка и exponent
  допустимы, внешние пробелы только ASCII); underscores, Unicode digits,
  посторонние control characters, пустая строка и переполнение в
  `Infinity` при `Number(value)` потребителя не допускаются. Это правило
  применяется также к size/sensitivity; точность/scale SQL не сертифицируются.
- External и body взаимоисключены; extra/assist требуют body; external не
  сочетается с extra/assist. Все четыре `null` допустимы. Body вместе с
  extra и assist одновременно допустим. Масштаб decimal не додумывается.
- `weight_type`, `force_type`, equipment и компоненты не связываются новым
  правилом автоматически. Например, label `free` при body-компоненте не
  становится finding до определения продуктовой семантики этих полей.

### Текст, языки, словари

- Хранимые языки — `en`, `ua`, `ru`, `pt-BR`, `pt-PT`, как в текущем
  SUPPORTED_LANGUAGES; отсутствующий перевод поддерживаемого языка — observation
  с возможным fallback, а не запрещённая БД форма. Дублирование языка — finding.
- Nullable base/translation text и image_url принимают `null` с observation;
  dictionary name — строка. Пустота, внешние пробелы, replacement/control
  characters и ограниченный список placeholders — observations, без печати
  самого текста и без автоматического исправления.
- `image_url` проверяется только как string/null; URL и доступность медиа не
  проверяются. Естественный язык, качество перевода и эквивалентность локалей
  требуют отдельного просмотра специалистами.
- Enum membership — локальный список из исходников. Примеры: category
  compound/isolation; weight_type free/fixed/body_weight; force_type
  push/pull/hinge; experience beginner/intermediate/advanced/pro. Полные enum
  словарей явно перечислены в скрипте; при изменении `src/lib/*enum.ts` сначала
  пересмотри список; при изменении SUPPORTED_LANGUAGES обнови LANGUAGES и
  проверь обе PT локали и отклонение header aliases в storage. Это не
  разрешение добавлять новые enum для аудита.
- Nullable enum принимается с observation. Muscle recovery — nonnegative
  математически целый finite JSON number/null, включая `24.0`, исключая
  boolean/string; size/sensitivity — finite number/numeric string/null. Новые
  границы или нормативы для size/sensitivity не изобретаются.

## Границы заключения

`structural_pass` означает только прохождение перечисленных проверок данного
файла. Нельзя на его основании писать «полный аудит пройден», «все данные
корректны», «проценты научно доказаны», «упражнение безопасно» или «production
проверен». Нет измерений EMG/сил/моментов, проверки вариантов техники и видео,
клинических выводов, оценки сложности, калибровки карт, клиентских потребителей,
исторических объёмов или всех SQL constraints. Нужны отдельные evidence,
coaching, biomechanics, data-contract и independent-review этапы skill.

## Проверка самого инструмента

При изменении скрипта используй временные синтетические JSON в `/tmp`, без
production rows и без новых постоянных specs. Минимальные сценарии: валидный
catalog; ноль при сумме100; доли1–3%; пустое equipment; missing vs null;
percentage `100.0`, сумма `37.0 + 63.0`, недопустимые `100.5`, boolean и numeric
string; сумма99; overflow `1e999` как invalid input; orphan/duplicate FK pair; missing/duplicate
components; false-vs-null dependency; multiplier0 и numeric string0.75;
decimal strings со знаком/exponent, underscores/Unicode/overflow; recovery
`24.0`/null и недопустимые fraction/boolean/string/negative; nullable group FK
как observation, malformed/orphan nonnull group FK как finding;
missing/unsupported/duplicate language; malformed/duplicate-key JSON; nested
row/value; неизвестные поля с контрольным secret-текстом не выходят в stdout.
Сверь SHA256 входа до/после. Проверка на реальном снимке — отдельная строка
coverage; если полного JSON нет, пиши **NOT_RUN**, не читай ради неё SQL-дамп.
