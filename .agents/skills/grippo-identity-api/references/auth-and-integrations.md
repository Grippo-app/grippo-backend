# Auth, внешние identity providers и роли

## Источники и зависимости

- [AuthController](../../../../src/modules/auth/auth.controller.ts) — публичные HTTP entrypoints и statuses.
- [AuthService](../../../../src/modules/auth/auth.service.ts) — password login/register, provider linking, refresh, `LoginResponse`.
- [TokenService](../../../../src/modules/auth/services/token.service.ts), [AuthModule](../../../../src/modules/auth/auth.module.ts) — issuance, JWT registration и providers.
- [UsersEntity](../../../../src/entities/users.entity.ts) — unique `email`, nullable unique `googleId`/`appleId`, `password` nullable и `select:false`, enum role.
- [Hash](../../../../src/lib/hash.ts) — синхронные `bcryptjs.genSaltSync/hashSync/compareSync`.
- [GoogleAuthService](../../../../src/modules/auth/services/google-auth.service.ts), [AppleAuthService](../../../../src/modules/auth/services/apple-auth.service.ts) — внешняя verification.

AuthModule импортирует `PassportModule.register({defaultStrategy:'jwt'})`, `JwtModule.registerAsync`, `DatabaseModule`; регистрирует и экспортирует JWT strategy и auth/provider/token services. Repositories предоставляет импортированный DatabaseModule, без повторных provider arrays и `TypeOrmModule.forFeature`.

## Password flow — факты

`login` выбирает по точному `email` поля `id,email,password`. Нет user/password/hash mismatch → 401 `Invalid credentials`; successful compare → новая JWT пара. Password hash обычно скрыт, поэтому явный select важен. Login failure пишет email в log, success — user ID. Rate limiting/captcha/account lock/password reset/email verification в рассматриваемом исходном потоке не реализованы.

`register`:

1. Lookup по email с `id`.
2. Любой существующий user, включая social-only → 400 `This email is already taken`, без записи password и выдачи JWT.
3. Иначе создаёт `UsersEntity {email,password:hash,role:DEFAULT}`, сохраняет и выдаёт tokens.

Profile в этих шагах не создаётся. Lookup/create и linking не обёрнуты общей transaction; уникальные DB constraints остаются последней защитой от concurrent duplicate insert. Нет перевода unique-violation в специализированный 400/409 в `AuthService`.

Прежний путь назначения password social-only user через публичный register закрыт. Не восстанавливай его как удобное linking поведение. Добавление password к существующей identity требует отдельного разрешённого потока с доказательством владения и обработкой races.

## Google — факты

1. `GoogleLoginRequest.idToken` передаётся в `OAuth2Client.verifyIdToken`.
2. Audience берётся из непустых `GOOGLE_CLIENT_ID_WEB`, `GOOGLE_CLIENT_ID_ANDROID`, `GOOGLE_CLIENT_ID_IOS`; если ни одного нет → 400 `Google auth is not configured` до try/catch. Значения не trim-ятся.
3. Один client ID передаётся строкой, несколько — array. Проверку подписи/claims выполняет библиотека; в этом репозитории собственной Google JWKS реализации нет.
4. Ошибка `verifyIdToken`/пустой ticket payload → 401 с `Invalid Google token: <message>`.
5. `AuthService` требует `email`, `sub` и truthy `email_verified`; отсутствие verified email → 401 `Google email is not verified`.
6. Lookup сначала по `googleId=sub`, потом email. Новый user: password null и default role. Найденный user без `googleId` получает sub; при уже существующем `googleId` другое значение отдельно не сверяется. Существующий email пользователя не синхронизируется с новым provider email.
7. Возвращаются backend JWT, Google token в БД не сохраняется.

Google web/android/iOS client IDs — allowlist audience, не client secrets. Не смешивай Google ID token с backend access token или authorization code: эти три типа принимаются разными потоками.

## Apple — факты

Клиент присылает **authorization code**, не Apple ID token. `AuthService.loginWithApple`: `exchangeCodeForIdToken(code)` → `verifyIdToken(idToken)` → lookup/link/create → backend tokens.

