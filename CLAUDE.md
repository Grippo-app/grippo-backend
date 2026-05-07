# grippo-backend

## Project purpose

REST API для Grippo. Auth (email + Google + Apple), users/profiles,
trainings, exercise examples + metrics, dictionaries (muscles/equipments),
weight history, push tokens, admin endpoints. Single source of truth для
всех данных Grippo. Развёртывается через Docker Compose (NestJS +
PostgreSQL).

---

## Stack

- Node.js **20** (Docker runtime), TypeScript **5.1**.
- NestJS **10** + `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`.
- PostgreSQL **15.5**.
- TypeORM **0.3** c custom `SnakeNamingStrategy`. Schema управляется через `synchronize` (env-driven), миграций нет (`migrations: []`).
- Auth: JWT access + refresh, `passport-jwt`, `bcryptjs`, `google-auth-library` (Google ID tokens), Apple (custom `services/apple-auth.service` через authorization code).
- Validation: `class-validator` + `class-transformer`, глобальный `ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })`.
- Logging: custom `LoggingInterceptor` (метод/url/status/uid/duration, body для POST/PUT) + `morgan`.
- HTTP id: `uuid` v4 (генерируется руками в сервисах через `v4()`, **не** `@PrimaryGeneratedColumn` для контроля транзакций).
- Time: `moment` (валидация date-range параметров).
- Swagger: `setupSwagger(app)`, доступен на `/docs`. JSON-схема — `/docs-json`. Bearer-схема `'access-token'`.
- Deploy: Docker Compose (`db` + `backend`), multi-stage Dockerfile (`node:20` builder → `node:20-slim` runtime, non-root user). Healthcheck — HTTP `/health`.

---

## Bootstrap order (`src/main.ts`)

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule, new ExpressAdapter(), { cors: true },
  );

  // 1. Глобальный ValidationPipe — strict whitelist
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 2. Глобальный LoggingInterceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 3. Swagger setup (читает все @ApiProperty/@ApiOperation)
  setupSwagger(app);

  // 4. Bind на 0.0.0.0:${BACKEND_PORT}
  await app.listen(port, '0.0.0.0');

  // 5. Graceful shutdown на SIGINT/SIGTERM
}
```

`AppModule` (`src/app.module.ts`) собирает:

- **Shared**: `ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true })`, `DatabaseModule`, `I18nModule` (с `@Global()` декоратором → доступен везде без явного import).
- **Features**: `AuthModule`, `UsersModule`, `TrainingsModule`, `ExerciseExampleModule`, `MusclesModule`, `WeightHistoryModule`, `ExerciseMetricsModule`, `EquipmentsModule`, `AdminModule`, `PushTokensModule`.

---

## Module layout

### Структура feature-модуля

`src/modules/<feature>/`:

```
<feature>.controller.ts   // HTTP handlers + Swagger декораторы + @UseGuards(JwtAuthGuard)
<feature>.service.ts      // Бизнес-логика + работа с TypeORM repositories
<feature>.module.ts       // @Module — imports DatabaseModule, providers includes ...repositoryProviders
dto/
  <name>.request.ts       // Input DTO + class-validator decorators
  <name>.response.ts      // Output DTO + @ApiProperty
  <name>.dto.ts           // Опциональные shared DTO внутри feature
