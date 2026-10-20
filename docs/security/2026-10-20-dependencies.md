# Проверка зависимостей — 20 октября 2026

Проверено относительно `8bc5a20482ff4778bb700b0b43f847e9198174a6`.
Исходный GitHub Dependabot snapshot: **98 alerts, 78 уникальных GHSA,
35 пакетов**; critical 1, high 53, medium 28, low 16.
В текущем lockfile устранены **95 из 98 исходных alerts**. Три остаются ниже.
Это локальная проверка исправлений: закрытие GitHub alerts требует попадания
исправлений в default branch. Деплой и публикация данных не выполнялись.

[Полная таблица всех 98 alerts](2026-10-20-dependency-alerts.csv) содержит
исходные и текущие версии, severity, affected range, scope и результат.
Результат относится ко всем копиям пакета в lockfile: хотя бы одна оставшаяся
affected copy означает `remaining`. Диапазоны GitHub нормализованы удалением
запятых между условиями; semver проверен с `includePrerelease: true`
(существенно для старого `multer@1.4.4-lts.1`). Перед сравнением подтверждено,
что все 98 alerts соответствуют исходному lockfile.

SHA-256 проверенного lockfile:
`aca9f3aa71568e49b4c3cc840fad4bac5ae25d9b9cf72c1d6f8f206d5b292a14`.

## Что действительно затрагивает приложение

Наличие affected версии и достижимость конкретного exploit различаются.
Проверка сделана по исходникам и дереву зависимостей; установленный серверный
образ и production-конфигурация не исследовались.

| Путь | Применимость и исправление |
| --- | --- |
| `supertest → superagent → form-data` | Единственная исходная critical: предсказуемый multipart boundary. Только dev, без production импортов; исходный Dockerfile удаляет dev dependencies. Установлен 4.0.6, закрывающий также отдельную CRLF-инъекцию. |
| Nest ExpressAdapter → body-parser/qs | Реальная публичная поверхность: JSON и extended URL-encoded body обрабатываются до guards/DTO. Обновлены парсеры и qs; проверены лимиты размера/количества параметров/глубины, invalid JSON и prototype keys. |
| Express/path-to-regexp/cookie/send/serve-static | Установленные runtime-компоненты обновлены до исправленных версий в своих ветках. Маршрутов с несколькими параметрами в одном сегменте в приложении не найдено; HTTP-контракт UUID проверен. |
| Nest common | Обновлён до 10.4.22, включая исправление Content-Type advisory. Nest family согласовано остаётся на major 10. |
| Multer | Старые DoS-версии удалены. App upload/FileInterceptor маршрутов не найдено; установка пакета сама не включает multipart parsing. Отдельный synthetic Nest interceptor проверяет совместимость новой версии и лимиты. |
| TypeORM | Обновлён 0.3.20 → 0.3.31. Два SQL injection advisory относятся к MySQL/MariaDB; текущий DatabaseService выбирает PostgreSQL. Migration generation не используется. Обновление всё равно выполнено; реальные SQL/locks/rollback проверены на disposable PostgreSQL. |
| jws | Обе ветки обновлены. Условия advisory исключают используемые `jsonwebtoken`/`jws.verify()` и асимметричные алгоритмы; unsafe HMAC createVerify path в приложении не найден. |
| validator | Обновлён через class-validator. Пароли дополнительно ограничены 72 UTF-8 bytes, revision — строгим hex64; пользовательского isURL пути не найдено. |
| uuid | Приложение использует v4 без caller buffer; advisory затрагивает v3/v5/v6 с buffer/offset. Обновлён до CommonJS-совместимой 11.1.1; major 12+ не применяется. |
| js-yaml/lodash | Уязвимые pinned зависимости Swagger/config обновлены в тех же major. Swagger выдаёт YAML из собственного OpenAPI через dump; входящий пользовательский YAML не разбирается. YAML3 в dev tooling сохранён со своей схемой. |
| moment/morgan/on-headers | Применены опубликованные совместимые исправления; moment используется в training service. |
| glob | Runtime используется TypeORM с заданным исходниками pattern; уязвимый CLI `--cmd` не вызывается. Ветка 10 обновлена до 10.5.0. Наличие старых dev glob7 не означает affected range конкретного glob10 advisory. |
| Babel/webpack/serialize-javascript/browserslist | Инструменты разработки/сборки. Совместимые обновления; обновление webpack заменяет minimizer chain и удаляет serialize-javascript из дерева. Webpack buildHttp не включён проектом. |
| brace-expansion/minimatch/picomatch/flatted/diff/cross-spawn/formidable/tmp | Уязвимые копии исходных alerts исправлены в tooling/test цепочках. Передачи публичного HTTP-ввода в эти инструменты не найдено. |