### Config и client secret

| Config key | Использование |
|---|---|
| `APPLE_BUNDLE_ID` | один `client_id` и ID-token `audience`, trim, required |
| `APPLE_TEAM_ID` | client-secret `iss`, trim, required |
| `APPLE_KEY_ID` | client-secret JWT header `kid`, trim, required |
| `APPLE_PRIVATE_KEY_B64` | base64 PEM PKCS#8 EC private key, trim, required |

Нет отдельных `APPLE_CLIENT_ID`, web redirect URI или нескольких audience в реализации. Не добавляй предположение о поддержке web Service ID поверх факта имени `APPLE_BUNDLE_ID`.

Private key декодируется из base64; normalizer обрабатывает буквальные `\\n`, реальные переводы строк и PEM, сжатый в одну строку. Проверяется presence `BEGIN/END PRIVATE KEY`, затем `createPrivateKey({format:'pem',type:'pkcs8'})` и `asymmetricKeyType==='ec'`. Client secret — ES256, `{iss:teamId,iat:now,exp:now+300,aud:'https://appleid.apple.com',sub:clientId}`, header `kid,alg`. Новая подпись создаётся на exchange, не хранится постоянным token.

### Exchange и ID token verification

- `POST https://appleid.apple.com/auth/token` через Node `https.request`; form-urlencoded поля `client_id,client_secret,code,grant_type=authorization_code`.
- JSON `error` → 401 `Apple code exchange failed (...)`; отсутствующий `id_token` → 401 `Apple identity token is missing (...)`. OAuth access/refresh tokens из response не используются и не сохраняются.
- Header ID token декодируется вручную только для выбора ключа: нужны `kid` и `alg==='RS256'`. Header decoding само по себе не верификация.
- Apple JWKS: `GET https://appleid.apple.com/auth/keys`, in-memory cache 6 часов. Expired/empty cache → fetch; неизвестный `kid` → ещё fetch. Поддерживается RSA JWK с `n,e`, конвертируется в SPKI PEM.
- `jsonwebtoken.verify`: `algorithms:['RS256']`, `issuer:'https://appleid.apple.com'`, `audience:APPLE_BUNDLE_ID`; затем обязательный `sub`. Expiration проверяется библиотекой по наличию claim; отдельного требования наличия `exp`/`iat` в service нет.
- Если token содержит email и `email_verified` определён, принимаются только `true` или строка `'true'`. Email с отсутствующим `email_verified` не отклоняется этим условием.

### Linking и failure boundaries

Lookup по `appleId=sub`, далее по email если он есть. Для нового user email обязателен → иначе 400 `Apple token does not include email`. Возвращающемуся user по appleId email не нужен. Если найден user без appleId — добавляется sub; уже заданный appleId не сравнивается с новым sub. Никаких `nonce`, PKCE, relay-email identity policy или application callback state в этом backend коде нет.

**Наблюдаемые ограничения, не утверждение об exploit:** exchange не проверяет HTTP status, парсит JSON без response size bound; оба HTTPS helpers без timeout/retry. Network/JSON/key-import errors могут выйти обычным Error; `AuthService` rethrows, а не всегда конвертирует их в 401. Unknown `kid` при непустом cache инициирует refetch на каждый verification. На cold cache parallel requests не объединяются. Не обещай, что все Apple failures соответствуют Swagger 401.

`jsonwebtoken` объявлен прямой runtime dependency в [package.json](../../../../package.json); `@types/jsonwebtoken` — devDependency. Apple service использует default import.

## JWT lifecycle — факты

`TokenService.createTokens(userId)` подписывает два payload `{id:userId}`. Роль/email/token-type/session ID/jti не включены. JWT library обычно добавляет стандартные time claims; единственное бизнес-поле здесь `id`.