services/                 // (опционально) extracted helpers — TokenService, GoogleAuthService, AppleAuthService
```

Каждый feature `*.module.ts`:

```typescript
@Module({
  imports: [DatabaseModule],
  providers: [TrainingsService, ...repositoryProviders],
  controllers: [TrainingsController],
  exports: [TrainingsService],
})
export class TrainingsModule {}
```

Сервисы экспортируются → `AdminModule` импортирует `TrainingsModule`/`UsersModule`/etc и переиспользует их сервисы внутри `AdminController`.

### Shared layout

- `src/main.ts` — bootstrap. См. секцию выше.
- `src/app.module.ts` — единственный root module.
- `src/swagger.ts` — `DocumentBuilder` с Bearer схемой `'access-token'`, кастомный `swagger-custom.js` для добавления "Swagger JSON" линка в topbar.
- `src/entities/*.entity.ts` — все TypeORM entities **плоско**, без подкаталогов. Файл — kebab-case (`user-profiles.entity.ts`), класс — `<Name>Entity`, `@Entity({ name: 'snake_case_table' })`.
- `src/common/`:
  - `jwt.strategy.ts` — `JwtStrategy extends PassportStrategy(Strategy)`. Достаёт user по `payload.id` через `USERS_REPOSITORY`. Бросает обычные `Error('TokenExpiredError')` / `Error('JsonWebTokenError')` — не NestJS exceptions; их перехватывает `JwtAuthGuard.handleRequest`.
  - `jwt-auth.guard.ts` — `JwtAuthGuard extends AuthGuard('jwt')`. Кастомный `handleRequest` читает `info.name` и кидает `UnauthorizedException('ACCESS_TOKEN_EXPIRED' | 'ACCESS_TOKEN_INVALID' | 'UNAUTHORIZED')` + ставит `WWW-Authenticate` header. **Так клиент (mobile `TokenProvider`) различает причины 401**.
  - `admin.guard.ts` — `AdminOnlyGuard implements CanActivate`. Читает `request.user.role`, кидает `ForbiddenException` если не `UserRoleEnum.ADMIN`. Используется только в паре с `JwtAuthGuard`: `@UseGuards(JwtAuthGuard, AdminOnlyGuard)`.
  - `logging.interceptor.ts` — `LoggingInterceptor implements NestInterceptor`. Логирует `${method} ${url} ${status} uid=... body=... - ${duration}ms` для POST/PUT, ошибки — `${method} ${url} ❌ ${err.message}`.
  - `snake-naming.strategy.ts` — TypeORM `NamingStrategyInterface`. Конвертит camelCase property → snake_case column.
- `src/lib/`:
  - `*.enum.ts` — domain-словари (`UserRoleEnum`, `ExperienceEnum`, `GoalPrimaryGoalEnum`, `GoalSecondaryGoalEnum`, `GoalPersonalizationKeyEnum`, `MuscleEnum`, `MuscleGroupEnum`, `EquipmentEnum`, `EquipmentGroupEnum`, `WeightTypeEnum`, `ForceTypeEnum`, `ExerciseCategoryEnum`, `MuscleLoadEnum`). Имя — `<Name>Enum`, значения — `snake_case` строки. **Эти enum'ы дублируются в mobile (domain) и admin намеренно. Любое изменение — breaking для всех потребителей.**
  - `hash.ts` — `Hash.make(plain)` / `Hash.compare(plain, hash)` (bcryptjs).
- `src/database/`:
  - `database.module.ts` — `@Module({ imports: [ConfigModule.forRoot()], providers: [...dataSourceProviders, ...repositoryProviders, DatabaseService], exports: [...dataSourceProviders, ...repositoryProviders] })`.
  - `database.service.ts` — `typeOrmConfig()` строит `DataSourceOptions`. `entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')]`, `migrations: []`, `synchronize: env(POSTGRES_SYNC)`, `namingStrategy: new SnakeNamingStrategy()`. Подцепляет хост/порт/credentials из `ConfigService`.
  - `database.provider.ts` — `dataSourceProviders` массив с одним provider'ом `'DATA_SOURCE'`, `useFactory: async (databaseService) => { const ds = new DataSource(databaseService.typeOrmConfig()); if (!ds.isInitialized) await ds.initialize(); return ds; }`.
  - `repository.providers.ts` — `repositoryProviders` массив. Один helper `createRepositoryProvider(token, entity)` создаёт `{ provide: token, useFactory: (ds) => ds.getRepository(entity), inject: ['DATA_SOURCE'] }`. Токены — `<NAME>_REPOSITORY` UPPERCASE (`'USERS_REPOSITORY'`, `'TRAININGS_REPOSITORY'`, ...). **Каждая entity, к которой нужен `Repository`, должна быть зарегистрирована тут.**
- `src/i18n/`:
  - `i18n.module.ts` — `@Global() @Module(...)`. Регистрирует `LanguageMiddleware` через `MiddlewareConsumer.apply(LanguageMiddleware).forRoutes('*')`.
  - `language.middleware.ts` — читает `req.headers['accept-language']`, нормализует через `ExerciseExampleI18nService.resolveLanguage(...)`, кладёт в `req.locale: SupportedLanguage`.
  - `i18n.types.ts` — `SUPPORTED_LANGUAGES = ['en', 'ua', 'ru'] as const`, `type SupportedLanguage`, `DEFAULT_LANGUAGE = 'en'`.
  - `locale.helper.ts` — `tryNormalizeLocale(value)` через `Intl.Locale.maximize()`.
  - `express.d.ts` — declaration merge: `interface Request { locale?: SupportedLanguage }`.
  - `exercise-example-i18n.service.ts` — `translateExample(entity, lang)` / `translateExamples(...)` / `translateExercisesCollection(...)` — выбирает translation по lang, fallback на DEFAULT_LANGUAGE, мутирует `entity.name`/`entity.description` и удаляет `entity.translations` (контракт API — без массива переводов в response).

---

## Auth flow (end-to-end)

### Endpoints (`AuthController` — `/auth/*`)

- `POST /auth/login` — email + password.
- `POST /auth/register` — email + password (если уже есть Google/Apple-юзер — добавляет password).
- `POST /auth/google` — Google ID token.
- `POST /auth/apple` — Apple authorization code (внутри: `exchangeCodeForIdToken` → `verifyIdToken`).
- `POST /auth/refresh` — `{ refreshToken }` → новый access+refresh.

Ответ всех — `LoginResponse { id, accessToken, refreshToken }`.

### Token issuance — `TokenService.createTokens(userId)`

- Access: `JWT_SECRET_KEY`, `JWT_EXPIRATION_TIME`.
- Refresh: `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION_TIME` (**`JWT_REFRESH_SECRET` отсутствует в README env-секции — это пропуск в документации, не в коде**).
- Payload — `{ id: userId }`. Никаких ролей/email в токене (роль читается из БД при каждом запросе через `JwtStrategy.validate`).

### Verification — `JwtStrategy`

- `secretOrKey: JWT_SECRET_KEY`, `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`.
- `validate(payload)`:
  1. Если `payload.exp * 1000 < Date.now()` — `throw new Error('TokenExpiredError')` (raw, не `UnauthorizedException`).
  2. `usersRepository.findOne({ where: { id: payload.id }, select: ['id', 'email', 'role'] })`. Если null — `throw new Error('JsonWebTokenError')`.
  3. Возвращает `user` → попадает в `request.user`.

### `JwtAuthGuard.handleRequest`

Перехватывает passport-результат и **переводит сырые ошибки в специфичные 401-коды** + ставит `WWW-Authenticate`:

| `info.name` | Response | Header |
|---|---|---|
| `'TokenExpiredError'` | `401 ACCESS_TOKEN_EXPIRED` | `Bearer error="invalid_token", error_description="The access token expired"` |
| `'JsonWebTokenError'` | `401 ACCESS_TOKEN_INVALID` | `Bearer error="invalid_token", error_description="The access token is invalid"` |
| иначе | `401 UNAUTHORIZED` | `Bearer error="unauthorized", error_description="Authorization required"` |

Mobile `TokenProvider` ориентируется на статус 401 + `WWW-Authenticate`, чтобы решить refresh-нуть или разлогинить.

### `AdminOnlyGuard`

Только в комбинации `@UseGuards(JwtAuthGuard, AdminOnlyGuard)`. Бросает `ForbiddenException('Only admin can access this route')` если `user.role !== UserRoleEnum.ADMIN`.

### Refresh contract

`AuthService.refresh(refreshToken)`:

1. `jwtService.verifyAsync<{ id: string }>(refreshToken, { secret: JWT_REFRESH_SECRET })`.
2. `usersRepository.existsBy({ id: payload.id })` — проверка что юзер не удалён.
3. `tokenService.createTokens(payload.id)` — новая пара.
4. На любую ошибку — `UnauthorizedException('Invalid or expired refresh token')`.

### Google / Apple flow

`AuthService.loginWithGoogle / loginWithApple`:

1. Verify ID token (Apple — сначала exchange code→id token).
2. Lookup user по `googleId` / `appleId`.
3. Fallback lookup по `email` (если был email-юзер — линкуем учётку).
4. Если нет — создаём с `role: UserRoleEnum.DEFAULT`, `password: null`.
5. Если нашли по email но без `googleId/appleId` — обновляем только эти поля.
6. Логи: `New user registered via Google/Apple: ${user.id}` или `User logged in via Google/Apple: ${user.id}`.

---

## Trainings (полный цикл feature)

`TrainingsController` (`/trainings`, `@UseGuards(JwtAuthGuard)`, tag `trainings`):

- `GET /trainings?start=&end=` → `getTrainings(req.user, start, end, req.locale)`.
- `GET /trainings/:id` → `getTrainingById(...)`.
- `POST /trainings` → `createTraining(...)`.
- `PUT /trainings/:id` → `updateTraining(...)`.
- `DELETE /trainings/:id` → `deleteTraining(...)`.

`TrainingsService` нюансы:

- Все методы начинают с `this.requireProfile(user)` — `BadRequestException` если нет профиля. `getTrainingsByUserId(userId, ...)` (для `AdminController`) **возвращает `[]` вместо exception** если профиль не создан.
- Date-range запросы валидируются `moment(start).isValid()` → `BadRequestException('Wrong date format')` на 400.
- `createQueryBuilder('trainings')` с явной цепочкой `leftJoinAndSelect`:
  - `trainings.exercises` → `exercises.exerciseExample` → `exerciseExample.componentsEntity`, `exerciseExample.translations`, `exercises.iterations`.
  - `orderBy + addOrderBy` по `created_at` ASC, далее `order_index` ASC, `created_at` ASC.
- После SQL: ручная sort в JS по `orderIndex` и `createdAt` (как защита). Затем по `training.exercises` пробегаемся:
  1. `this.exerciseExampleI18nService.translateExercisesCollection(training.exercises, language)` — выбирает translation, мутирует `name`/`description`, удаляет `translations`.
  2. `this.attachComponentsToExerciseExample(exercise.exerciseExample)` — превращает `componentsEntity` в публичный `components: ExerciseComponentsDto` (mutating add + delete `componentsEntity`).
- `createTraining` / `updateTraining` оборачиваются в `this.trainingsRepository.manager.transaction(async (manager) => { ... })`. Внутри:
  - `manager.create(<Entity>, { ...rest, id: v4() })` для каждой entity (id явно через uuid).
  - `update`: сначала `manager.delete(ExercisesEntity, { trainingId })` (cascade удаляет iterations), затем заново вставляем.
  - Каждый `exerciseExampleId` валидируется через `exerciseExamplesRepository.findOneBy(...)` → `BadRequestException('Invalid exerciseExampleId: ...')` на dangling reference.
- DELETE проверяет `findOne({ where: { id, profileId: profile.id } })` → `NotFoundException(\`Training with id ${id} not found or access denied\`)`.

### DTO patterns

`TrainingsRequest` (POST/PUT body):

```typescript
export class TrainingsRequest {
  @ApiProperty({ type: 'number', example: 25, description: 'Duration in minutes' })
  @IsInt()
  duration: number;

  @ApiProperty({ type: 'number', example: 20000.5, description: 'Total volume in kg (1 decimal)' })
  @IsNumber({ maxDecimalPlaces: 1 })
  volume: number;

  @ApiProperty({ type: [TrainingExerciseRequest] })
  @ValidateNested({ each: true })
  @Type(() => TrainingExerciseRequest)
  exercises: TrainingExerciseRequest[];
}
```

`TrainingCreateResponse` — минимальный output:

```typescript
export class TrainingCreateResponse {
  @ApiProperty({ type: 'string', example: '...', description: 'Training ID' })
  @IsUUID()
  id: string;
}
```

GET-эндпоинты возвращают `TrainingsEntity` напрямую (как тип в Swagger через `@ApiOkResponse({ type: [TrainingsEntity] })` + `@ApiExtraModels(...)`). Это **намеренный** компромисс — entity с `transformer`-ами на decimals и без `select: false`-полей выступает как response shape. Если у entity появляются sensitive поля — обязательно через `select: false` (как `password` в `UsersEntity`).

### Entities (типичный паттерн)

```typescript
@Entity({ name: 'trainings' })
export class TrainingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 1, nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) }})
  volume: number | null;

  @Column({ name: 'profile_id', type: 'uuid', nullable: true })
  profileId: string | null;

  @Index()
  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ExercisesEntity, (e) => e.training, { cascade: ['remove'] })
  exercises: ExercisesEntity[];

  @ManyToOne(() => UserProfilesEntity, (p) => p.trainings,
    { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'profile_id' })
  profile: UserProfilesEntity;
}
```

Conventions:

- `@PrimaryGeneratedColumn('uuid')` для всех primary keys (но в коде `id` обычно генерим руками через `v4()` в service для контроля транзакций).
- `decimal` колонки — `transformer` для приведения PostgreSQL-string к JS number.
- `timestamp without time zone` для `createdAt`/`updatedAt` (UTC).
- FK `@ManyToOne` всегда с `onDelete` явно (`'CASCADE'` для child→parent зависимостей, `'SET NULL'` где child должен пережить parent).
- `cascade: ['remove']` на `@OneToMany` для авто-удаления детей.
- `orphanedRowAction: 'delete'` где это уместно.
- `@JoinColumn({ name: 'snake_case' })` — явно.
- `@Index()` на FK поля и на поля по которым часто фильтруем.

---

## Validation reference (class-validator)

Все DTO-поля **обязательно** аннотированы валидаторами. Глобальный
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
означает:

- `whitelist` — поля без декораторов **отбрасываются**.
- `forbidNonWhitelisted` — лишнее поле в request body → **400**.
- `transform` — `class-transformer` приводит примитивы (`@Type(() => Number)`).

Используемые декораторы (берём только из этого списка, новые добавлять с
обсуждением):

| Декоратор | Использование |
|---|---|
| `@IsString()` | Строка. |
| `@IsInt()` | Целое (без decimals). |
| `@IsNumber({ maxDecimalPlaces: 1 })` | Число с ограничением точности. |
| `@IsUUID()` / `@IsUUID('all', { each: true })` | UUID для одного / массива. |
| `@IsEmail()` | Email. |
| `@IsEnum(<Enum>)` | Значение из enum. |
| `@Length(min, max)` | Длина строки. |
| `@IsOptional()` | Поле может отсутствовать. Сочетается с `nullable` в `@ApiProperty`. |
| `@ValidateNested({ each: true })` + `@Type(() => Nested)` | Вложенные DTO. **Без `@Type` валидатор не сработает на nested.** |
| `@Type(() => String)` | Принудительное преобразование (для массива строк). |
| `@Expose()` | `class-transformer` — сохранить поле после `plainToInstance`. |

Pattern для optional nullable числа:

```typescript
@ApiProperty({ type: 'number', example: 20, nullable: true, required: false })
@IsNumber({ maxDecimalPlaces: 1 })
@IsOptional()
extraWeight?: number | null;
```

Pattern для nested массива:

```typescript
@ApiProperty({ type: [TrainingExerciseRequest] })
@ValidateNested({ each: true })
@Type(() => TrainingExerciseRequest)
exercises: TrainingExerciseRequest[];
```

Pattern для UUID-массива с optional:

```typescript
@ApiProperty({ example: ['...'], type: 'array', required: false })
@IsUUID('all', { each: true })
@IsOptional()
@Type(() => String)
@Expose()
excludeMuscleIds?: string[];
```

---

## Admin endpoints

`AdminModule` — единственный `AdminController` под все админские endpoint'ы:

```typescript
@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminController {
  constructor(
    private readonly exerciseExamplesService: ExerciseExampleService,
    private readonly usersService: UsersService,
    private readonly trainingsService: TrainingsService,
    private readonly weightHistoryService: WeightHistoryService,
    private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
  ) {}
}
```

Импортирует другие feature-модули (`ExerciseExampleModule`, `UsersModule`, `TrainingsModule`, `WeightHistoryModule`) и переиспользует их сервисы. **Не дробится** — намеренно один controller под весь `/admin/*`.

Группы маршрутов внутри `AdminController`:

- `POST/PUT/DELETE /admin/exercise-examples` — CRUD exercise examples.
- `POST /admin/users/make-admin`, `PUT /admin/users/:id/role`, `DELETE /admin/users/:id` — user management.
- `GET /admin/users/:id/trainings?start=&end=` — trainings конкретного user'а.
- `GET /admin/users/:id/weight-history` — веса.
- `PUT /admin/users/:id/goal`, `GET /admin/users/:id/goal` — цели.

Pattern для admin-роутов:

- `@Param('id', new ParseUUIDPipe())` для UUID-валидации path-параметров.
- `@Query('id', new ParseUUIDPipe())` для PUT/DELETE через query.
- `@HttpCode(HttpStatus.NO_CONTENT)` для destructive операций без response body.
- Свои error responses через `@ApiNoContentResponse`, `@ApiNotFoundResponse`, `@ApiConflictResponse`, `@ApiBadRequestResponse`, `@ApiUnauthorizedResponse`.

---

## Push tokens

Отдельный `PushTokensModule` с одной таблицей. Pattern upsert:

```typescript
async upsertToken(userId: string, token: string): Promise<void> {
  await this.pushTokensRepository.createQueryBuilder()
    .insert().into(PushTokensEntity)
    .values({ user: { id: userId }, token })
    .orUpdate(['user_id'], ['token'])
    .execute();
}
```

— upsert через `orUpdate(['<conflict-key>'], ['<update-key>'])`, а не два запроса.

---

## i18n details

`ExerciseExampleI18nService.translateExample(entity, language)`:

1. `translations = entity.translations ?? []`.
2. Ищем `directTranslation = translations.find(t => t.language === language)`.
3. Fallback `defaultTranslation = translations.find(t => t.language === DEFAULT_LANGUAGE)`.
4. `selected = directTranslation ?? defaultTranslation ?? null`.
5. Если есть — мутируем `entity.name`/`entity.description` (с fallback на оригинальные).
6. `delete (entity as any).translations` — массив переводов **никогда не уходит в response**.

`translateExercisesCollection(exercises, lang)` делает то же для каждого `exercise.exerciseExample`.

`resolveLanguage(header)`:

- Парсит `Accept-Language` через `tryNormalizeLocale` (использует `Intl.Locale.maximize()`).
- Возвращает первый язык из header'а, который попал в `SUPPORTED_LANGUAGES`. Иначе `DEFAULT_LANGUAGE = 'en'`.

В контроллерах:

```typescript
const language = req.locale ?? this.exerciseExampleI18nService.resolveLanguage();
return this.trainingsService.getTrainings(req.user, start, end, language);
```

`req.locale` всегда есть благодаря `LanguageMiddleware` глобально, но fallback на сервис — defensive.

---

## Code style and naming

### Файлы и нейминг

- Файлы — kebab-case (`auth.service.ts`, `user-profiles.entity.ts`, `create-user-profile.request.ts`).
- Классы — PascalCase, методы/поля — camelCase, env-vars — `UPPER_SNAKE_CASE`, repo-токены — `'<NAME>_REPOSITORY'` (UPPER_SNAKE_CASE строкой).
- Один класс на файл, **без `export default`**.
- Imports — single `{ ... }`, без default, без барель-файлов.
- Suffix-конвенция:

| Тип | Файл | Класс |
|---|---|---|
| Module | `<feature>.module.ts` | `<Name>Module` |
| Service | `<feature>.service.ts` | `<Name>Service` |
| Controller | `<feature>.controller.ts` | `<Name>Controller` |
| DTO request | `dto/<name>.request.ts` | `<Name>Request` |
| DTO response | `dto/<name>.response.ts` | `<Name>Response` |
| Sub-DTO | `dto/<name>.dto.ts` | `<Specific><Parent>Dto` |
| Entity | `<name>.entity.ts` | `<Name>Entity` |
| Enum | `lib/<name>.enum.ts` | `<Name>Enum` |
| Strategy | `common/<name>.strategy.ts` | `<Name>Strategy` |
| Guard | `common/<name>.guard.ts` | `<Name>Guard` (исключение: `AdminOnlyGuard`) |
| Interceptor | `common/<name>.interceptor.ts` | `<Name>Interceptor` |
| Middleware | `i18n/<name>.middleware.ts` | `<Name>Middleware` |

### NestJS conventions

- Глобальный `ValidationPipe` с `forbidNonWhitelisted: true` — **любое лишнее поле в request → 400**. Поэтому DTO не содержат `extends`-обёрток с лишними полями.
- Каждый endpoint:
  - `@HttpCode(HttpStatus.OK | CREATED | NO_CONTENT)` — явно (Nest по умолчанию POST → 201, остальные → 200).
  - `@ApiOperation({ summary: '...' })` — для Swagger.
  - `@ApiResponse({ status, description, type })` — на каждый ожидаемый исход.
  - `@ApiBearerAuth('access-token')` на controller'ах с `@UseGuards(JwtAuthGuard)` (не на каждом методе).
  - `@ApiTags('<feature>')` на controller'е.
  - `@ApiExtraModels(<Entity>, <Dto>, ...)` для типов, на которые ссылаются `type: [<Entity>]` без явного `@ApiProperty(... type: () => Entity)`.
- Errors — **только NestJS HttpExceptions** (`UnauthorizedException`, `BadRequestException`, `ForbiddenException`, `NotFoundException`, `ConflictException`). Не кидать `new Error('...')` (исключение — `JwtStrategy.validate`, где raw `Error` нужен для `JwtAuthGuard.handleRequest`).
- Сервисы держат `private readonly logger = new Logger(<Service>.name)`. Логируют:
  - `this.logger.log(...)` — info (`User logged in: ${user.id}`).
  - `this.logger.warn(...)` — recoverable (`Login failed for ${dto.email}`).
  - `this.logger.error(...)` — exceptions.
- DI repositories — `@Inject('<NAME>_REPOSITORY') private readonly <name>Repository: Repository<<Name>Entity>`. **Никаких `@InjectRepository()` от `@nestjs/typeorm`** — у нас свой `repository.providers.ts`.
- Нет `@nestjs/typeorm` модуля, нет `forFeature([...])`. Только наш `DatabaseModule + repositoryProviders`.
- `@Req()` / `@Res({ passthrough: true })` — типизированные. `@Req() req: Request` (Express). `req.user.id` доступно после `JwtAuthGuard`.

### TypeScript

- `tsconfig.json` — `"strict": true`. Тем не менее, `req: any`/`user: any` встречается там, где `Request` не доопределён (admin DTO, controllers). При новой сигнатуре — типизировать.
- `class-validator` декораторы дополняются `class-transformer` (`@Type(() => X)` для nested, `@Expose()` для preservation после plain-to-class).
- Date-range params — strings ISO, валидация `moment(value).isValid()` или регексом, никогда не `new Date(...)` без проверки.

### Service patterns

- **Транзакции**: `await this.<entity>Repository.manager.transaction(async (manager) => { ... })`. Внутри получать репы через `manager.getRepository(<Entity>)` — **не использовать инжектированные репы** (они вне транзакции).
- **Range queries**: `createQueryBuilder` с `.where(...).andWhere(...)`, FK joins через `leftJoinAndSelect`, sort через `.orderBy(...).addOrderBy(...)`. `.getMany()` / `.getOne()` / `.getRawMany<Shape>()` для агрегатов.
- **Sort после SQL**: для гнездованных коллекций (`exercise.iterations`) дополнительно сортируем в JS — TypeORM не гарантирует порядок при relations.
- **Authorization**: каждый user-scoped запрос начинается с `requireProfile(user)` (или `usersRepository.findOne({ where: { id: user.id } })`). Доступ проверяется через `where: { id, profileId: profile.id }`. На отсутствие — `NotFoundException(\`<Entity> with id ${id} not found or access denied\`)`.
- **Aggregations** (`getRawMany`): группировка через `.groupBy(...)`, `Number(row.field) || 0` для приведения, `Map<id, value>` для O(1) lookup при последующей обработке.
- **Conflict handling**: `findOneBy` → `ConflictException(...)` или `BadRequestException(...)` если значение уже занято.

---

## Cookbook (пошаговые рецепты)

### 1. Добавить новый feature module

Пример: `src/modules/notifications/`.

1. Создать структуру:
   ```
   src/modules/notifications/
     notifications.controller.ts
     notifications.service.ts
     notifications.module.ts
     dto/
       notification.response.ts
       create-notification.request.ts
   ```

2. Если новая entity — добавить `src/entities/notifications.entity.ts` + зарегистрировать в `repository.providers.ts`:
   ```typescript
   createRepositoryProvider('NOTIFICATIONS_REPOSITORY', NotificationsEntity),
   ```

3. `notifications.module.ts`:
   ```typescript
   @Module({
     imports: [DatabaseModule],
     providers: [NotificationsService, ...repositoryProviders],
     controllers: [NotificationsController],
     exports: [NotificationsService],
   })
   export class NotificationsModule {}
   ```

4. `notifications.service.ts`:
   ```typescript
   @Injectable()
   export class NotificationsService {
     private readonly logger = new Logger(NotificationsService.name);
     constructor(
       @Inject('NOTIFICATIONS_REPOSITORY')
       private readonly notificationsRepository: Repository<NotificationsEntity>,
     ) {}
   }
   ```

5. `notifications.controller.ts`:
   ```typescript
   @ApiTags('notifications')
   @ApiBearerAuth('access-token')
   @UseGuards(JwtAuthGuard)
   @Controller('notifications')
   export class NotificationsController {
     constructor(private readonly service: NotificationsService) {}
   }
   ```

6. Добавить `NotificationsModule` в `AppModule.imports`.

### 2. Добавить новый endpoint в существующем controller

Пример: `POST /trainings/:id/duplicate`.

1. Метод в service:
   ```typescript
   async duplicateTraining(id: string, user): Promise<TrainingCreateResponse> {
     const profile = await this.requireProfile(user);
     // ... transactional copy
     return { id: newId };
   }
   ```

2. Метод в controller:
   ```typescript
   @Post(':id/duplicate')
   @HttpCode(HttpStatus.CREATED)
   @ApiOperation({ summary: 'Duplicate a training' })
   @ApiParam({ name: 'id', description: 'Training ID', type: String })
   @ApiResponse({ status: 201, description: 'Training duplicated', type: TrainingCreateResponse })
   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Training not found' })
   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
   async duplicateTraining(
     @Req() req,
     @Param('id', new ParseUUIDPipe()) id: string,
   ): Promise<TrainingCreateResponse> {
     return this.trainingsService.duplicateTraining(id, req.user);
   }
   ```

3. Если меняется shape response — синхронизировать с **mobile** (`grippo-mobile/data-services/backend/dto/...`) и **admin** (`grippo-admin/src/infrastructure/http/endpoints.js`) **руками**.

### 3. Добавить новую entity (с FK + indices + decimals)

```typescript
@Entity({ name: 'notifications' })
export class NotificationsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({
    type: 'decimal', precision: 10, scale: 1, nullable: true,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  score: number | null;

  @Index()
  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UsersEntity, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'user_id' })
  user: UsersEntity;
}
```

Регистрация в `repository.providers.ts` обязательна — иначе `@Inject('NOTIFICATIONS_REPOSITORY')` упадёт в runtime.

**Внимание**: `synchronize: true` при старте применит изменения к проду. Любая `non-nullable` колонка без default к существующей таблице **сломает деплой**. Новое поле — либо nullable, либо с DB-уровневым default.

### 4. Добавить новый admin endpoint

В `AdminController` (всё в одном файле):

```typescript
@Get('users/:id/notifications')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Get notifications for user (admin only)' })
@ApiParam({ name: 'id', description: 'User ID (UUID)', type: String })
@ApiOkResponse({ description: 'List of notifications', type: [NotificationsEntity] })
@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
async getUserNotifications(
  @Param('id', new ParseUUIDPipe()) userId: string,
): Promise<NotificationsEntity[]> {
  return this.notificationsService.getByUserId(userId);
}
```

Если нужен `NotificationsService` — добавить `NotificationsModule` в `AdminModule.imports` и `notificationsService` в constructor `AdminController`.

### 5. Добавить новую DTO с валидацией

Request:

```typescript
export class CreateNotificationRequest {
  @ApiProperty({ type: 'string', example: 'Workout reminder' })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({ type: 'string', example: 'Time for chest day', nullable: true, required: false })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ type: 'number', example: 75.5, nullable: true, required: false })
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsOptional()
  score?: number | null;

  @ApiProperty({ type: [String], example: ['uuid1'], required: false })
  @IsUUID('all', { each: true })
  @IsOptional()
  @Type(() => String)
  recipientIds?: string[];
}
```

Response:

```typescript
export class NotificationResponse {
  @ApiProperty({ example: '...' })
  id: string;

  @ApiProperty({ example: 'Workout reminder' })
  title: string;

  @ApiProperty({ example: 'Time for chest day', nullable: true })
  body: string | null;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;
}
```

### 6. Добавить новый enum

1. `src/lib/notification-type.enum.ts`:
   ```typescript
   export enum NotificationTypeEnum {
     REMINDER = 'reminder',
     ACHIEVEMENT = 'achievement',
     SYSTEM = 'system',
   }
   ```
2. Использование в entity: `@Column({ type: 'enum', enum: NotificationTypeEnum }) type: NotificationTypeEnum;`.
3. Использование в DTO: `@IsEnum(NotificationTypeEnum) @ApiProperty({ enum: NotificationTypeEnum, example: NotificationTypeEnum.REMINDER }) type: NotificationTypeEnum;`.
4. **СИНХРОНИЗИРОВАТЬ С MOBILE И ADMIN РУКАМИ.** Описать в PR description: «added enum X, mobile/admin потребители: Y, Z».

### 7. Сложный transactional service-метод

Шаблон:

```typescript
async createSomething(body: Request, user): Promise<{ id: string }> {
  const profile = await this.requireProfile(user);

  return await this.repository.manager.transaction(async (manager) => {
    const repoA = manager.getRepository(EntityA);   // важно — getRepository из manager
    const repoB = manager.getRepository(EntityB);

    const entityA = manager.create(EntityA, {
      ...rest,
      id: v4(),
      profileId: profile.id,
    });
    await manager.save(entityA);

    for (const item of nestedItems) {
      // валидация ссылок
      const exists = await this.someRepo.findOneBy({ id: item.refId });
      if (!exists) throw new BadRequestException(`Invalid refId: ${item.refId}`);

      const entityB = manager.create(EntityB, { ...item, id: v4(), entityAId: entityA.id });
      await manager.save(entityB);
    }

    return { id: entityA.id };
  });
}
```

### 8. Добавить нового поставщика OAuth (типа Google/Apple)

1. `src/modules/auth/services/<provider>-auth.service.ts`:
   ```typescript
   @Injectable()
   export class XyzAuthService {
     async verifyIdToken(token: string): Promise<XyzPayload> { ... }
   }
   ```
2. Зарегистрировать в `auth.module.ts` `providers` + `exports`.
3. DTO `dto/xyz-login.request.ts` (`@IsString idToken: string;`).
4. В `AuthService` метод `loginWithXyz(dto)`. Pattern: verify → lookup by `xyzId` → fallback by email → create or link → `buildLoginResponse(userId)`.
5. Endpoint в `AuthController`:
   ```typescript
   @Post('xyz')
   @HttpCode(200)
   @ApiOperation({ summary: 'Login/Register with Xyz' })
   xyz(@Body() dto: XyzLoginRequest): Promise<LoginResponse> {
     return this.authService.loginWithXyz(dto);
   }
   ```
6. Добавить `xyzId` в `UsersEntity`. **Schema change** — внимательно к `synchronize` (новая колонка должна быть nullable).

---

## Performance budgets and priorities

Явных budget'ов в коде нет. Дефолтные:

- Не делать N+1. Использовать `relations: [...]` или `createQueryBuilder` с `leftJoinAndSelect`.
- Endpoints отдающие списки — обязаны иметь либо пагинацию, либо date-range фильтр (`/trainings?start=&end=`, `/admin/users/:id/trainings?start=&end=`, `/admin/users/:id/weight-history`).
- Aggregation queries (`getRawMany`) использовать вместо JS-side reduce'ов.
- Не блокировать event loop тяжёлой синхронной работой (bcrypt — sync `compareSync`/`hashSync`, но один вызов на login → допустимо).

---

## Testing strategy

`jest` настроен в `package.json` (`testRegex: '.*\\.spec\\.ts$'`, `rootDir: src`, `ts-jest` transform), но `*.spec.ts` файлов в репо **нет**. Не пишем без явного запроса.

---

## Locked architectural decisions

- TypeORM `synchronize` вместо миграций — намеренно. `migrations: []`, `migrationsRun` управляется env. **Не вводить `migrations: [...]` без запроса.**
- NestJS modules-by-feature, не CQRS, не event-driven, не GraphQL.
- Single `AdminController` под весь `/admin/*` — намеренно, не дробим.
- JWT в Bearer header, **не cookies**.
- Глобальный `ValidationPipe` со строгим `forbidNonWhitelisted` — любое лишнее поле в request → 400.
- Custom `repositoryProviders` вместо `@nestjs/typeorm.forFeature()` — единый DI-стиль через токены `'<NAME>_REPOSITORY'`.
- Custom `JwtAuthGuard.handleRequest` маппит ошибки в специфичные коды (`ACCESS_TOKEN_EXPIRED`/`ACCESS_TOKEN_INVALID`/`UNAUTHORIZED`) — клиенты ориентируются на эти строки.
- Refresh — отдельный secret (`JWT_REFRESH_SECRET`) и TTL (`JWT_REFRESH_EXPIRATION_TIME`). Payload только `{ id }`.
- ID — `uuid` v4 (генерируется руками в сервисе через `v4()`).
- Docker Compose как единственный способ запуска (db + backend в одной сети).
- `synchronize` управляется env (`POSTGRES_SYNC`), в проде включён — намеренно.
- I18n модуль `@Global()` — `LanguageMiddleware` повсюду, `req.locale` доступен в любом controller'е.

---

## Scope discipline

- Не добавлять миграции (`migrations: [...]`, `migrationsRun: true`, новый папка миграций) без запроса. Схема катится через `synchronize`.
- Не менять `entities/*.entity.ts` без запроса — это совместимая схема с прод-БД, которой управляет `synchronize`. Любая `non-nullable` колонка без default в существующей таблице сломает деплой.
- Не менять `DatabaseService.typeOrmConfig()` без запроса.
- Не менять `repository.providers.ts` (порядок/токены) без запроса.
- Не править `Dockerfile` / `docker-compose.yml` / `scripts/deploy.sh` без запроса.
- Не вводить cookies / sessions / другую auth-механику.
- Не менять `JwtAuthGuard.handleRequest` ошибочные коды (`ACCESS_TOKEN_EXPIRED`/`ACCESS_TOKEN_INVALID`) — на них завязан клиентский `TokenProvider` в mobile.
- Не добавлять глобальные guards/interceptors в `main.ts` без запроса.
- Не менять `.env` структуру (все env vars документированы в `README.md`).
- Не вводить `@nestjs/typeorm` `forFeature(...)` — у нас свой DI.
- Не менять `ValidationPipe` параметры (`forbidNonWhitelisted` критичен для security).

---

## When to stop and ask

- Любое изменение схемы БД (новая колонка, изменение типа, удаление, индекс, изменение `nullable`/`default`).
- Любой новый endpoint в `/admin/*` или изменение `JwtAuthGuard`/`AdminOnlyGuard`/`JwtStrategy`/`TokenService`.
- Изменение DTO существующего endpoint — **API breaking change**, синхронизировать с mobile (`grippo-mobile/data-services/backend/dto/...`) и admin (`grippo-admin/src/infrastructure/http/endpoints.js`).
- Изменение enum в `src/lib/*.enum.ts` — breaking для всех потребителей.
- Изменение Auth flow (Google/Apple/refresh/login), Token TTL, `JWT_*` env-vars.
- Новая зависимость в `package.json`.
- Любая сильная переработка в `users.service.ts` или `trainings.service.ts` (transactions, query patterns) — оба содержат проверки доступа и каскадные удаления.
- Новый OAuth-провайдер (новая колонка в `UsersEntity`, новый сервис, новый flow).
- Изменение `setupSwagger` — Swagger потребляется внешними системами.

---

## Anti-patterns (что отказываться писать)

- Бизнес-логика в controller'ах. Controller — только HTTP + DTO + `@UseGuards` + Swagger декораторы + вызов service.
- Прямой `getRepository(Entity)` или статический доступ к `DataSource`. Только injection через `@Inject('<NAME>_REPOSITORY')` или (внутри транзакции) `manager.getRepository(...)`.
- `@nestjs/typeorm` `@InjectRepository()` / `TypeOrmModule.forFeature(...)` — у нас свой DI через `repository.providers.ts`.
- Возврат TypeORM entity напрямую если в нём есть `@Column({ select: false })` поля (как `password`). Использовать response DTO.
- Inline SQL без `QueryBuilder` (за исключением raw migrations, которых у нас нет).
- Любая работа с локалью вне `LanguageMiddleware` / `req.locale` / `ExerciseExampleI18nService`.
- Generic `throw new Error('...')` в бизнес-логике. Только NestJS `HttpException`-ы. (Исключение — `JwtStrategy.validate`, raw error для `JwtAuthGuard`.)
- Date-arithmetic через `new Date(...)` без валидации входа. Использовать `moment(input).isValid()`.
- Cross-feature импорт **сервисов** напрямую без `imports: [<Other>Module]`. NestJS не даст без exports/imports, но кто-то может попробовать через relative import — нельзя.
- Транзакции через `await` цепочку без `manager.transaction(...)` — будет race в `INSERT` дочерних сущностей. Внутри транзакции **обязательно** использовать `manager.getRepository()`, не инжектированный repo.
- Глобальные mutable модули. State держится в БД.
- `process.env.X` напрямую — только через `ConfigService.get<...>('X')`.
- Прямая инъекция `Request`/`Response` Express-объектов вне крайних случаев — preferred `@Req()`/`@Res({ passthrough: true })` с типизацией.
- DTO без `@ApiProperty` — Swagger не сгенерится, mobile не увидит контракт.
- DTO без хотя бы одного `class-validator` декоратора на полях — `whitelist` отбросит поле в request body.
- Кастомные nested-DTO без `@ValidateNested({ each: true }) + @Type(() => Nested)` — валидатор пропустит nested.
- `console.log` — только `Logger`. NestJS `Logger` интегрирован с морганом и форматирует одинаково.
- `@Module({ controllers: [...], providers: [...] })` без `imports: [DatabaseModule]` если используешь `repositoryProviders` — будет `Nest can't resolve dependencies`.
- Трогать `password` в response. `@Column({ select: false })` уже не выберет его — но никогда не возвращать через ручной `findOne({ select: ['id', 'password'] })` в controller.
