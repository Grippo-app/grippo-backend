# Карта HTTP контрактов

Карта составлена по controllers и DTO. `200/201/204` ниже — явный `@HttpCode`, а не обещание отсутствия ошибок. Route prefix `/api` в `main.ts` закомментирован. Корневые пути начинаются с `/auth`, `/users`, `/admin`, `/weight-history`, `/push-tokens`.

## Доступ

| Область | Guard | Identity |
|---|---|---|
| `/auth/*` | нет route guard | данные login/provider/refresh |
| `/users/*` | controller `JwtAuthGuard` | `req.user.id` |
| `/weight-history/*` | controller `JwtAuthGuard` | user → profile |
| `/push-tokens/*` | controller `JwtAuthGuard` | user без необходимости profile |
| `/admin/*` | `JwtAuthGuard, AdminOnlyGuard` в этом порядке | actor role из БД; target из path/email |

Guard registration: [auth.module.ts](../../../../src/modules/auth/auth.module.ts), [JWT strategy](../../../../src/common/jwt.strategy.ts), [JWT guard](../../../../src/common/jwt-auth.guard.ts), [admin guard](../../../../src/common/admin.guard.ts). Нет глобального `APP_GUARD` в [AppModule](../../../../src/app.module.ts) / [bootstrap](../../../../src/main.ts).

## Auth

Источник: [AuthController](../../../../src/modules/auth/auth.controller.ts), [AuthService](../../../../src/modules/auth/auth.service.ts).

| HTTP route | Controller → service | Request | Success |
|---|---|---|---|
| `POST /auth/login` | `login → login` | `LoginRequest` | 200 `LoginResponse` |
| `POST /auth/register` | `register → register` | `RegisterRequest` | 201 `LoginResponse` |
| `POST /auth/google` | `google → loginWithGoogle` | `GoogleLoginRequest` | 200 `LoginResponse` |
| `POST /auth/apple` | `apple → loginWithApple` | `AppleLoginRequest` | 200 `LoginResponse` |
| `POST /auth/refresh` | `refresh → refresh` | scalar `@Body('refreshToken')` | 200 `LoginResponse` |

`LoginResponse` содержит только `id`, `accessToken`, `refreshToken`; type, expiry timestamp и role в response не добавляются. [Response](../../../../src/modules/auth/dto/login.response.ts).

| Request DTO | Реальные validators |
|---|---|
| [LoginRequest](../../../../src/modules/auth/dto/login.request.ts) | `email: IsEmail`; `password: IsString` без min/max |
| [RegisterRequest](../../../../src/modules/auth/dto/register.request.ts) | `email: IsEmail`; `password: Length(6,128)` и custom maxPasswordBytes: string, не более 72 UTF-8 bytes |
| [GoogleLoginRequest](../../../../src/modules/auth/dto/google-login.request.ts) | `idToken: IsString`, пустая строка не отсечена DTO |
| [AppleLoginRequest](../../../../src/modules/auth/dto/apple-login.request.ts) | `code: IsString + IsNotEmpty`; service дополнительно проверяет truthiness |
| refresh body | нет request class, `refreshToken` не проходит field decorators; validation whole-body whitelist здесь не следует обещать |

Email normalization/verification для password registration в service нет. Примеры Swagger не задают дополнительные правила. `IsNotEmpty` у string не является trim whitespace.

## Users/profile

Источник: [UsersController](../../../../src/modules/users/users.controller.ts), [UsersService](../../../../src/modules/users/users.service.ts).

| HTTP route | Controller → service | Success / существенная семантика |
|---|---|---|
| `GET /users` | `getUser → getUser` | 200 `UserResponse`, profile nullable |
| `POST /users` | `createProfile → createProfile` | 201 `UserResponse`; duplicate profile → 400 |
| `POST /users/experience` | `updateExperience → updateExperience` | 200 `UserResponse` |
| `POST /users/height` | `updateHeight → updateHeight` | 200 `UserResponse` |
| `GET /users/excluded-muscles` | `getExcludedMuscles → getExcludedMuscles` | 200 `MuscleResponse[]`, включая group ID |
| `GET /users/excluded-equipments` | `getExcludedEquipments → getExcludedEquipments` | 200 `EquipmentResponse[]`, включая group ID |
| `POST /users/excluded-muscles` | `updateExcludedMuscles → updateExcludedMuscles` | 200 `{ids}`; список заменяется целиком |
| `POST /users/excluded-equipments` | `updateExcludedEquipments → updateExcludedEquipments` | 200 `{ids}`; список заменяется целиком |
| `POST /users/goal` | `setGoal → setGoal` | 200 `GoalResponse`; optional поля без значения сбрасываются |
| `GET /users/goal` | `getGoal → getGoal` | 200 JSON goal или буквальный JSON `null`, через `res.json` |
| `DELETE /users` | `deleteAccount → deleteUser` | 204; удаляется текущий user и связанные данные по FK |

