# Архитектура и зависимости

## Содержание

- Bootstrap и request lifecycle.
- Слои и module graph.
- Database wiring и schema lifecycle.
- Интеграции и границы системы.
- Рецепт feature и impact analysis.

## Bootstrap и HTTP lifecycle

[main.ts](../../../../src/main.ts) создаёт `NestExpressApplication` с
`ExpressAdapter`, затем вызывает `app.enableCors()` до регистрации Swagger routes.
Из DI получает `ConfigService`, добавляет
global `ValidationPipe({transform: true, whitelist: true,
forbidNonWhitelisted: true})`, `LoggingInterceptor`, вызывает `setupSwagger`.
Глобальный prefix закомментирован: routes начинаются с `/auth`, `/users` и т. д.,
а не `/api`. `BACKEND_PORT` валидируется как integer 1..65535; bind — `0.0.0.0`. Обработчики SIGINT/SIGTERM
вызывают `app.close()` и process exit. Явного `DataSource.destroy()` в shared
provider нет; не обещай отдельный TypeORM shutdown hook.

[app.module.ts](../../../../src/app.module.ts) загружает `.env` через global
`ConfigModule`. `DatabaseModule` дополнительно вызывает `ConfigModule.forRoot()`.
`I18nModule` — global: middleware назначает `req.locale` для `*` routes.

Цепочка запроса: middleware локали → route guards → interceptor → pipe/DTO →
controller → service → TypeORM/внешний provider → response/interceptor.
Guard rejection происходит до route interceptor: не обещай, что interceptor
логирует абсолютно все 401/403. Exact Nest lifecycle подтверждай при его изменении.

[swagger.ts](../../../../src/swagger.ts) строит схему из decorators, Bearer scheme
называется `access-token`. UI `/docs`, default JSON `/docs-json`, custom JS
`/swagger-custom.js`; production label определяется `NODE_ENV`, а не `APP_ENV`.
Swagger запускается и в production. CORS включён без проекта-specific allowlist.

[HealthController](../../../../src/modules/health/health.controller.ts) зарегистрирован
в AppModule: публичный `GET /health`, не включён в Swagger. Через DATA_SOURCE
проверяет initialize/SELECT 1 с ограниченным ожиданием; возвращает `{status:'ok'}`
либо HTTP 503 без DB error details. Одновременные probes разделяют pending query, чтобы stalled
DB не накапливала запросы. Это readiness DB, не проверка schema/auth/business API.

## Реальные слои

| Каталог | Ответственность | Что не следует приписывать |
|---|---|---|
| `src/modules/<feature>` | Controller, service, module, DTO; auth имеет services/ | Нет отдельных use cases, application/domain layer |
| `src/entities` | 19 TypeORM entities, relations, indexes, numeric transformers | Entity — не автоматически безопасный API DTO |
| `src/database` | DataSource, config, repository factories | Нет migrations/CLI data-source файла |
| `src/common` | JWT/admin guards, strategy, logging, naming strategy | Не контейнер для новой feature business logic |
| `src/i18n` | Locale resolution и проекция переводов каталога | Нет общего словаря текстов UI и ошибок |
| `src/lib` | Enums и bcrypt helper | Не пакет независимого domain engine |

### Feature modules

| Module | Сервис/роль | Зависимости |
|---|---|---|
| `AuthModule` | Email/Google/Apple login, refresh, TokenService/JwtStrategy | PassportModule, async JwtModule, DatabaseModule |
| `UsersModule` | Profile, goals, exclusions, user/admin projections | DatabaseModule |
| `TrainingsModule` | Training aggregate create/read/replace/delete | DatabaseModule, global i18n |
| `ExerciseExampleModule` | Catalog CRUD, translations, components, stats | DatabaseModule, global i18n |
| `ExerciseMetricsModule` | Achievements и recent exercises | DatabaseModule; i18n в этих путях не вызывается |
| `MusclesModule` | Grouped muscles dictionary | DatabaseModule |
| `EquipmentsModule` | Grouped equipment dictionary | DatabaseModule |
| `WeightHistoryModule` | Weight history по profile | DatabaseModule |
| `PushTokensModule` | Хранение/reassignment/delete push tokens | DatabaseModule |
| `AdminModule` | Единый `AdminController`, делегирует feature services | ExerciseExampleModule, UsersModule, TrainingsModule, WeightHistoryModule, PushTokensModule |