Критическая проблема: [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4),
дополнительное исправление form-data: [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx).
Ограничения TypeORM: [save/update](https://github.com/advisories/GHSA-q2pj-6v73-8rgj),
[orderBy](https://github.com/advisories/GHSA-9ggv-8w38-r7pm).
Ограничения [jws](https://github.com/advisories/GHSA-869p-cjfg-cm3x)
и [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

## Overrides и совместимость

Пакеты с жёсткими upstream pins требуют overrides: обычное обновление lockfile
не снимает эти ограничения. Версионные selectors сохраняют major для
body-parser, multer, qs, path-to-regexp, lodash, обеих js-yaml веток, webpack,
glob, ajv, minimatch и picomatch. Не применяется `npm audit fix --force`.
Lockfile создан npm, не отредактирован вручную.

Два точечных исключения из диапазона непосредственного родителя:

- `external-editor → tmp 0.2.7`: сохранён фактический `tmpNameSync(options)`
  контракт. Inquirer использует defaults или `.txt` postfix. Проверяются
  prefix/postfix/mode, read/edit/cleanup и отклонение traversal; редактор
  и сторонние процессы не запускаются.
- `@nestjs/common → file-type 21.3.4`: Nest уже использует dynamic import
  `fileTypeFromBuffer` и `.mime`; API сохранён. Это закрывает новые ASF/ZIP
  advisories, которые иначе принесло бы обновление Nest. Node 20 поддерживается,
  но ZIP path требует **Node >=20.12** (`DecompressionStream('deflate-raw')`).
  Проверен Node 20.20.2. В major 21 изменились некоторые MIME и удалено
  Illustrator detection; текущих потребителей этого validator в приложении нет.

Источники: [file-type 21](https://github.com/sindresorhus/file-type/releases/tag/v21.0.0),
[21.3.4](https://github.com/sindresorhus/file-type/releases/tag/v21.3.4),
[ASF](https://github.com/advisories/GHSA-5v7r-6r5c-r473),
[ZIP](https://github.com/advisories/GHSA-j47w-4g3g-c36v),
[Node API](https://nodejs.org/api/webstreams.html).

`ts-node-dev` перемещён из production dependencies в devDependencies:
его использует только `start:dev`; production запускается через `node dist/main`.

## Оставшиеся три исходных alerts

| Alert | Состояние | Решение и условие повторного рассмотрения |
| --- | --- | --- |
| #126, high, [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | 3.0.3 всё ещё affected; исправленного релиза нет | Только dev/test/watch glob patterns. Публичный HTTP-input туда не поступает. Не запускать tooling на недоверенных glob patterns; обновить после upstream fix либо отдельно мигрировать родителей. Старый отдельный braces advisory `<3.0.3` исправлен. |
| #128, medium, [sprintf-js GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | 1.0.3 affected; исправленного релиза нет | Dev-only `load-nyc-config → js-yaml3 → argparse1`. YAML library не импортирует argparse; CLI использует собственные format strings. Не форсировать argparse major ради unused CLI. Повторить при upstream fix/поддерживаемом удалении зависимости. |
| #78, medium, [Nest SSE GHSA-36xv-jgw5-4q75](https://github.com/advisories/GHSA-36xv-jgw5-4q75) | Nest core 10.4.22 affected; fix опубликован с 11.1.18 | SSE/@Sse/EventSource/MessageEvent endpoint в приложении не найден. Не добавлять SSE без устранения issue. Nest major migration/backport требует отдельного изменения; смешивать её с patch-обновлением не стали. |

Остатки не объявлены исправленными и не dismissed на GitHub.

## Результаты audit и проверок

`npm audit` считает affected **package aggregates**, включая родителей,
а GitHub — отдельные alerts. Эти числа нельзя сравнивать напрямую.

| Audit | Critical | High | Moderate | Low | Total / exit |
| --- | ---: | ---: | ---: | ---: | --- |
| Исходный npm audit | 1 | 28 | 18 | 9 | 56 / 1 |
| Итоговый полный npm audit | 0 | 46 | 9 | 0 | 55 / 1 |
| Итоговый `npm audit --omit=dev` | 0 | 0 | 3 | 0 | 3 / 1 |

Итоговые 55 aggregates происходят ровно из трёх оставшихся GHSA выше;
46 high aggregates — распространение dev-only braces по родителям.
Production audit: единственный root advisory — Nest SSE, три aggregates
из-за зависимых пакетов. Это **не нулевой audit**.

Проверки выполняются на Node 20.20.2; PostgreSQL — 15.19. SQL runner создаёт
собственный свежий cluster, очищает окружение и удаляет данные/credentials.
AppModule, рабочая `.env`, существующая БД и OAuth-сеть не используются.

- `npm ci --ignore-scripts --engine-strict` в отдельной копии package/lock: PASS.
- `npm ls --all`: PASS без invalid/missing dependencies, также после clean ci.
- Изолированный `npm prune --omit=dev --ignore-scripts`: PASS;
  form-data, supertest, ts-node-dev, Jest и webpack отсутствуют;
  runtime Nest/TypeORM/uuid присутствуют. Рабочий lockfile не изменён.
- `tsc --noEmit --incremental false -p tsconfig.build.json`: PASS.
- Существующие две Jest suites: **233/233 PASS**.
- PostgreSQL runtime guards: **7/7 PASS**.
- Реальные PostgreSQL scenarios на итоговом lockfile (TypeORM 0.3.31,
  uuid 11.1.1): **47/47 PASS**, checksum до/после одинаков,
  cleanup подтверждён; исходная suite до upgrade также 47/47 PASS.
- Nest CLI build на отдельной копии исходников/config: PASS, `dist/main.js`
  создан; приложение не запускалось.
- Webpack 5.112.0 production minification: PASS на synthetic CommonJS entry,
  minimized asset и оба результата вычисления проверены; без загрузок и app bootstrap.
- Form-data: **10/10** synthetic probes на Node 20 и Node 22; actual crypto
  boundary, CRLF escaping, multipart length и обычный supertest запрос.
- Nest HTTP parser/interceptor compatibility: **18/18** на Node 20 и Node 22;
  explicit loopback, без AppModule/БД/загрузок файлов в сервер или S3.
- Дополнительные совместимые API: **39/39 PASS** на Node 20:
  tmp/external-editor 8, YAML3 CLI/library 10, Nest file-type validator 11
  (включая маленький deflated EPUB ZIP), TokenService/JWT/JWS 10
  с синтетическими ключами, tamper/wrong-key/expiry/algorithm rejection.
  Cleanup подтверждён; редактор и OAuth-сеть не запускались.
- `python3 scripts/validate-agent-kit.py`: PASS, 9 skills / 18 agents.
- `git diff --check`: PASS.

Проверки не доказывают соответствие production schema/config, настоящую
HTTP authorization/OAuth, поведение под нагрузкой или сборку/запуск Linux
Docker image. Production daemon и сервер не подключались.