`requireProfile` у update/exclusions/goals даёт 400 `User profile not created yet`, а `GET /users` возвращает user без profile. У `createProfile` нет неявного goal creation.

| Request DTO | Реальные validators и ограничения |
|---|---|
| [CreateUserProfileRequest](../../../../src/modules/users/dto/create-user-profile.request.ts) | `name: IsString`; `weight: IsNumber(maxDecimalPlaces:1) + Min(30) + Max(300)`; `height: IsInt`; `experience: IsEnum(ExperienceEnum)`; exclusions: `IsOptional + IsArray + IsUUID('all',{each:true}) + Type(String)` |
| [UpdateExperienceRequest](../../../../src/modules/users/dto/update-experience.request.ts) | `experience: IsEnum` |
| [UpdateHeightRequest](../../../../src/modules/users/dto/update-height.request.ts) | `height: IsInt`, без bounds |
| [UpdateExcludedIdsDto](../../../../src/modules/users/dto/update-excluded-ids.dto.ts) | `ids: IsArray + IsUUID('all',{each:true})`; empty array допустим; уникальность не проверена DTO |
| [GoalRequest](../../../../src/modules/users/dto/goal.request.ts) | `primaryGoal: IsEnum`; `secondaryGoal: IsOptional+IsEnum`; `target: IsOptional+IsDateString`; `personalizations: IsOptional+IsArray+IsEnum(each:true)` |

`CreateUserProfileRequest.weight` имеет DTO bounds 30–300 и DB check. Exclusions проверяются как arrays; scalar UUID отвергается. TypeScript declaration само по себе этих гарантий не обеспечивает.

Ответы: [UserResponse](../../../../src/modules/users/dto/user.response.ts) = `{id,email,role,createdAt,updatedAt,profile,stats}`; profile `{id,name,height,experience,weight}`; stats `{trainingsCount,totalDuration,totalVolume,totalRepetitions}`. Stats суммируют сохранённые training aggregates, не пересчитывают iterations. `googleId`, `appleId`, `password` в response не выводятся.

[GoalResponse](../../../../src/modules/users/dto/goal.response.ts) = `{primaryGoal,secondaryGoal,target,personalizations,confidence,createdAt,updatedAt,lastConfirmedAt}`, без DB `id`/`profileId`. Значения goal/experience/role бери из [goal.enum.ts](../../../../src/lib/goal.enum.ts), [experience.enum.ts](../../../../src/lib/experience.enum.ts), [user-role.enum.ts](../../../../src/lib/user-role.enum.ts), не из старых Swagger examples.

## Weight history и push token registry

| HTTP route | Controller → service | Request / success |
|---|---|---|
| `GET /weight-history` | `getWeightHistory → getWeightHistory` | 200 `WeightHistoryEntity[]`, `createdAt DESC` |
| `POST /weight-history` | `setWeightHistory → setWeightHistory` | `WeightHistoryRequest` → 201 сохранённая entity |
| `DELETE /weight-history/:id` | `removeWeightHistory → removeWeight` | path через ParseUUIDPipe; 200 TypeORM `DeleteResult`, last entry → 400 |
| `POST /push-tokens` | `savePushToken → upsertToken` | `PushTokenRequest` → 201, `Promise<void>` |
| `DELETE /push-tokens` | `deletePushTokens → deleteAllForUser` | 204; удаляются все tokens текущего user |

Источники: [weight controller](../../../../src/modules/weight-history/weight-history.controller.ts), [weight service](../../../../src/modules/weight-history/weight-history.service.ts), [weight DTO](../../../../src/modules/weight-history/dto/weight-history.request.ts), [push controller](../../../../src/modules/push-tokens/push-tokens.controller.ts), [push service](../../../../src/modules/push-tokens/push-tokens.service.ts), [push DTO](../../../../src/modules/push-tokens/dto/push-token.request.ts).

`WeightHistoryRequest.weight`: `IsNumber + Min(30) + Max(300)` без ограничения decimal places; БД хранит `decimal(5,1)`. `PushTokenRequest.token`: `IsString+IsNotEmpty`, без provider/device/platform/max-length validators. Registry не отправляет уведомления.