Обычные feature modules регистрируют service и `...repositoryProviders`.
UsersModule, TrainingsModule, ExerciseExampleModule, WeightHistoryModule и
PushTokensModule экспортируют свой service; ExerciseMetricsModule, MusclesModule
и EquipmentsModule exports не объявляют. Сам import такого module не делает его
service доступным новому consumer. `DatabaseModule` уже экспортирует repositories;
повторная регистрация — существующий паттерн, а не требование TypeORM.
`AuthModule` дополнительно экспортирует auth services, strategy и repositories.
`AdminModule` собственного service не имеет.

## Database wiring

[database.provider.ts](../../../../src/database/database.provider.ts) создаёт
`DataSource` в async provider `DATA_SOURCE`, вызывает `initialize()` перед
завершением Nest bootstrap. Импорт `AppModule` в integration test запускает эту
цепочку, если providers не переопределены.

[database.service.ts](../../../../src/database/database.service.ts): postgres,
`POSTGRES_HOST/PORT/USERNAME/PASSWORD/DATABASE`; entities glob
`../entities/*.entity.{ts,js}`; `migrations: []`; flags `POSTGRES_SYNC`,
`POSTGRES_LOGS`, `POSTGRES_MIGRATIONS` явно parsed: missing/null/empty → false,
boolean либо trimmed case-insensitive true/false принимаются, иной ввод вызывает
ошибку. DB port валидируется как integer 1..65535. В `NODE_ENV=production`
synchronize/migrationsRun=true запрещены, installExtensions=false;
Compose принудительно выключает все три flags. Generic `<boolean>` сам по себе
conversion не выполняет. `extra.charset` —
имеющийся config, не гарантия реальной PostgreSQL collation.

[repository.providers.ts](../../../../src/database/repository.providers.ts)
определяет 18 tokens; каждый factory вызывает `dataSource.getRepository(entity)`.
`ExerciseExampleComponentsEntity` отдельного token не имеет, обнаруживается
entities glob и используется через transaction manager. Полная таблица entities
и tokens находится в domain-data skill.

[snake-naming.strategy.ts](../../../../src/common/snake-naming.strategy.ts)
преобразует таблицы/колонки/relations/join names в snake_case; explicit custom
names имеют приоритет. Все PK — `@PrimaryGeneratedColumn('uuid')`, при этом
некоторые сервисы заранее задают `v4()` для связи создаваемых записей.
Не убирай ни generated declaration, ни вручную назначаемый id по общему правилу.

Transaction boundary принадлежит service. Работай через переданный manager во
всех read/write шагах, которые должны быть атомарны. Наличие `transaction` в одном
методе не делает весь feature транзакционным. Schema rollout не автоматизирован
миграциями; production deploy schema не меняет. Изменения schema требуют
отдельного data/compatibility/recovery плана; nonproduction synchronize не
разрешает подключаться к существующей DB для теста.

## Интеграции

| Граница | Реализация | Что проверить при изменении |
|---|---|---|
| PostgreSQL | TypeORM + pg | FK/onDelete, numeric conversions, transaction, dump compatibility |
| Google identity | google-auth-library `OAuth2Client.verifyIdToken` | Audience list, verified email, identity linking |
| Apple identity | Node https/crypto и jsonwebtoken, token endpoint/JWKS | Client secret ES256, ID token RS256, audience/issuer/expiry, key cache |
| JWT clients | Nest JwtService + passport-jwt | Separate secrets/TTLs, error codes, Authorization parsing |
| Push token clients | DB registry | Unique token reassignment, DELETE /push-tokens удаляет registry, JWT не отзывает; доставки APNs/FCM нет |
| Mobile/admin consumers | HTTP DTO/enums/Swagger | Соседние consumer repos не исследованы; не утверждай синхронизацию |
| Operations host | Bash wrappers + Python helper + Docker Compose | Source identity, fresh backup, backend-only rollout, secrets/build context |

В исходниках не обнаружены queue workers, Redis, message broker, SMTP/email
verification service, object storage SDK, payment integration или notification
sender. Наличие зависимости в lockfile не доказывает её использование. `morgan`
зависимость установлена, но в bootstrap не подключена.

## Небольшой новый feature

1. Уточни вход/выход и ownership. Если хватает существующего module, расширь его.
2. Добавь request/response DTO с validators и Swagger metadata, затем service
   operation, controller и wiring. Entity/schema/token нужны только при изменении
   persistence, а не для каждого endpoint.
3. Новый module включи в AppModule. Для admin импорта используй exported feature
   service и добавь module import в AdminModule.
4. Проследи поле от JSON → transformation/validation → service → entity/SQL →
   response/translation → Swagger. Обнови ошибки и status codes осознанно.
5. Для пользовательских ресурсов проверь чужой user/profile, отсутствие profile,
   отсутствие id, повторный запрос, пустые/null вложенные данные.
6. Выполни проверки по verification skill и independent review по review skill.
