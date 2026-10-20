# Кодстайл и правила небольших изменений

## Наблюдаемое оформление

Файлы обычно kebab-case; classes PascalCase; methods/properties camelCase;
enum members и значения проверяй в конкретном enum. DI tokens/env —
UPPER_SNAKE_CASE. Используются named exports и прямые relative imports.
Единого formatter config нет: во многих feature файлах 4 spaces и
`import {Module}`, в database/naming strategy есть 2 spaces и `{ Module }`.
Обычно single quotes и semicolons; trailing commas неоднородны.

Следуй соседним строкам, не делай whitespace-only churn. «Один class на файл» и
«только named imports» не являются фактом: request DTO файлы содержат nested
classes, `apple-auth.service.ts` использует default import `jsonwebtoken`,
а `trainings.service.ts` — default import `moment`.

## Имена и размещение

| Тип | Обычное место/суффикс |
|---|---|
| Module/controller/service | `src/modules/<feature>/<feature>.{module,controller,service}.ts` |
| Request/response | feature `dto/*.request.ts`, `*.response.ts`; есть исторические имена вроде `equipment-response.ts` |
| Shared nested DTO | feature `dto/*.dto.ts` или в request file |
| Entity | `src/entities/*.entity.ts`, class `*Entity` |
| Enum | `src/lib/*.enum.ts`, class `*Enum` |
| Auth helper | `src/modules/auth/services/*.service.ts` |

Не переименовывай исторические классы/файлы для симметрии вне задачи.

## TypeScript и DTO

[tsconfig.json](../../../../tsconfig.json): CommonJS, ES2021,
decorator metadata, `esModuleInterop`, `skipLibCheck`; strictNullChecks,
noImplicitAny и strictBindCallApply явно false. Это существующая настройка,
не цель для нового кода. Типизируй новые границы, но не превращай feature task
в массовое включение strict mode. В коде встречаются `user: any` и untyped req.

Декораторы Swagger описывают contract; `class-validator` обеспечивает request
validation. `@Expose()` не заменяет validator, `@Type()` не заменяет
`@ValidateNested`, `@IsOptional()` пропускает и undefined, и null. Для обязательных
массивов анализируй также `@IsArray`/`@IsDefined`; для чисел unit/range и
transformer. Query/param validators не выводятся автоматически из TS типа.

`@ApiPropertyOptional` не делает поле optional при validation. Наличие
response class не доказывает, что controller выполняет сериализацию именно в
этот class. Проверяй реальный return, особенно entity relations и numeric строки.

## Controller/service

Controller отвечает за route params/query/body, guards, HTTP status, Swagger,
получение user и locale. В существующих controllers есть validation/date parsing;
не считай все их решения обязательным шаблоном. В service остаются business
checks, repository queries, transaction и mapping ответа.

Для новых business ошибок используй подходящий Nest HttpException.
`JwtStrategy` бросает raw Error с установленным err.name — это наблюдаемая особенность;
не воспроизводи её в других services.

Логирование — Nest `Logger`; не пиши секреты, body sign-in, SQL rows и private
keys. Текущий `LoggingInterceptor` логирует method/path/status/uid/duration:
query/fragment убираются, error status берётся из HttpException либо равен 500;
body и err.message не выводятся. В auth provider warnings сейчас generic, но
другие логирующие места проверяй отдельно: например login failure пишет email.

## Persistence и совместимость

- В обычном service используй injected Repository по существующему token.
- В transaction используй manager.getRepository/manager операции.
- QueryBuilder parameters — для внешних значений; не интерполируй raw input в SQL.
- Проверяй ownership в запросе, а не только предварительной проверкой существования.
- Обрабатывай decimal/numeric соответственно entity transformers; `<number>`
  в raw response не меняет PostgreSQL string в number.
- Проверяй nested order, ties, date boundaries и разные aggregation scopes.
- Не обещай DB constraint по одному DTO validator и не обещай application guard
  по одному FK. Они решают разные задачи.

Оцени совместимость в направлении «старый мобильный клиент → новый backend»:
сохраняй прежние допустимые запросы и декодируемость ответов, включая enum,
различие null/отсутствие поля, defaults, HTTP status, exact auth/error codes и
locale identifiers. Additive change не гарантирует совместимость: новое значение
enum может сломать strict decoder. Ужесточение DTO может отклонить ранее допустимый
запрос. Выбирай совместимый вариант в рамках задачи; breaking change допустим,
если явно входит в её scope, а влияние объяснено.

Проверяй доступных consumers. Исходники mobile/admin здесь не представлены:
явно укажи непроверенные предположения и необходимость consumer impact review,
не выдавай совместимость за подтверждённую и не выдумывай версии клиентов.
Добавление nullable column, изменение enum или unique index
также требует schema/data анализа, даже если компиляция проходит.

## Редактирование комплекта инструкций

Обновляй знание в одном профильном reference и краткий routing при необходимости.
Не копируй одинаковые checklists во все skills. Документируй source + observable
behavior + limitation; рекомендуемое улучшение помечай отдельно. После добавления
source файла обнови source-map и проверь agent kit validator.
