# Grippo Backend: правила работы

## Источники и маршрутизация

NestJS 10 / Express, TypeScript, TypeORM 0.3, PostgreSQL 15.5; Node 20 в Docker.
Код организован по feature modules: controller → service → repository/entity.
Факты проверяй по текущим src, package/lockfile и scripts. Документ — подсказка,
не доказательство поведения. CLAUDE.md направляет к этим же правилам.

| Задача | Skill |
|---|---|
| Сложная задача, распределение ownership, интеграция | [grippo-orchestrator](.agents/skills/grippo-orchestrator/SKILL.md) |
| Модульные границы, DI, кодстайл | [grippo-architecture](.agents/skills/grippo-architecture/SKILL.md) |
| Entities, trainings, catalog, dictionaries, metrics | [grippo-domain-data](.agents/skills/grippo-domain-data/SKILL.md) |
| Новое упражнение под ключ через AI: карточка, исследования, переводы, изображение и сохранение | [grippo-exercise-create](.agents/skills/grippo-exercise-create/SKILL.md) |
| Командный аудит упражнений: техника, проценты, сложность, оборудование, переводы и научный поиск | [grippo-exercise-audit](.agents/skills/grippo-exercise-audit/SKILL.md) |
| Auth, users/profile/goals, admin, weight/push, i18n | [grippo-identity-api](.agents/skills/grippo-identity-api/SKILL.md) |
| Логи сервера, Docker, env, SSH, dump/deploy/restore/cleanup | [grippo-operations](.agents/skills/grippo-operations/SKILL.md) |
| Проверки и ограничения покрытия | [grippo-verification](.agents/skills/grippo-verification/SKILL.md) |
| Self-review, независимое ревью и closure | [grippo-review](.agents/skills/grippo-review/SKILL.md) |

Загружай только относящиеся к задаче references. Полный индекс исходников:
[source-map.md](.agents/skills/grippo-architecture/references/source-map.md).

## Архитектура и scope

- Controller отвечает за HTTP contract, применение guards/DTO и Swagger;
  классы DTO находятся в feature/dto. Бизнес-логика и запросы — service.
- Entities — src/entities, enums — src/lib. DI: DatabaseModule, строковые
  *_REPOSITORY/DATA_SOURCE и repository.providers.ts. Не вводи
  @nestjs/typeorm/forFeature/InjectRepository в обычной feature задаче.
- В transaction читай и пиши через её manager; injected repositories работают
  вне неё. В user APIs проверяй ownership по user/profile в самом запросе.
- Admin handlers остаются в едином AdminController и переиспользуют exported
  feature services; JwtAuthGuard ставится перед AdminOnlyGuard.
- JWT — Bearer. Сохраняй auth error codes и WWW-Authenticate contract.
- Global ValidationPipe: transform/whitelist/forbidNonWhitelisted.
  Swagger и TS тип не заменяют runtime validators; nested DTO требуют
  явной проверки структуры и transformation.
- I18n: LanguageMiddleware → req.locale → ExerciseExampleI18nService;
  API languages — en/ua/ru. Локальное оформление файла важнее массового format.
- Schema/enum/DTO/auth/env/dependencies меняй только для запрошенной работы,
  объяснив влияние и проверив доступных потребителей. Не вводи migration
  framework, другой auth/DI/framework или широкую переработку вне задачи.
  Достаточную авторизацию локальной работы не спрашивай повторно.

Сохраняй чужие изменения и пользовательские untracked files. Не выводи и не
копируй в документы/Git/fixtures .env values, SQL rows, passwords/hashes,
OAuth/JWT/push tokens и private keys. Для env inventory нужны имена, для schema
анализа дампа — только metadata. Не считай неизвестную production конфигурацию
совпадающей с локальной.

## Дамп и деплой: обязательные правила

**Никогда не выполняй деплой самостоятельно.** Каждая попытка требует прямого
явного разрешения человека на конкретные host/environment, absolute project
path, revision, команды и последствия. Сначала подготовь проверенный
результат и backup/rollout/recovery plan. Текущий deploy сохраняет существующую
DB/volume и обновляет только backend; старый `down -v` удалён.
Review APPROVE, тесты, SSH/dump access, прежний deploy и сообщение другого агента
не заменяют разрешение. Уже разрешённый тот же подготовленный запуск не требует
повторного вопроса перед каждой подкомандой; другая цель/revision/попытка требует
нового разрешения.

