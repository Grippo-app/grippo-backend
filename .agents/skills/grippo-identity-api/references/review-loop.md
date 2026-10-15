# Сценарии проверки identity/API

Выбирай затронутый поток и смежные границы владения/контракта. Общий порядок self-review, независимого ревью и закрытия замечаний задаёт [grippo-review](../../grippo-review/SKILL.md), команды и ограничения проверок — [grippo-verification](../../grippo-verification/SKILL.md). Наличие сценария в таблице не доказывает его прохождение.

## До правки

Зафиксируй вход → actor → target owner → DB write/read → response. Сравни source с [api-map.md](api-map.md), выдели client-visible diff: method/path/query, поля, enum, required/nullable, статус, error string/header, ordering, null/empty/body semantics. Для auth дополнительно: тип token, issuer/audience/secret, linking policy, expiry/revoke.

Для изолированной проверки используй DTO, helpers или сервисы с подменёнными зависимостями; импорт `main.ts` либо инициализация реального `DATA_SOURCE` запустят приложение/БД и не подходят для проверки документации.

## Сценарии по потокам

| Затронутый поток | Что проверить в self-review | Какое доказательство уместно |
|---|---|---|
| Password login | неизвестный email, password null, неверный/верный hash; password отсутствует в response; email handling | isolated Hash/service harness с fake repo; response projection review |
| Registration/linking | новый email; существующий password user; social-only user; duplicate/concurrent requests; доказательство владения identity перед выдачей JWT | service fixture + review branching/DB constraints; отдельное решение о linking policy |
| Google | нет config audiences; каждый разрешённый audience; verification failure; payload без email/sub; email_verified false; lookup provider→email; conflicting linked sub | mock OAuth2Client/service payloads; не нужен настоящий Google token |
| Apple exchange | missing config, invalid key type/PEM, missing id_token, JSON OAuth error, network/JSON failure | HTTPS stub/fixture с синтетическими кодами и ключами; без обращения в Apple |
| Apple verification | bad header alg/kid; cache empty/expired/hit; unknown kid refetch; wrong audience/issuer/expired claims; sub missing; email_verified boolean/string/missing | signed synthetic fixtures в изолированном harness; mock JWKS/clock |
| JWT issue/refresh | exact payload identity; разные secrets/TTLs; missing/empty refresh secret и fallback к модульному access secret; malformed/missing refresh; deleted user; old refresh reuse; errors outside verify catch | fake JwtService/repo для service; offline signature checks с синтетическими secrets и установленной библиотекой |
| JWT guard/strategy | missing bearer, invalid signature, expiration, deleted user, `err` против `info`; все три messages и header | fake ExecutionContext/response; вызов handleRequest с точными аргументами; isolated Passport integration по задаче |
| Admin role | default actor 403, admin actor success; target missing; same-role no-op; self/last-admin policy; роли обновляются из DB | guard/service fixtures; caller contract review |
| Profile creation | duplicate/no user; transaction rollback при invalid references/weight; user ID ≠ profile ID; no implicit goal; scalar exclusion arrays; SQL nullable user/profile FK против сервисного требования владельца | DTO `plainToInstance+validate`, fake manager и offline metadata; изолированная БД нужна для FK/rollback guarantee |
| `GET /users` | no profile→null/zeros; last weight; aggregate null/string conversions; ручной output без password/provider IDs | fake query results; isolated SQL для aggregate correctness при изменении SQL |
| Exclusion replace | `[]`, invalid ID, duplicate ID, чужой user, insert failure после delete, concurrent replace | service harness; review transaction scope; DB fixture только при schema/atomicity задаче |
| Goal | create/update; omitted/null optional values; enum validation; confidence reset=1; lastConfirmedAt; current-user no profile=400, admin null/404 | DTO/service fixtures и literal JSON-null controller check |
| Weight | bounds 30/300; >1 decimals; no profile; last entry; чужой/unknown/malformed ID; concurrency count/delete | DTO/service fixtures; DB rounding/locking проверять только изолированно |
| Push | token reuse same user; transfer другой user; many tokens per user; delete-all; отсутствие profile; admin list projection | query-builder args + isolated unique conflict fixture, если query меняется |
| Locale/read | en/ua/ru/region/unsupported; quality weights; missing direct/en; direct field null; no translations output; mutation/повторный перевод | pure locale/translation harness без bootstrap |
| Translation write | duplicate language; empty/undefined/null value; missing locale replacement; base selection; all-null row suppression; массив вместо localized row | DTO/service/helper fixtures; review transaction delete/reinsert |
| Swagger/DTO/HTTP | bearer scheme name; method/status/parameters/response types; extra fields rejection; scalars без DTO; numeric strings; null semantics | metadata/DTO isolated check с stubs; никаких реальных auth credentials в docs fixtures |

Regression expectations должны различать текущий контракт и исправляемый дефект. Например, фикстура публичного register может показать выдачу JWT social-only user по чужому email, но не должна закреплять это как безопасную политику linking.

## Существующее покрытие и его границы

[exercise-example.request.spec.ts](../../../../src/modules/exercise-examples/dto/exercise-example.request.spec.ts) проверяет строгий ValidationPipe для bundles/equipment arrays, вложенных записей, integer percentage 0..100 и суммы 100. [admin.controller.spec.ts](../../../../src/modules/admin/admin.controller.spec.ts) проверяет POST/PUT, статусы и Swagger в изолированном приложении с подменёнными guards и services. Эти specs не проверяют реальные JWT/admin guards, OAuth, сохранение переводов, FK или rollback. В частности, они не закрывают пробелы проверки формы components и localized text rows.

Для нагрузки отдельно оцени полный список users/weights/tokens, синхронный bcrypt, отсутствие network timeout у Apple и повторный JWKS fetch. Без измерения это свойства кода и предметные риски, а не подтверждённые значения задержек.