## Полная `/admin` поверхность

Все routes имеют controller guards JWT+admin. Источник: [AdminController](../../../../src/modules/admin/admin.controller.ts), [AdminModule](../../../../src/modules/admin/admin.module.ts).

| HTTP route | Controller → service | Input / success |
|---|---|---|
| `GET /admin/exercise-examples/:id/translations` | `getExerciseExampleTranslations → ExerciseExampleService.getExerciseExampleTranslations` | UUID path; 200 `ExerciseExampleTranslationsResponse`, сохранённые base/translation rows без fallback |
| `POST /admin/exercise-examples` | `createExerciseExample → ExerciseExampleService.createExerciseExample` | `ExerciseExampleRequest`; 201 `{id}` |
| `PUT /admin/exercise-examples?id=UUID` | `updateExerciseExample → ExerciseExampleService.updateExerciseExample` | UUID **query**, полный `ExerciseExampleUpdateRequest` с conditional translationsRevision; 204 |
| `DELETE /admin/exercise-examples/:id` | `deleteExerciseExample → ExerciseExampleService.deleteExerciseExample` | UUID path; 204; 404 при отсутствии; 409 при ссылках из exercises |
| `POST /admin/users/make-admin` | `makeAdmin → UsersService.makeUserAdminByEmail` | `AssignAdminRequest.email: IsEmail`; 200 `AdminUserResponse` |
| `GET /admin/users` | `getUsers → UsersService.getAllUsers` | 200 `AdminUserResponse[]`, все users без pagination |
| `PUT /admin/users/:id/role` | `setUserRole → UsersService.setUserRole` | UUID path; `AdminSetRoleRequest.role: IsEnum(UserRoleEnum)`; 200 `AdminUserResponse` |
| `GET /admin/users/:id/goal` | `getUserGoal → UsersService.getGoalByUserId` | UUID path; 200 JSON goal/null; отсутствующий user → 404 |
| `GET /admin/users/:id/trainings?start=&end=` | `getUserTrainings → TrainingsService.getTrainingsByUserId` | UUID path; date strings; `req.locale`; 200 `TrainingsEntity[]`; без profile → `[]` |
| `GET /admin/users/:id/weight-history` | `getUserWeightHistory → WeightHistoryService.getWeightHistoryByUserId` | UUID path; 200 `WeightHistoryEntity[]`; без profile → `[]` |
| `GET /admin/users/:id/device-tokens` | `getUserDeviceTokens → PushTokensService.getTokensByUserId` | UUID path; 200 `DeviceTokenResponse[]`; нет tokens → `[]` |
| `DELETE /admin/users/:id` | `deleteUser → UsersService.deleteUser` | UUID path; 204; отсутствующий user → 404 |

Для trainings/weight/tokens admin variants отдельной проверки существования user нет: неизвестный корректный UUID тоже может дать `[]`. Goal variant user existence проверяет. Обязательность `start`/`end` заявлена Swagger; scalar `@Query` не имеет DTO. В [TrainingsService](../../../../src/modules/trainings/trainings.service.ts) `moment(...).isValid()` вызывается после поиска profile; нет отдельной проверки порядка `start <= end`.

[AdminUserResponse](../../../../src/modules/users/dto/admin-user.response.ts): `{id,email,profileId,role,authTypes,createdAt,updatedAt,lastActivity,workoutsCount,profile}`. `authTypes` — точные строки `Google`, `Apple`, `Email` по наличию provider IDs/password; при пустом наборе fallback `Email`. Только list добавляет `lastActivity = MAX(trainings.created_at)` и workouts count; role-changing responses получают `null/0`. `profile.weight` у admin response всегда `null`, это не запрос последнего веса. `DeviceTokenResponse` действительно раскрывает `{id,token,createdAt}` админу.

## Ошибки и документация

- JWT guard задаёт 401 и `WWW-Authenticate`; admin guard 403. Точные значения и разница `err/info`: [auth-and-integrations.md](auth-and-integrations.md).
- Response DTO — описание и ручной mapping, не response validator. Нет global serializer, скрывающего произвольные поля автоматически.
- 400/404/409 в Swagger не доказывают обработку каждого failure. Last weight и malformed UUID имеют явные проверки; DB constraints и другие пути ошибок проверяй отдельно.
- Поддерживай HTTP method/query-vs-path/status/null/empty-array различия. Не «выравнивай» их под один стиль как побочный эффект задачи.