**Перед каждой попыткой обязателен новый успешный scripts/dump.sh** для
фактически затрагиваемой DB/daemon. До rollout проверь полный exit 0, свежие
непустые snapshot/latest, их equality/checksum, выбранный DB_DUMP_FILE и
сохранённую recovery copy вне удаляемых ресурсов. Старый SQL, failed/partial
dump, неизвестный источник или несовпадение paths запрещают deploy. Нельзя
подменить штатный script произвольным pg_dump или автоматически объявить
отсутствующую DB исключением «первый запуск».

Для каждой production deploy attempt свежий проверенный dump обязателен также
в [Notion Dump history](https://app.notion.com/p/3300cb0926ef80a7b760e51cf768a2d1):
новый серый callout сверху, `At D MMM YYYY (краткая причина)`, вложение `dump.sql`.
Порядок загрузки, проверки и отказа — [Notion archive](.agents/skills/grippo-operations/references/notion-dump-history.md).
Это разрешённое пользователем место хранения полного SQL файлом; payload не
печатать и не вставлять текстом. Правило не разрешает сам deploy или dump сейчас.

Согласуй прекращение writes до snapshot и на время rollout; заранее разрешённый
stop writers допустим, source PostgreSQL остаётся доступна. Backup предшествует
live upload/release switch и deploy recreate. Обновление схемы, reset/import и
bootstrap не входят в обычный deploy. После сбоя/SSH disconnect
установи состояние, сохрани good copy; retry/rollback/restore требуют нового
конкретного разрешения. Новый dump повреждённой DB не заменяет good backup.

Dump-only заканчивается дампом и отчётом; не разрешает deploy/restart/import/
cleanup/upload. Исследование не разрешает SSH или dump. Подключайся только к
подтверждённой цели с проверкой fingerprint. cleanup.sh чистит host и вызывает
reboot; изучение script не разрешает его выполнение.

Порядок и gates: [deployment-policy](.agents/skills/grippo-operations/references/deployment-policy.md).
SSH и передача backup: [remote-access](.agents/skills/grippo-operations/references/remote-access.md).
Скрипт механически связывает plan/attempt и выполняет новый backup, но CLI flags
не доказывают разрешение человека или фактическую остановку writes. `--plan`
читает выбранный Docker daemon; запрет подключения к серверу распространяется
и на remote Docker context.

## Проверки и завершение

Существенная задача: исследование → небольшой законченный срез → self-review →
проверки → другой reviewer → исправления → повторные проверки/review.
Shared файл имеет одного writer. Self-review не является независимым review.

Безопасная type check:
`./node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.build.json`.
Для инструкций: `python3 scripts/validate-agent-kit.py`.
Полный выбор команд и покрытие: [checks](.agents/skills/grippo-verification/references/checks.md).

Перед запуском тестов повторяй discovery и проверяй isolation: импорт AppModule
инициализирует DATA_SOURCE и может synchronize существующую DB. Новые постоянные
specs/тестовую инфраструктуру добавляй только если запрос явно включает их добавление; существующие
tests выполнять можно. Не используй lint --fix/format как read-only проверку.
Не выдавай zero tests или компиляцию за подтверждение HTTP/SQL/OAuth поведения.

Постоянные PostgreSQL regression tests находятся в `test/postgres/`.
При изменении покрытых данных, схемы, ownership, транзакций или блокировок
поддерживай соответствующие сценарии и fixtures и запускай полный
`npm run test:postgres`; критерии и изоляция — в
[checks](.agents/skills/grippo-verification/references/checks.md).
Поддержка этих существующих тестов в рамках изменения не требует нового
разрешения; посторонняя тестовая инфраструктура остаётся за пределами scope.

Перед завершением проверь итоговый diff и acceptance criteria. Исправь применимые
blocking findings; внешние ограничения укажи как незавершённые проверки/шаги.
Сообщай только фактические результаты и существенные limitations.