| Назначение | Secret | TTL |
|---|---|---|
| Access | `JWT_SECRET_KEY` | `JWT_EXPIRATION_TIME || '1d'` |
| Refresh | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRATION_TIME` |

Access TTL fallback задан и в AuthModule, и явно в TokenService. Refresh TTL передаётся без fallback; его отсутствие/некорректная форма может сорвать issuance. ConfigModule не имеет общей validation schema, но `TokenService.getRefreshSecret()` до signing и refresh verification требует непустые string access/refresh secrets и их различие; иначе HTTP 500 `JWT configuration is invalid`. Whitespace проверяется через trim, сами secret values не trim-ятся при подписи/сравнении.

Refresh: getRefreshSecret до try → verifyAsync с этим secret в try/catch → проверка payload (не null/array, строковый UUID id) → usersRepository.existsBy → новая пара. Invalid/expired verification, неверная форма identity или отсутствующий user → 401 `Invalid or expired refresh token`. Ошибка конфигурации, БД или issuance не нормализуется verification catch в 401.

Refresh token не хранится, не хэшируется в БД, не invalidated после использования. Нет refresh rotation/reuse detection/revocation/logout route/password-change invalidation. Новая пара не означает одноразовость старого token. Удаление user блокирует refresh при DB lookup и protected requests при strategy lookup. Смена роли учитывается при следующем protected request, поскольку роль берётся из БД. `DELETE /push-tokens` не logout и JWT не отзывает.

**Разделение access/refresh:** payload одинаков по типу; разграничение опирается на разные secrets. getRefreshSecret отвергает missing/blank/equal конфигурацию до обращения к JWT library, закрывая прежний fallback refresh к модульному access secret. Проверяй это синтетическими config/signature fixtures; production secrets для проверки не нужны. Отдельного token-type claim нет.

## Access validation и error contract

Источники: [JwtStrategy](../../../../src/common/jwt.strategy.ts), [JwtAuthGuard](../../../../src/common/jwt-auth.guard.ts).

`passport-jwt` читает только Authorization Bearer header, secret `JWT_SECRET_KEY`; `validate` дополнительно сравнивает `payload.exp*1000` с `Date.now`, затем запрашивает user `id,email,role`. Пароля в `req.user` нет. Если user не найден, strategy бросает Error с `name='JsonWebTokenError'`; expired manual branch — `name='TokenExpiredError'`.

Guard входит в failure branch при `err || !user`, но классифицирует **`info?.name`**, а не `err.name`:

| `info.name` | HTTP message | `WWW-Authenticate` |
|---|---|---|
| `TokenExpiredError` | `ACCESS_TOKEN_EXPIRED` | `Bearer error="invalid_token", error_description="The access token expired"` |
| `JsonWebTokenError` | `ACCESS_TOKEN_INVALID` | `Bearer error="invalid_token", error_description="The access token is invalid"` |
| другое/пусто | `UNAUTHORIZED` | `Bearer error="unauthorized", error_description="Authorization required"` |

**Вывод, требующий проверки при изменении:** ошибки самой `validate` передаются Passport как `err`; значит ручной `JsonWebTokenError` для удалённого user не следует документировать как гарантированный `ACCESS_TOKEN_INVALID`. Общая ветка `UNAUTHORIZED` согласуется с guard. Строки/headers — существующий клиентский контракт; не меняй их попутно с оформлением кода.

## Admin lifecycle — факты

[UserRoleEnum](../../../../src/lib/user-role.enum.ts) содержит только `DEFAULT='default'`, `ADMIN='admin'`. Все registration variants создают default. [AdminOnlyGuard](../../../../src/common/admin.guard.ts) проверяет точное `req.user.role===ADMIN`, иначе 403 `Only admin can access this route`.

В исходном приложении нет first-admin bootstrap/seed/публичного promotion. Оба promotion paths уже требуют admin. `makeUserAdminByEmail` переводит существующего user в ADMIN; `setUserRole` принимает обе enum роли по user ID. Оба делают no-op при той же роли. Нет защиты от self-demotion, удаления последнего admin или demotion последнего admin. Это факты, а не правило запретить такую операцию без продуктового требования.

**Практика для задачи bootstrap:** выясни существующий operator process, подготовь минимальный проверяемый путь для нужной среды; не превращай документационную задачу в прямую SQL mutation и не придумывай magic email/secret route. Точный target actor/role, rollback и сохранение административного доступа должны быть видны в изменении.
